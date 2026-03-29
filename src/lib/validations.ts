import * as z from "zod"

export const workspaceSchema = z.object({
    name: z.string().min(1, "El nombre es requerido").max(50),
    baseCurrency: z.string().length(3, "Código de moneda inválido").default("USD"),
})

export const financialAccountSchema = z.object({
    workspaceId: z.string().uuid("ID de workspace inválido"),
    name: z.string().min(1, "El nombre es requerido").max(50),
    type: z.enum(["CASH", "BANK", "CREDIT_CARD", "INVESTMENT"]),
    currency: z.string().length(3, "Código de moneda inválido"),
})

export const transactionSchema = z.object({
    workspaceId: z.string().uuid("ID de workspace inválido"),
    accountId: z.string().uuid("ID de cuenta inválido").nullable().optional(),
    categoryId: z.string().uuid("ID de categoría inválido").nullable().optional(),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    concept: z.string().trim().min(1, "El concepto es requerido").max(100),
    amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "El monto debe ser un número positivo",
    }),
    currency: z.string().length(3, "Código de moneda inválido"),
    description: z.string().trim().max(255).nullable().optional(),

    date: z.union([z.date(), z.string(), z.null(), z.undefined()])
        .optional()
        .transform((val) => {
            if (!val) return new Date()
            const d = new Date(val)
            return isNaN(d.getTime()) ? new Date() : d
        }) as unknown as z.ZodType<Date>,
})

export const categorySchema = z.object({
    workspaceId: z.string().uuid("ID de workspace inválido"),
    name: z.string().min(1, "El nombre es requerido").max(50),
    icon: z.string().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color hexadecimal inválido").optional(),
    type: z.enum(["INCOME", "EXPENSE", "BOTH"]).default("EXPENSE"),
})
