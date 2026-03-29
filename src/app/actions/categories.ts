"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { categories, workspaceMembers } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function createCategory(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const workspaceId = formData.get("workspaceId") as string
    const name = formData.get("name") as string
    const icon = formData.get("icon") as string
    const color = formData.get("color") as string
    const type = (formData.get("type") as string) || "EXPENSE"

    if (!workspaceId || !name) throw new Error("Missing required fields")

    const [membership] = await db
        .select()
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, session.user.id)))

    if (!membership) throw new Error("Not a member of this workspace")

    const [newCategory] = await db.insert(categories).values({
        workspaceId,
        name,
        icon,
        color,
        type,
    }).returning()

    revalidatePath("/dashboard")
    return newCategory
}

export async function getCategories(workspaceId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return db
        .select()
        .from(categories)
        .where(eq(categories.workspaceId, workspaceId))
}
