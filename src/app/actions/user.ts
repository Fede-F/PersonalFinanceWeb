"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function updateDefaultCurrency(currency: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        await db.update(users)
            .set({ defaultCurrency: currency, updatedAt: new Date() })
            .where(eq(users.id, session.user.id))

        revalidatePath("/")
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Error al actualizar la moneda" }
    }
}
