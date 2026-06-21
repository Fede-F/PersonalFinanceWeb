"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { workspaces, workspaceMembers, users } from "@/db/schema"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { workspaceSchema } from "@/lib/validations"

export async function createWorkspace(formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        const rawData = {
            name: formData.get("name"),
            baseCurrency: formData.get("baseCurrency") || "USD",
        }

        const validatedData = workspaceSchema.parse(rawData)

        const [newWorkspace] = await db.insert(workspaces).values({
            ...validatedData,
            ownerId: session.user.id,
        }).returning()

        await db.insert(workspaceMembers).values({
            workspaceId: newWorkspace.id,
            userId: session.user.id,
            role: "OWNER",
        })

        // Sincronizar la moneda por defecto del usuario con su primer workspace
        await db.update(users)
            .set({ defaultCurrency: validatedData.baseCurrency })
            .where(eq(users.id, session.user.id))

        revalidatePath("/dashboard")
        return { success: true, data: newWorkspace }
    } catch (error: any) {
        if (error.name === "ZodError") {
            return { success: false, error: error.errors[0].message }
        }
        return { success: false, error: "Error al crear el workspace" }
    }
}

export async function updateWorkspace(workspaceId: string, name: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        const trimmedName = name?.trim()
        if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 50) {
            return { success: false, error: "El nombre debe tener entre 1 y 50 caracteres" }
        }

        const [workspace] = await db
            .select()
            .from(workspaces)
            .where(eq(workspaces.id, workspaceId))

        if (!workspace) return { success: false, error: "Workspace no encontrado" }
        if (workspace.ownerId !== session.user.id) {
            return { success: false, error: "Solo el dueño puede modificar este espacio" }
        }

        await db.update(workspaces)
            .set({ name: trimmedName, updatedAt: new Date() })
            .where(eq(workspaces.id, workspaceId))

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Error updating workspace:", error)
        return { success: false, error: "Error al renombrar el espacio de trabajo" }
    }
}

export async function deleteWorkspace(workspaceId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        const [workspace] = await db
            .select()
            .from(workspaces)
            .where(eq(workspaces.id, workspaceId))

        if (!workspace) return { success: false, error: "Workspace no encontrado" }
        if (workspace.ownerId !== session.user.id) {
            return { success: false, error: "Solo el dueño puede eliminar este espacio" }
        }

        await db.delete(workspaces).where(eq(workspaces.id, workspaceId))

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Error deleting workspace:", error)
        return { success: false, error: "Error al eliminar el espacio de trabajo" }
    }
}

