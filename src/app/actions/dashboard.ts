"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { transactions, financialAccounts, categories, supportedCurrencies } from "@/db/schema"
import { eq, desc, sql, gte, lte, and } from "drizzle-orm"

export async function getDashboardData(workspaceId: string, month?: number, year?: number) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("No autorizado")

    // 1. Determinar el rango de fechas (default: mes actual)
    const now = new Date()
    const targetMonth = month !== undefined ? month : now.getMonth()
    const targetYear = year !== undefined ? year : now.getFullYear()

    const startDate = new Date(targetYear, targetMonth, 1)
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59)

    const accountsList = await db
        .select()
        .from(financialAccounts)
        .where(eq(financialAccounts.workspaceId, workspaceId))

    const categoriesList = await db
        .select()
        .from(categories)
        .where(eq(categories.workspaceId, workspaceId))

    const currenciesList = await db
        .select()
        .from(supportedCurrencies)
        .orderBy(supportedCurrencies.code)

    const quickConcepts = await db
        .select({
            concept: transactions.concept,
            count: sql<number>`count(*)`,
        })
        .from(transactions)
        .where(eq(transactions.workspaceId, workspaceId))
        .groupBy(transactions.concept)
        .having(sql`length(${transactions.concept}) < 30`)
        .orderBy(desc(sql`count(*)`))
        .limit(12)

    const recentTransactions = await db
        .select({
            id: transactions.id,
            amount: transactions.amount,
            currency: transactions.currency,
            type: transactions.type,
            date: transactions.date,
            description: transactions.description,
            concept: transactions.concept,
            exchangeRate: transactions.exchangeRate,
            accountName: financialAccounts.name,
            categoryName: categories.name,
            categoryColor: categories.color,
            categoryIcon: categories.icon,
        })
        .from(transactions)
        .leftJoin(financialAccounts, eq(transactions.accountId, financialAccounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
            and(
                eq(transactions.workspaceId, workspaceId),
                gte(transactions.date, startDate),
                lte(transactions.date, endDate)
            )
        )
        .orderBy(desc(transactions.date))
        .limit(10)

    return {
        accounts: accountsList,
        recentTransactions,
        categories: categoriesList,
        currencies: currenciesList,
        quickConcepts: quickConcepts.map(c => c.concept)
    }
}
