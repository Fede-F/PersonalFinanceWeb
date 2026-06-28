"use server"

import { randomUUID } from "crypto"
import { auth } from "@/auth"
import { db } from "@/db"
import { transactions, financialAccounts, workspaceMembers, marketRates, workspaces } from "@/db/schema"
import { eq, and, desc, inArray, gte, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { transactionSchema } from "@/lib/validations"

import { encryptAmount, decryptAmount } from "@/lib/encryption"

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
            isFixed: formData.get("isFixed") === "true",
            isInstallments: formData.get("isInstallments") === "true",
            installmentsCount: formData.get("installmentsCount") || undefined,
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

        // 4. Create Transactions (Single, Fixed or Installments)
        let insertedTransactions: any[] = []
        let balanceAdjustment = 0

        const numericAmount = parseFloat(validatedData.amount)
        const txAmountInAccountCurrency = numericAmount * parseFloat(exchangeRate)
        const factor = validatedData.type === "INCOME" ? 1 : (validatedData.type === "EXPENSE" ? -1 : 0)

        const baseId = randomUUID()
        const parentId = (validatedData.isFixed || validatedData.isInstallments) ? baseId : null
        
        // Encrypt the amount for database storage
        const encryptedAmount = encryptAmount(validatedData.amount)

        if (validatedData.isFixed) {
            // Generate 24 months of transactions
            const rowsToInsert = []
            const startDate = validatedData.date ? new Date(validatedData.date) : new Date()

            for (let i = 0; i < 24; i++) {
                const date = new Date(startDate)
                date.setMonth(startDate.getMonth() + i)

                rowsToInsert.push({
                    ...validatedData,
                    amount: encryptedAmount,
                    id: i === 0 ? baseId : randomUUID(),
                    parentId,
                    installmentNumber: null,
                    date,
                    accountId: validatedData.accountId || null,
                    categoryId: validatedData.categoryId || null,
                    description: validatedData.description || null,
                    exchangeRate,
                    createdById: session.user.id,
                })
                balanceAdjustment += txAmountInAccountCurrency * factor
            }
            insertedTransactions = await db.insert(transactions).values(rowsToInsert).returning()
        } else if (validatedData.isInstallments && validatedData.installmentsCount) {
            // Generate N installments
            const rowsToInsert = []
            const startDate = validatedData.date ? new Date(validatedData.date) : new Date()
            const totalInstallments = validatedData.installmentsCount

            for (let i = 0; i < totalInstallments; i++) {
                const date = new Date(startDate)
                date.setMonth(startDate.getMonth() + i)

                rowsToInsert.push({
                    ...validatedData,
                    amount: encryptedAmount,
                    id: i === 0 ? baseId : randomUUID(),
                    parentId,
                    installmentNumber: i + 1,
                    date,
                    accountId: validatedData.accountId || null,
                    categoryId: validatedData.categoryId || null,
                    description: validatedData.description || null,
                    exchangeRate,
                    createdById: session.user.id,
                })
                balanceAdjustment += txAmountInAccountCurrency * factor
            }
            insertedTransactions = await db.insert(transactions).values(rowsToInsert).returning()
        } else {
            // Single transaction
            const [newTransaction] = await db.insert(transactions).values({
                ...validatedData,
                amount: encryptedAmount,
                id: baseId,
                parentId: null,
                installmentNumber: null,
                accountId: validatedData.accountId || null,
                categoryId: validatedData.categoryId || null,
                description: validatedData.description || null,
                exchangeRate,
                createdById: session.user.id,
            }).returning()
            insertedTransactions = [newTransaction]
            balanceAdjustment = txAmountInAccountCurrency * factor
        }

        // 5. Update Account Balance (if account exists)
        if (account && validatedData.accountId && balanceAdjustment !== 0) {
            const currentBalance = parseFloat(account.balance)
            const newBalance = currentBalance + balanceAdjustment
            await db.update(financialAccounts)
                .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
                .where(eq(financialAccounts.id, validatedData.accountId))
        }

        revalidatePath("/dashboard")
        return { success: true, data: insertedTransactions[0] }
    } catch (error: any) {
        console.error("Error creating transaction:", error)
        return { 
            success: false, 
            error: error.message || "Ocurrió un error inesperado al procesar la transacción" 
        }
    }
}

