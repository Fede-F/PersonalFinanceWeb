"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { transactions, financialAccounts, categories, supportedCurrencies, users } from "@/db/schema"
import { eq, desc, sql, gte, lte, and } from "drizzle-orm"
import { checkAndUpdateRates } from "@/lib/exchange-rates"

export async function getDashboardData(workspaceId: string, month?: number, year?: number) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("No autorizado")

    // Check and trigger background rates updates if expired
    checkAndUpdateRates()

    // 1. Auto-extension of fixed transactions
    try {
        const maxDatesByParent = await db
            .select({
                parentId: transactions.parentId,
                maxDate: sql<Date>`max(${transactions.date})`
            })
            .from(transactions)
            .where(
                and(
                    eq(transactions.workspaceId, workspaceId),
                    eq(transactions.isFixed, true)
                )
            )
            .groupBy(transactions.parentId)

        const oneYearFromNow = new Date()
        oneYearFromNow.setMonth(oneYearFromNow.getMonth() + 12)

        for (const group of maxDatesByParent) {
            if (group.parentId && group.maxDate) {
                const maxDate = new Date(group.maxDate)
                if (maxDate < oneYearFromNow) {
                    const [lastTx] = await db
                        .select()
                        .from(transactions)
                        .where(
                            and(
                                eq(transactions.parentId, group.parentId),
                                eq(transactions.date, group.maxDate)
                            )
                        )
                        .limit(1)

                    if (lastTx) {
                        const rowsToInsert = []
                        let balanceAdjustment = 0
                        const txAmountInAccountCurrency = parseFloat(lastTx.amount) * parseFloat(lastTx.exchangeRate)
                        const factor = lastTx.type === "INCOME" ? 1 : (lastTx.type === "EXPENSE" ? -1 : 0)

                        for (let i = 1; i <= 12; i++) {
                            const newDate = new Date(maxDate)
                            newDate.setMonth(maxDate.getMonth() + i)

                            rowsToInsert.push({
                                workspaceId: lastTx.workspaceId,
                                accountId: lastTx.accountId,
                                categoryId: lastTx.categoryId,
                                type: lastTx.type,
                                concept: lastTx.concept,
                                amount: lastTx.amount,
                                currency: lastTx.currency,
                                description: lastTx.description,
                                exchangeRate: lastTx.exchangeRate,
                                isFixed: true,
                                isInstallments: false,
                                parentId: lastTx.parentId,
                                date: newDate,
                            })
                            balanceAdjustment += txAmountInAccountCurrency * factor
                        }
                        if (rowsToInsert.length > 0) {
                            await db.insert(transactions).values(rowsToInsert)

                            if (lastTx.accountId && balanceAdjustment !== 0) {
                                const [account] = await db
                                    .select()
                                    .from(financialAccounts)
                                    .where(eq(financialAccounts.id, lastTx.accountId))
                                if (account) {
                                    const newBalance = parseFloat(account.balance) + balanceAdjustment
                                    await db.update(financialAccounts)
                                        .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
                                        .where(eq(financialAccounts.id, lastTx.accountId))
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error("Error auto-extending fixed transactions:", err)
    }

    // 2. Determinar el rango de fechas (default: mes actual)
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
            workspaceId: transactions.workspaceId,
            amount: transactions.amount,
            currency: transactions.currency,
            type: transactions.type,
            date: transactions.date,
            description: transactions.description,
            concept: transactions.concept,
            exchangeRate: transactions.exchangeRate,
            isFixed: transactions.isFixed,
            isInstallments: transactions.isInstallments,
            installmentsCount: transactions.installmentsCount,
            installmentNumber: transactions.installmentNumber,
            parentId: transactions.parentId,
            accountId: transactions.accountId,
            categoryId: transactions.categoryId,
            accountName: financialAccounts.name,
            categoryName: categories.name,
            categoryColor: categories.color,
            categoryIcon: categories.icon,
            createdById: transactions.createdById,
            creatorName: users.name,
            creatorEmail: users.email,
        })
        .from(transactions)
        .leftJoin(financialAccounts, eq(transactions.accountId, financialAccounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .leftJoin(users, eq(transactions.createdById, users.id))
        .where(
            and(
                eq(transactions.workspaceId, workspaceId),
                gte(transactions.date, startDate),
                lte(transactions.date, endDate)
            )
        )
        .orderBy(desc(transactions.date))

    return {
        accounts: accountsList,
        recentTransactions,
        categories: categoriesList,
        currencies: currenciesList,
        quickConcepts: quickConcepts.map(c => c.concept)
    }
}
