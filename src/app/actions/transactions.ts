"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { transactions, financialAccounts, workspaceMembers, marketRates, workspaces } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { transactionSchema } from "@/lib/validations"

export async function createTransaction(formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        const rawData = {
            workspaceId: formData.get("workspaceId"),
            accountId: formData.get("accountId") || undefined,
            categoryId: formData.get("categoryId") || undefined,
            type: formData.get("type"),
            concept: formData.get("concept"),
            amount: formData.get("amount"),
            currency: formData.get("currency"),
            description: formData.get("description"),
            date: formData.get("date") || undefined,
        }


        const validation = transactionSchema.safeParse(rawData)
        
        if (!validation.success) {
            console.error("Validation failed:", validation.error.format())
            const firstError = validation.error.issues[0]
            const fieldName = firstError.path.join(".")
            return { 
                success: false, 
                error: `Error en ${fieldName}: ${firstError.message}` 
            }
        }

        const validatedData = validation.data

        // 1. Verify membership
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(and(eq(workspaceMembers.workspaceId, validatedData.workspaceId), eq(workspaceMembers.userId, session.user.id)))

        if (!membership) return { success: false, error: "No eres miembro de este workspace" }

        // 2. Fetch Workspace (for base currency)
        const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, validatedData.workspaceId))
        if (!workspace) return { success: false, error: "Espacio de trabajo no encontrado" }

        let account = null
        let exchangeRate = "1.0"
        const targetCurrency = workspace.baseCurrency

        if (validatedData.accountId) {
            const [fetchedAccount] = await db.select().from(financialAccounts).where(eq(financialAccounts.id, validatedData.accountId))
            if (fetchedAccount) account = fetchedAccount
        }

        // 3. Handle Exchange Rate normalization
        if (validatedData.currency !== targetCurrency) {
            const [rate] = await db
                .select()
                .from(marketRates)
                .where(
                    and(
                        eq(marketRates.baseCurrency, validatedData.currency),
                        eq(marketRates.targetCurrency, targetCurrency)
                    )
                )
                .orderBy(desc(marketRates.date))
                .limit(1)

            if (rate) {
                exchangeRate = rate.rate
            } else {
                exchangeRate = "1.0"
            }
        }

        // 4. Create Transaction
        const [newTransaction] = await db.insert(transactions).values({
            ...validatedData,
            accountId: validatedData.accountId || null,
            categoryId: validatedData.categoryId || null,
            description: validatedData.description || null,
            exchangeRate,
        }).returning()

        // 5. Update Account Balance (if account exists)
        if (account && validatedData.accountId) {
            const currentBalance = parseFloat(account.balance)
            const txAmountInAccountCurrency = parseFloat(validatedData.amount) * parseFloat(exchangeRate)

            let newBalance = currentBalance
            if (validatedData.type === "INCOME") {
                newBalance += txAmountInAccountCurrency
            } else if (validatedData.type === "EXPENSE") {
                newBalance -= txAmountInAccountCurrency
            }

            await db.update(financialAccounts)
                .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
                .where(eq(financialAccounts.id, validatedData.accountId))
        }

        revalidatePath("/dashboard")
        return { success: true, data: newTransaction }
    } catch (error: any) {
        console.error("Error creating transaction:", error)
        return { 
            success: false, 
            error: error.message || "Ocurrió un error inesperado al procesar la transacción" 
        }
    }
}
