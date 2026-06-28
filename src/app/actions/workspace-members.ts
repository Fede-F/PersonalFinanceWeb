"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { workspaceMembers, users, workspaces, notifications } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function inviteMembersToWorkspace(workspaceId: string, emails: string[]) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Fetch workspace to verify ownership and get name
    const [workspace] = await db
        .select()
        .from(workspaces)
        .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, session.user.id)))

    if (!workspace) throw new Error("Only owners can invite members")

    const senderName = session.user.name || session.user.email || "Un usuario"
    const results: Record<string, { success: boolean; message: string }> = {}

    for (const email of emails) {
        const cleanEmail = email.trim().toLowerCase()
        if (!cleanEmail) continue

        try {
            // Find target user
            const [targetUser] = await db
                .select()
                .from(users)
                .where(eq(users.email, cleanEmail))

            if (!targetUser) {
                results[cleanEmail] = {
                    success: false,
                    message: "El correo ingresado no está registrado en la aplicación"
                }
                continue
            }

            // Check if already member
            const [membership] = await db
                .select()
                .from(workspaceMembers)
                .where(
                    and(
                        eq(workspaceMembers.workspaceId, workspaceId),
                        eq(workspaceMembers.userId, targetUser.id)
                    )
                )

            if (membership) {
                results[cleanEmail] = {
                    success: false,
                    message: "El usuario ya es miembro de este espacio de trabajo"
                }
                continue
            }

            // Check if there is already a pending invitation notification
            const existingInvites = await db
                .select()
                .from(notifications)
                .where(
                    and(
                        eq(notifications.userId, targetUser.id),
                        eq(notifications.type, "WORKSPACE_INVITATION")
                    )
                )

            const alreadyPending = existingInvites.some((n) => {
                const data = (n.data || {}) as Record<string, any>
                return data.workspaceId === workspaceId && data.status === 'PENDING'
            })

            if (alreadyPending) {
                results[cleanEmail] = {
                    success: true,
                    message: "Ya hay una invitación pendiente para este usuario"
                }
                continue
            }

            // Create invitation notification
            await db.insert(notifications).values({
                userId: targetUser.id,
                type: "WORKSPACE_INVITATION",
                title: "Invitación a espacio de trabajo",
                message: `${senderName} te ha invitado a unirte a su espacio de trabajo "${workspace.name}".`,
                read: false,
                data: {
                    workspaceId: workspace.id,
                    workspaceName: workspace.name,
                    role: "EDITOR",
                    status: "PENDING"
                }
            })

            results[cleanEmail] = {
                success: true,
                message: "Invitación enviada con éxito"
            }
        } catch (err: any) {
            results[cleanEmail] = {
                success: false,
                message: err.message || "Error al procesar la invitación"
            }
        }
    }

    revalidatePath(`/dashboard`)
    return { success: true, results }
}

export async function leaveWorkspaceAction(workspaceId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Fetch workspace membership
    const [membership] = await db
        .select()
        .from(workspaceMembers)
        .where(
            and(
                eq(workspaceMembers.workspaceId, workspaceId),
                eq(workspaceMembers.userId, session.user.id)
            )
        )

    if (!membership) throw new Error("No eres miembro de este espacio de trabajo")

    if (membership.role === 'OWNER') {
        throw new Error("No puedes salir de tu propio espacio de trabajo. Puedes eliminarlo en su configuración.")
    }

    await db
        .delete(workspaceMembers)
        .where(
            and(
                eq(workspaceMembers.workspaceId, workspaceId),
                eq(workspaceMembers.userId, session.user.id)
            )
        )

    revalidatePath("/dashboard")
    return { success: true }
}

export async function removeWorkspaceMember(workspaceId: string, memberUserId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Verify requester is OWNER
    const [workspace] = await db
        .select()
        .from(workspaces)
        .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, session.user.id)))

    if (!workspace) throw new Error("Solo el dueño del espacio de trabajo puede remover miembros")

    if (memberUserId === session.user.id) {
        throw new Error("No puedes removerte a ti mismo del espacio de trabajo")
    }

    await db
        .delete(workspaceMembers)
        .where(
            and(
                eq(workspaceMembers.workspaceId, workspaceId),
                eq(workspaceMembers.userId, memberUserId)
            )
        )

    revalidatePath("/dashboard")
    return { success: true }
}

export async function getWorkspaceMembersDetails(workspaceId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    try {
        const members = await db
            .select({
                userId: users.id,
                name: users.name,
                email: users.email,
                role: workspaceMembers.role,
            })
            .from(workspaceMembers)
            .innerJoin(users, eq(workspaceMembers.userId, users.id))
            .where(eq(workspaceMembers.workspaceId, workspaceId))

        return members
    } catch (err) {
        console.error("Error fetching workspace members details:", err)
        return []
    }
}