export async function deleteTransaction(transactionId: string, deleteMode: 'single' | 'subsequent') {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        // Find the transaction to delete
        const [targetTx] = await db.select().from(transactions).where(eq(transactions.id, transactionId))
        if (!targetTx) return { success: false, error: "Transacción no encontrada" }

        // Decrypt amount
        targetTx.amount = decryptAmount(targetTx.amount)

        // Verify membership
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(and(eq(workspaceMembers.workspaceId, targetTx.workspaceId), eq(workspaceMembers.userId, session.user.id)))

        if (!membership) return { success: false, error: "No autorizado" }

        let txsToDelete = []
        if (deleteMode === 'subsequent' && targetTx.parentId) {
            const rawTxs = await db
                .select()
                .from(transactions)
                .where(
                    and(
                        eq(transactions.parentId, targetTx.parentId),
                        gte(transactions.date, targetTx.date)
                    )
                )
            txsToDelete = rawTxs.map(tx => ({
                ...tx,
                amount: decryptAmount(tx.amount)
            }))
        } else {
            txsToDelete = [targetTx]
        }

        // Calculate balance adjustment
        let balanceAdjustment = 0
        const factor = targetTx.type === "INCOME" ? -1 : (targetTx.type === "EXPENSE" ? 1 : 0)

        // Group adjustments by account
        const accountAdjustments: Record<string, number> = {}

        for (const tx of txsToDelete) {
            if (tx.accountId) {
                const txAmountInAccountCurrency = parseFloat(tx.amount) * parseFloat(tx.exchangeRate)
                accountAdjustments[tx.accountId] = (accountAdjustments[tx.accountId] || 0) + (txAmountInAccountCurrency * factor)
            }
        }

        // Delete transactions
        const idsToDelete = txsToDelete.map(t => t.id)
        if (idsToDelete.length > 0) {
            await db.delete(transactions).where(inArray(transactions.id, idsToDelete))
        }

        // Update balances
        for (const [accountId, adj] of Object.entries(accountAdjustments)) {
            const [account] = await db.select().from(financialAccounts).where(eq(financialAccounts.id, accountId))
            if (account) {
                const newBalance = parseFloat(account.balance) + adj
                await db.update(financialAccounts)
                    .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
                    .where(eq(financialAccounts.id, accountId))
            }
        }

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting transaction:", error)
        return { success: false, error: error.message || "Error al eliminar la transacción" }
    }
}

