"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { notifications, workspaceMembers } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
    const session = await auth()
    if (!session?.user?.id) return []

    try {
        return await db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, session.user.id))
            .orderBy(desc(notifications.createdAt))
    } catch (error) {
        console.error("Error fetching notifications:", error)
        return []
    }
}

export async function markAsRead(notificationId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)))

    revalidatePath("/dashboard")
    return { success: true }
}

export async function deleteNotification(notificationId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await db
        .delete(notifications)
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)))

    revalidatePath("/dashboard")
    return { success: true }
}

export async function respondToInvitation(notificationId: string, accept: boolean) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Fetch notification to retrieve data
    const [notification] = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)))

    if (!notification) throw new Error("Notification not found")
    if (notification.type !== "WORKSPACE_INVITATION") throw new Error("Invalid notification type")

    const data = notification.data || {}
    const { workspaceId, role = 'EDITOR' } = data

    if (!workspaceId) throw new Error("Workspace ID missing from invitation data")

    if (accept) {
        // Add user to workspace members
        await db.insert(workspaceMembers).values({
            workspaceId,
            userId: session.user.id,
            role: role as 'EDITOR' | 'VIEWER',
        }).onConflictDoNothing()

        // Update notification status
        await db
            .update(notifications)
            .set({
                read: true,
                data: { ...data, status: 'ACCEPTED' }
            })
            .where(eq(notifications.id, notificationId))
    } else {
        // Update notification status
        await db
            .update(notifications)
            .set({
                read: true,
                data: { ...data, status: 'REJECTED' }
            })
            .where(eq(notifications.id, notificationId))
    }

    revalidatePath("/dashboard")
    return { success: true }
}

export async function undoInvitationResponse(notificationId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const [notification] = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)))

    if (!notification) throw new Error("Notification not found")
    if (notification.type !== "WORKSPACE_INVITATION") throw new Error("Invalid notification type")

    const data = notification.data || {}
    const { workspaceId, status } = data

    if (!workspaceId) throw new Error("Workspace ID missing from invitation data")

    if (status === 'ACCEPTED') {
        // Remove user from workspace members
        await db
            .delete(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, workspaceId),
                    eq(workspaceMembers.userId, session.user.id)
                )
            )
    }

    // Reset status to PENDING
    await db
        .update(notifications)
        .set({
            data: { ...data, status: 'PENDING' }
        })
        .where(eq(notifications.id, notificationId))

    revalidatePath("/dashboard")
    return { success: true }
}
