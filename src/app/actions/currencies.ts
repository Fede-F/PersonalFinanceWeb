"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { supportedCurrencies } from "@/db/schema"
import { revalidatePath } from "next/cache"

export async function getSupportedCurrencies() {
    return db.select().from(supportedCurrencies).orderBy(supportedCurrencies.code)
}

export async function createSupportedCurrency(code: string, name?: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const upperCode = code.toUpperCase().trim()
    if (upperCode.length < 2 || upperCode.length > 5) throw new Error("Invalid currency code")

    const [newCurrency] = await db.insert(supportedCurrencies).values({
        code: upperCode,
        name: name || upperCode,
        type: "FIAT",
    })
        .onConflictDoNothing()
        .returning()

    if (!newCurrency) {
        // If it already existed, just return the existing one
        const existing = await db.query.supportedCurrencies.findFirst({
            where: (currencies, { eq }) => eq(currencies.code, upperCode)
        })
        return existing
    }

    revalidatePath("/dashboard")
    return newCurrency
}
