"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { financialAccounts, workspaceMembers } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { financialAccountSchema } from "@/lib/validations"

export async function createFinancialAccount(formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        const rawData = {
            workspaceId: formData.get("workspaceId"),
            name: formData.get("name"),
            type: formData.get("type") || "BANK",
            currency: formData.get("currency") || "USD",
        }

        const validatedData = financialAccountSchema.parse(rawData)

        // Verify member of workspace
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(and(eq(workspaceMembers.workspaceId, validatedData.workspaceId), eq(workspaceMembers.userId, session.user.id)))

        if (!membership) return { success: false, error: "No eres miembro de este workspace" }

        const [newAccount] = await db.insert(financialAccounts).values({
            ...validatedData,
            balance: "0",
        }).returning()

        revalidatePath("/dashboard")
        return { success: true, data: newAccount }
    } catch (error: any) {
        if (error.name === "ZodError") {
            return { success: false, error: error.errors[0].message }
        }
        return { success: false, error: "Error al crear la cuenta" }
    }
}

export async function getFinancialAccounts(workspaceId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return db
        .select()
        .from(financialAccounts)
        .where(eq(financialAccounts.workspaceId, workspaceId))
}

