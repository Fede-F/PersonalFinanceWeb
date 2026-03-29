"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

export async function registerUser(formData: z.infer<typeof registerSchema>) {
    const validatedFields = registerSchema.safeParse(formData)

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors }
    }

    const { name, email, password } = validatedFields.data

    try {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        })

        if (existingUser) {
            // Si el usuario existe y ya tiene contraseña, es un duplicado
            if (existingUser.password) {
                return { error: "El email ya está registrado" }
            }

            // Si el usuario existe pero NO tiene contraseña (vino de Google/GitHub),
            // le permitimos agregar una contraseña para que pueda usar ambos métodos.
            const hashedPassword = await bcrypt.hash(password, 10)
            await db.update(users)
                .set({ password: hashedPassword, name: name || existingUser.name })
                .where(eq(users.id, existingUser.id))

            return { success: "Contraseña configurada correctamente para tu cuenta existente" }
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
        })

        return { success: "Usuario registrado correctamente" }
    } catch (error) {
        console.error("Registration error:", error)
        return { error: "Error al registrar el usuario" }
    }
}
