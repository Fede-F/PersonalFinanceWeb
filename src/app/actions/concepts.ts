"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { conceptBlacklist, workspaceMembers } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function blacklistConcept(workspaceId: string, concept: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    if (!workspaceId || !concept) throw new Error("Missing required fields")

    // Check membership
    const [membership] = await db
        .select()
        .from(workspaceMembers)
        .where(
            and(
                eq(workspaceMembers.workspaceId, workspaceId),
                eq(workspaceMembers.userId, session.user.id)
            )
        )

    if (!membership) throw new Error("Not a member of this workspace")

    const trimmedConcept = concept.trim()

    // Insert on conflict do nothing
    await db.insert(conceptBlacklist).values({
        workspaceId,
        concept: trimmedConcept,
    }).onConflictDoNothing()

    revalidatePath("/dashboard")
    return { success: true }
}
