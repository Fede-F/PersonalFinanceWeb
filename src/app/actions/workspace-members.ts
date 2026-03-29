"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { workspaceMembers, users } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function addWorkspaceMember(workspaceId: string, email: string, role: 'EDITOR' | 'VIEWER' = 'VIEWER') {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Verify requester is OWNER of the workspace
    const [membership] = await db
        .select()
        .from(workspaceMembers)
        .where(
            and(
                eq(workspaceMembers.workspaceId, workspaceId),
                eq(workspaceMembers.userId, session.user.id),
                eq(workspaceMembers.role, 'OWNER')
            )
        )

    if (!membership) throw new Error("Only owners can invite members")

    // Find user by email
    const [targetUser] = await db.select().from(users).where(eq(users.email, email))
    if (!targetUser) throw new Error("User not found. They must sign in first.")

    // Add to workspace
    await db.insert(workspaceMembers).values({
        workspaceId,
        userId: targetUser.id,
        role,
    }).onConflictDoNothing()

    revalidatePath(`/dashboard/workspaces/${workspaceId}`)
    return { success: true }
}