export async function updateTransaction(
    transactionId: string,
    formData: FormData,
    updateMode: 'single' | 'subsequent'
) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        // Find the transaction to edit
        const [targetTx] = await db.select().from(transactions).where(eq(transactions.id, transactionId))
        if (!targetTx) return { success: false, error: "Transacción no encontrada" }

        // Decrypt amount
        targetTx.amount = decryptAmount(targetTx.amount)

        // Verify membership
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(and(eq(workspaceMembers.workspaceId, targetTx.workspaceId), eq(workspaceMembers.userId, session.user.id)))

        if (!membership) return { success: false, error: "No autorizado" }

        const rawData = {
            workspaceId: targetTx.workspaceId,
            accountId: formData.get("accountId") || undefined,
            categoryId: formData.get("categoryId") || undefined,
            type: formData.get("type"),
            concept: formData.get("concept"),
            amount: formData.get("amount"),
            currency: formData.get("currency"),
            description: formData.get("description"),
            date: formData.get("date") || undefined,
            isFixed: formData.get("isFixed") === "true",
            isInstallments: formData.get("isInstallments") === "true",
            installmentsCount: formData.get("installmentsCount") || undefined,
        }

        const validation = transactionSchema.safeParse(rawData)
        if (!validation.success) {
            const firstError = validation.error.issues[0]
            return { success: false, error: `Error: ${firstError.message}` }
        }

        const validatedData = validation.data

        // Fetch Workspace (for base currency)
        const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, validatedData.workspaceId))
        if (!workspace) return { success: false, error: "Espacio de trabajo no encontrado" }

        let exchangeRate = "1.0"
        const targetCurrency = workspace.baseCurrency

        // Handle Exchange Rate normalization
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
            }
        }

        const oldFactor = targetTx.type === "INCOME" ? 1 : (targetTx.type === "EXPENSE" ? -1 : 0)
        const newFactor = validatedData.type === "INCOME" ? 1 : (validatedData.type === "EXPENSE" ? -1 : 0)

        if (updateMode === 'single') {
            // Update only this transaction
            if (targetTx.accountId) {
                const oldAmount = parseFloat(targetTx.amount) * parseFloat(targetTx.exchangeRate)
                await adjustAccountBalance(targetTx.accountId, -oldAmount * oldFactor)
            }

            await db.update(transactions)
                .set({
                    ...validatedData,
                    amount: encryptAmount(validatedData.amount),
                    exchangeRate,
                    accountId: validatedData.accountId || null,
                    categoryId: validatedData.categoryId || null,
                    description: validatedData.description || null,
                    updatedAt: new Date()
                })
                .where(eq(transactions.id, transactionId))

            if (validatedData.accountId) {
                const newAmount = parseFloat(validatedData.amount) * parseFloat(exchangeRate)
                await adjustAccountBalance(validatedData.accountId, newAmount * newFactor)
            }
        } else {
            // Update this and all subsequent transactions in the group (parentId)
            if (!targetTx.parentId) {
                return { success: false, error: "Esta transacción no forma parte de un grupo recurrente" }
            }

            // Fetch subsequent transactions in the group
            const rawSubsequentTxs = await db
                .select()
                .from(transactions)
                .where(
                    and(
                        eq(transactions.parentId, targetTx.parentId),
                        gte(transactions.date, targetTx.date)
                    )
                )
            const subsequentTxs = rawSubsequentTxs.map(tx => ({
                ...tx,
                amount: decryptAmount(tx.amount)
            }))

            // Revert all balances for these subsequent transactions
            for (const tx of subsequentTxs) {
                if (tx.accountId) {
                    const oldAmount = parseFloat(tx.amount) * parseFloat(tx.exchangeRate)
                    await adjustAccountBalance(tx.accountId, -oldAmount * oldFactor)
                }
            }

            // If we transitioned to unchecking isInstallments:
            if (!validatedData.isInstallments && targetTx.isInstallments) {
                // Delete all subsequent ones
                const idsToDelete = subsequentTxs.filter(t => t.id !== targetTx.id).map(t => t.id)
                if (idsToDelete.length > 0) {
                    await db.delete(transactions).where(inArray(transactions.id, idsToDelete))
                }

                // Update only this transaction, setting isInstallments to false and installmentsCount to null
                await db.update(transactions)
                    .set({
                        ...validatedData,
                        amount: encryptAmount(validatedData.amount),
                        isInstallments: false,
                        installmentsCount: null,
                        installmentNumber: null,
                        parentId: null,
                        exchangeRate,
                        accountId: validatedData.accountId || null,
                        categoryId: validatedData.categoryId || null,
                        description: validatedData.description || null,
                        updatedAt: new Date()
                    })
                    .where(eq(transactions.id, targetTx.id))

                if (validatedData.accountId) {
                    const newAmount = parseFloat(validatedData.amount) * parseFloat(exchangeRate)
                    await adjustAccountBalance(validatedData.accountId, newAmount * newFactor)
                }
            }
            // If it's installments and count changed:
            else if (validatedData.isInstallments && validatedData.installmentsCount && targetTx.isInstallments) {
                const newCount = validatedData.installmentsCount
                const oldCount = targetTx.installmentsCount || 1

                if (newCount !== oldCount) {
                    // Update installments count in all group transactions
                    await db.update(transactions)
                        .set({ installmentsCount: newCount })
                        .where(eq(transactions.parentId, targetTx.parentId))
                    
                    if (newCount > oldCount) {
                        // Add extra installments
                        const firstTxList = await db.select().from(transactions).where(and(eq(transactions.parentId, targetTx.parentId), eq(transactions.installmentNumber, 1)))
                        const firstTx = firstTxList[0] || targetTx
                        const startDate = new Date(firstTx.date)
                        const rowsToInsert = []

                        for (let i = oldCount; i < newCount; i++) {
                            const date = new Date(startDate)
                            date.setMonth(startDate.getMonth() + i)

                            rowsToInsert.push({
                                ...validatedData,
                                amount: encryptAmount(validatedData.amount),
                                id: randomUUID(),
                                parentId: targetTx.parentId,
                                installmentNumber: i + 1,
                                date,
                                accountId: validatedData.accountId || null,
                                categoryId: validatedData.categoryId || null,
                                description: validatedData.description || null,
                                exchangeRate,
                            })
                        }
                        if (rowsToInsert.length > 0) {
                            await db.insert(transactions).values(rowsToInsert)
                        }
                    } else {
                        // Delete installments larger than newCount
                        await db.delete(transactions)
                            .where(
                                and(
                                    eq(transactions.parentId, targetTx.parentId),
                                    sql`${transactions.installmentNumber} > ${newCount}`
                                )
                            )
                    }
                }

                // Update all remaining subsequent ones with the common edits
                const remainingSubsequent = await db
                    .select()
                    .from(transactions)
                    .where(
                        and(
                            eq(transactions.parentId, targetTx.parentId),
                            gte(transactions.date, targetTx.date)
                        )
                    )

                for (const tx of remainingSubsequent) {
                    await db.update(transactions)
                        .set({
                            concept: validatedData.concept,
                            amount: encryptAmount(validatedData.amount),
                            currency: validatedData.currency,
                            categoryId: validatedData.categoryId || null,
                            accountId: validatedData.accountId || null,
                            description: validatedData.description || null,
                            exchangeRate,
                            updatedAt: new Date()
                        })
                        .where(eq(transactions.id, tx.id))

                    if (validatedData.accountId) {
                        const newAmount = parseFloat(validatedData.amount) * parseFloat(exchangeRate)
                        await adjustAccountBalance(validatedData.accountId, newAmount * newFactor)
                    }
                }
            } else {
                // For other cases (e.g. fixed transaction edits)
                for (const tx of subsequentTxs) {
                    await db.update(transactions)
                        .set({
                            concept: validatedData.concept,
                            amount: encryptAmount(validatedData.amount),
                            currency: validatedData.currency,
                            categoryId: validatedData.categoryId || null,
                            accountId: validatedData.accountId || null,
                            description: validatedData.description || null,
                            exchangeRate,
                            updatedAt: new Date()
                        })
                        .where(eq(transactions.id, tx.id))

                    if (validatedData.accountId) {
                        const newAmount = parseFloat(validatedData.amount) * parseFloat(exchangeRate)
                        await adjustAccountBalance(validatedData.accountId, newAmount * newFactor)
                    }
                }
            }
        }

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error: any) {
        console.error("Error updating transaction:", error)
        return { success: false, error: error.message || "Error al actualizar la transacción" }
    }
}

async function adjustAccountBalance(accountId: string, adjustment: number) {
    if (adjustment === 0) return
    const [account] = await db.select().from(financialAccounts).where(eq(financialAccounts.id, accountId))
    if (account) {
        const newBalance = parseFloat(account.balance) + adjustment
        await db.update(financialAccounts)
            .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
            .where(eq(financialAccounts.id, accountId))
    }
}
