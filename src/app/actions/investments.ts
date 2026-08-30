"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import {
    investmentAssets,
    investmentTransactions,
    workspaces,
    workspaceMembers,
    supportedCurrencies,
    marketRates,
    transactions,
    categories,
} from "@/db/schema"
import { eq, and, desc, asc, inArray, sql, isNull, or, ilike } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { encryptAmount, decryptAmount } from "@/lib/encryption"
import { getOrUpdateAssetPrices, getAssetHistory, searchOnlineMarketAssets, MarketSearchResult } from "@/lib/investment-rates"
import { checkAndUpdateRates } from "@/lib/exchange-rates"

const convertAmount = (
    amount: number,
    from: string,
    to: string,
    ratesMap: Record<string, Record<string, number>>
): number => {
    if (from === to || !amount) return amount
    const f = from.toUpperCase()
    const t = to.toUpperCase()
    if (f === t) return amount

    // 1. Direct rate
    const directRate = ratesMap[f]?.[t]
    if (directRate !== undefined && directRate > 0) return amount * directRate

    // 2. Inverse direct rate (e.g. if only USD -> ARS is in ratesMap at 1300, then ARS -> USD is 1/1300)
    const inverseDirectRate = ratesMap[t]?.[f]
    if (inverseDirectRate !== undefined && inverseDirectRate > 0) return amount / inverseDirectRate

    // 3. Via USD intermediate bridge
    const rateToUSD = ratesMap[f]?.["USD"] ?? (ratesMap["USD"]?.[f] ? 1 / ratesMap["USD"][f] : undefined)
    const rateFromUSD = ratesMap["USD"]?.[t] ?? (ratesMap[t]?.["USD"] ? 1 / ratesMap[t]["USD"] : undefined)
    if (rateToUSD !== undefined && rateFromUSD !== undefined && rateToUSD > 0 && rateFromUSD > 0) {
        return amount * rateToUSD * rateFromUSD
    }

    // 4. Default realistic market fallbacks if ratesMap is empty / unseeded
    if (f === "ARS" && t === "USD") return amount / 1300
    if (f === "USD" && t === "ARS") return amount * 1300
    if (f === "EUR" && t === "USD") return amount * 1.08
    if (f === "USD" && t === "EUR") return amount / 1.08
    if (f === "BRL" && t === "USD") return amount / 5.5
    if (f === "USD" && t === "BRL") return amount * 5.5

    return amount
}

export async function searchMarketAssets(
    query: string,
    workspaceId?: string
): Promise<{ success: boolean; results?: MarketSearchResult[]; error?: string }> {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        const q = query.trim()

        // 1. If query is empty: Return recent assets used in transactions + popular defaults
        if (!q) {
            let recentAssetIds: string[] = []

            if (workspaceId) {
                const recentTxs = await db
                    .select({ assetId: investmentTransactions.assetId })
                    .from(investmentTransactions)
                    .where(eq(investmentTransactions.workspaceId, workspaceId))
                    .orderBy(desc(investmentTransactions.date))
                    .limit(10)

                recentAssetIds = Array.from(new Set(recentTxs.map((t) => t.assetId)))
            }

            let recentAssets: any[] = []
            if (recentAssetIds.length > 0) {
                recentAssets = await db
                    .select()
                    .from(investmentAssets)
                    .where(inArray(investmentAssets.id, recentAssetIds))
            }

            // Also include popular default assets if not already included
            const popularSymbols = ["BTC", "ETH", "SPY.BA", "AAPL", "GGAL.BA", "MELI.BA", "SOL", "NVDA"]
            const popularAssets = await db
                .select()
                .from(investmentAssets)
                .where(
                    and(
                        inArray(investmentAssets.symbol, popularSymbols),
                        isNull(investmentAssets.workspaceId)
                    )
                )
                .limit(8)

            // Combine recent + popular
            const seenIds = new Set<string>()
            const combined: MarketSearchResult[] = []

            for (const a of recentAssets) {
                if (!seenIds.has(a.id)) {
                    seenIds.add(a.id)
                    combined.push({
                        id: a.id,
                        symbol: a.symbol,
                        name: a.name,
                        assetType: a.assetType as any,
                        defaultCurrency: a.defaultCurrency,
                        isRecent: true,
                        isLocal: true,
                    })
                }
            }

            for (const a of popularAssets) {
                if (!seenIds.has(a.id)) {
                    seenIds.add(a.id)
                    combined.push({
                        id: a.id,
                        symbol: a.symbol,
                        name: a.name,
                        assetType: a.assetType as any,
                        defaultCurrency: a.defaultCurrency,
                        isRecent: false,
                        isLocal: true,
                    })
                }
            }

            // Fetch live prices for quick display
            const symbols = combined.map((c) => c.symbol)
            const prices = await getOrUpdateAssetPrices(symbols)
            for (const item of combined) {
                const p = prices[item.symbol.toUpperCase()]
                if (p) {
                    item.currentPrice = p.price
                    item.defaultCurrency = p.currency || item.defaultCurrency
                    item.change24hPct = p.change24hPct
                }
            }

            return { success: true, results: combined }
        }

        // 2. Query is not empty: Search local DB and online APIs
        const localConditions = [
            eq(investmentAssets.isActive, true),
            or(
                ilike(investmentAssets.symbol, `%${q}%`),
                ilike(investmentAssets.name, `%${q}%`)
            )!,
        ]

        if (workspaceId) {
            localConditions.push(
                or(isNull(investmentAssets.workspaceId), eq(investmentAssets.workspaceId, workspaceId))!
            )
        }

        const [localMatches, onlineMatches] = await Promise.all([
            db
                .select()
                .from(investmentAssets)
                .where(and(...localConditions))
                .limit(8),
            searchOnlineMarketAssets(q),
        ])

        const seenSymbols = new Set<string>()
        const results: MarketSearchResult[] = []

        // Local matches first
        for (const loc of localMatches) {
            const sym = loc.symbol.toUpperCase()
            seenSymbols.add(sym)
            results.push({
                id: loc.id,
                symbol: loc.symbol,
                name: loc.name,
                assetType: loc.assetType as any,
                defaultCurrency: loc.defaultCurrency,
                isLocal: true,
            })
        }

        // Online matches next
        for (const onl of onlineMatches) {
            const sym = onl.symbol.toUpperCase()
            if (!seenSymbols.has(sym)) {
                seenSymbols.add(sym)
                results.push(onl)
            }
        }

        // Fetch live prices for top results
        const symbolsToPrice = results.slice(0, 10).map((r) => r.symbol)
        if (symbolsToPrice.length > 0) {
            const prices = await getOrUpdateAssetPrices(symbolsToPrice)
            for (const item of results) {
                const p = prices[item.symbol.toUpperCase()]
                if (p) {
                    item.currentPrice = p.price
                    item.defaultCurrency = p.currency || item.defaultCurrency
                    item.change24hPct = p.change24hPct
                }
            }
        }

        return { success: true, results }
    } catch (err: any) {
        console.error("Error in searchMarketAssets:", err)
        return { success: false, error: err.message || "Error al buscar activos" }
    }
}

export async function getOrCreateAsset(data: {
    id?: string
    symbol: string
    name: string
    assetType?: string
    defaultCurrency?: string
    workspaceId?: string
}): Promise<{ success: boolean; asset?: any; error?: string }> {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        const symbol = data.symbol.toUpperCase().trim()

        // 1. If id provided, check if exists
        if (data.id) {
            const [existing] = await db
                .select()
                .from(investmentAssets)
                .where(eq(investmentAssets.id, data.id))

            if (existing) return { success: true, asset: existing }
        }

        // 2. Check by symbol in global or workspace
        const [found] = await db
            .select()
            .from(investmentAssets)
            .where(
                and(
                    eq(investmentAssets.symbol, symbol),
                    or(
                        isNull(investmentAssets.workspaceId),
                        data.workspaceId ? eq(investmentAssets.workspaceId, data.workspaceId) : isNull(investmentAssets.workspaceId)
                    )
                )
            )
            .limit(1)

        if (found) return { success: true, asset: found }

        // 3. Create asset
        const [newAsset] = await db
            .insert(investmentAssets)
            .values({
                workspaceId: data.workspaceId || null,
                symbol,
                name: data.name || symbol,
                assetType: data.assetType || "STOCK",
                defaultCurrency: data.defaultCurrency || "USD",
                isActive: true,
            })
            .returning()

        return { success: true, asset: newAsset }
    } catch (err: any) {
        console.error("Error in getOrCreateAsset:", err)
        return { success: false, error: err.message || "Error al registrar activo" }
    }
}

export async function getAvailableAssets(workspaceId?: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        const conditions = [eq(investmentAssets.isActive, true)]

        if (workspaceId) {
            conditions.push(
                or(isNull(investmentAssets.workspaceId), eq(investmentAssets.workspaceId, workspaceId))!
            )
        } else {
            conditions.push(isNull(investmentAssets.workspaceId))
        }

        const assets = await db
            .select()
            .from(investmentAssets)
            .where(and(...conditions))
            .orderBy(investmentAssets.assetType, investmentAssets.symbol)

        return { success: true, assets }
    } catch (err: any) {
        console.error("Error fetching available assets:", err)
        return { success: false, error: err.message || "Error al obtener activos" }
    }
}

export async function createCustomAsset(formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        const workspaceId = formData.get("workspaceId") as string
        const symbol = (formData.get("symbol") as string)?.toUpperCase().trim()
        const name = (formData.get("name") as string)?.trim()
        const assetType = (formData.get("assetType") as string) || "STOCK"
        const defaultCurrency = (formData.get("defaultCurrency") as string) || "USD"

        if (!symbol || !name) {
            return { success: false, error: "Símbolo y nombre son obligatorios" }
        }

        // Verify membership if workspaceId is provided
        if (workspaceId) {
            const [membership] = await db
                .select()
                .from(workspaceMembers)
                .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, session.user.id)))

            if (!membership || membership.role === "VIEWER") {
                return { success: false, error: "Permisos insuficientes" }
            }
        }

        const [newAsset] = await db
            .insert(investmentAssets)
            .values({
                workspaceId: workspaceId || null,
                symbol,
                name,
                assetType,
                defaultCurrency,
                isActive: true,
            })
            .returning()

        revalidatePath("/investments")
        return { success: true, asset: newAsset }
    } catch (err: any) {
        console.error("Error creating custom asset:", err)
        return { success: false, error: err.message || "Error al crear activo" }
    }
}

export async function createInvestmentTransaction(formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        const workspaceId = formData.get("workspaceId") as string
        const assetId = formData.get("assetId") as string
        const type = (formData.get("type") as string) || "BUY"
        const quantityRaw = formData.get("quantity") as string
        const unitPriceRaw = formData.get("unitPrice") as string
        const currency = (formData.get("currency") as string) || "USD"
        const dateRaw = formData.get("date") as string
        const notes = (formData.get("notes") as string) || null
        const feesRaw = (formData.get("fees") as string) || "0"

        const discountFromWorkspace = formData.get("discountFromWorkspace") === "true"
        const targetExpenseWorkspaceId = formData.get("targetExpenseWorkspaceId") as string

        if (!workspaceId || !assetId || !quantityRaw || !unitPriceRaw) {
            return { success: false, error: "Todos los campos requeridos deben completarse" }
        }

        // 1. Verify membership
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, session.user.id)))

        if (!membership || membership.role === "VIEWER") {
            return { success: false, error: "No tienes permisos para operar en este espacio" }
        }

        // 2. Fetch asset details
        const [asset] = await db
            .select()
            .from(investmentAssets)
            .where(eq(investmentAssets.id, assetId))

        if (!asset) return { success: false, error: "Activo no encontrado" }

        const quantity = parseFloat(quantityRaw)
        const unitPrice = parseFloat(unitPriceRaw)
        const fees = parseFloat(feesRaw) || 0

        if (isNaN(quantity) || quantity <= 0 || isNaN(unitPrice) || unitPrice < 0) {
            return { success: false, error: "Cantidad y precio deben ser valores numéricos válidos" }
        }

        const totalAmount = quantity * unitPrice + (type === "BUY" ? fees : -fees)
        const txDate = dateRaw ? new Date(dateRaw) : new Date()

        // 3. Encrypt sensitive values
        const encryptedQuantity = encryptAmount(quantity.toString())
        const encryptedUnitPrice = encryptAmount(unitPrice.toString())
        const encryptedTotalAmount = encryptAmount(totalAmount.toString())
        const encryptedFees = encryptAmount(fees.toString())

        let linkedTransactionId: string | null = null

        // 4. Optional: discount from workspace expenses balance
        if (discountFromWorkspace && targetExpenseWorkspaceId && type === "BUY") {
            const [expenseMembership] = await db
                .select()
                .from(workspaceMembers)
                .where(
                    and(
                        eq(workspaceMembers.workspaceId, targetExpenseWorkspaceId),
                        eq(workspaceMembers.userId, session.user.id)
                    )
                )

            if (expenseMembership && expenseMembership.role !== "VIEWER") {
                // Find or use general category
                const [invCategory] = await db
                    .select()
                    .from(categories)
                    .where(
                        and(
                            eq(categories.workspaceId, targetExpenseWorkspaceId),
                            eq(categories.name, "Inversiones")
                        )
                    )
                    .limit(1)

                const [insertedTx] = await db
                    .insert(transactions)
                    .values({
                        workspaceId: targetExpenseWorkspaceId,
                        categoryId: invCategory?.id || null,
                        type: "EXPENSE",
                        concept: `Inversión: Compra ${asset.symbol}`,
                        amount: encryptAmount(totalAmount.toFixed(2)),
                        currency: currency,
                        exchangeRate: "1.0",
                        date: txDate,
                        description: `Compra de ${quantity} ${asset.symbol} @ ${unitPrice} ${currency}`,
                        createdById: session.user.id,
                    })
                    .returning()

                if (insertedTx) {
                    linkedTransactionId = insertedTx.id
                }
            }
        }

        // 5. Insert investment transaction
        const [insertedInvestment] = await db
            .insert(investmentTransactions)
            .values({
                workspaceId,
                assetId,
                type,
                quantity: encryptedQuantity,
                unitPrice: encryptedUnitPrice,
                totalAmount: encryptedTotalAmount,
                currency,
                exchangeRate: "1.0",
                fees: encryptedFees,
                date: txDate,
                notes,
                createdById: session.user.id,
                linkedTransactionId,
            })
            .returning()

        revalidatePath("/investments")
        revalidatePath("/dashboard")

        return { success: true, transaction: insertedInvestment }
    } catch (err: any) {
        console.error("Error creating investment transaction:", err)
        return { success: false, error: err.message || "Error al registrar la transacción" }
    }
}

export async function deleteInvestmentTransaction(
    id: string,
    workspaceId: string,
    deleteLinkedExpense = true
) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, session.user.id)))

        if (!membership || membership.role === "VIEWER") {
            return { success: false, error: "Permisos insuficientes" }
        }

        const [invTx] = await db
            .select()
            .from(investmentTransactions)
            .where(and(eq(investmentTransactions.id, id), eq(investmentTransactions.workspaceId, workspaceId)))

        if (!invTx) return { success: false, error: "Transacción no encontrada" }

        // If it had a linked expense in transactions, delete it if requested
        if (invTx.linkedTransactionId && deleteLinkedExpense) {
            await db
                .delete(transactions)
                .where(eq(transactions.id, invTx.linkedTransactionId))
        }

        await db
            .delete(investmentTransactions)
            .where(eq(investmentTransactions.id, id))

        revalidatePath("/investments")
        revalidatePath("/dashboard")

        return { success: true }
    } catch (err: any) {
        console.error("Error deleting investment transaction:", err)
        return { success: false, error: err.message || "Error al eliminar transacción" }
    }
}

export async function updateInvestmentTransaction(formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        const id = formData.get("id") as string
        const workspaceId = formData.get("workspaceId") as string
        const quantity = formData.get("quantity") as string
        const unitPrice = formData.get("unitPrice") as string
        const totalAmount = formData.get("totalAmount") as string
        const currency = (formData.get("currency") as string) || "USD"
        const fees = (formData.get("fees") as string) || "0"
        const date = formData.get("date") as string
        const notes = (formData.get("notes") as string) || ""

        if (!id || !workspaceId || !quantity || !unitPrice) {
            return { success: false, error: "Faltan campos requeridos" }
        }

        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, session.user.id)))

        if (!membership || membership.role === "VIEWER") {
            return { success: false, error: "Permisos insuficientes" }
        }

        const [existing] = await db
            .select()
            .from(investmentTransactions)
            .where(and(eq(investmentTransactions.id, id), eq(investmentTransactions.workspaceId, workspaceId)))

        if (!existing) return { success: false, error: "Transacción no encontrada" }

        const numQuantity = parseFloat(quantity)
        const numUnitPrice = parseFloat(unitPrice)
        const numFees = parseFloat(fees) || 0
        const calculatedTotal = parseFloat(totalAmount) || (numQuantity * numUnitPrice + numFees)

        if (numQuantity <= 0 || numUnitPrice < 0 || calculatedTotal <= 0) {
            return { success: false, error: "La cantidad, precio y total deben ser valores válidos" }
        }

        const encryptedQuantity = encryptAmount(numQuantity.toString())
        const encryptedUnitPrice = encryptAmount(numUnitPrice.toString())
        const encryptedTotalAmount = encryptAmount(calculatedTotal.toString())
        const encryptedFees = encryptAmount(numFees.toString())
        const txDate = date ? new Date(date) : new Date()

        // 1. Update investment transaction
        await db
            .update(investmentTransactions)
            .set({
                quantity: encryptedQuantity,
                unitPrice: encryptedUnitPrice,
                totalAmount: encryptedTotalAmount,
                currency,
                fees: encryptedFees,
                date: txDate,
                notes: notes.trim(),
            })
            .where(eq(investmentTransactions.id, id))

        // 2. If it has a linked transaction in expenses workspace, synchronize it
        if (existing.linkedTransactionId) {
            await db
                .update(transactions)
                .set({
                    amount: encryptedTotalAmount,
                    date: txDate,
                    currency,
                    description: notes.trim() ? `Inversión: ${notes.trim()}` : undefined,
                })
                .where(eq(transactions.id, existing.linkedTransactionId))
        }

        revalidatePath("/investments")
        revalidatePath("/dashboard")

        return { success: true }
    } catch (err: any) {
        console.error("Error updating investment transaction:", err)
        return { success: false, error: err.message || "Error al actualizar la transacción" }
    }
}

export interface HoldingPosition {
    assetId: string
    symbol: string
    name: string
    assetType: string
    defaultCurrency: string
    icon?: string | null
    quantity: number
    avgBuyPrice: number
    avgBuyPriceUSD?: number
    currency: string
    currentPrice: number
    currentPriceUSD?: number
    currentValueInAssetCurrency: number
    currentValueInBaseCurrency: number
    currentValueInUSD: number
    costBasisInBaseCurrency: number
    costBasisInUSD: number
    unrealizedPnLBaseCurrency: number
    unrealizedPnLUSD: number
    unrealizedPnLPct: number
    unrealizedPnLPctUSD?: number
    change24hPct?: number
}

export interface InvestmentDashboardData {
    workspace: {
        id: string
        name: string
        baseCurrency: string
    }
    holdings: HoldingPosition[]
    totalPortfolioValue: number
    totalInvestedCost: number
    totalPnLAmount: number
    totalPnLPct: number
    totalPortfolioValueUSD: number
    totalInvestedCostUSD: number
    totalPnLAmountUSD: number
    totalPnLPctUSD: number
    assetAllocation: {
        name: string
        symbol: string
        assetType: string
        value: number
        valueUSD: number
        percentage: number
        color: string
    }[]
    categoryAllocation: {
        category: string
        label: string
        value: number
        valueUSD: number
        percentage: number
        color: string
    }[]
    chartPoints: {
        date: string
        portfolioValue: number
        investedCost: number
        portfolioValueUSD: number
        investedCostUSD: number
    }[]
    recentTransactions: {
        id: string
        assetId: string
        symbol: string
        name: string
        assetType: string
        type: string
        quantity: number
        unitPrice: number
        unitPriceBase?: number
        unitPriceUSD?: number
        totalAmount: number
        totalAmountBase?: number
        totalAmountUSD?: number
        currency: string
        fees: number
        rawDate: string
        date: string
        notes: string | null
        linkedTransactionId: string | null
    }[]
    availableAssets: {
        id: string
        symbol: string
        name: string
        assetType: string
        defaultCurrency: string
        icon: string | null
    }[]
}

const CATEGORY_COLORS: Record<string, string> = {
    CRYPTO: "#f59e0b", // Amber
    STOCK: "#3b82f6", // Blue
    ETF: "#10b981", // Emerald
    CEDEAR: "#8b5cf6", // Violet
    BOND: "#06b6d4", // Cyan
    OTHER: "#6b7280", // Gray
}

const CATEGORY_LABELS: Record<string, string> = {
    CRYPTO: "Criptomonedas",
    STOCK: "Acciones USA",
    ETF: "ETFs",
    CEDEAR: "CEDEARs / Arg",
    BOND: "Bonos",
    OTHER: "Otros",
}

const PALETTE = [
    "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899",
    "#06b6d4", "#f97316", "#14b8a6", "#6366f1", "#84cc16"
]

export async function getInvestmentsDashboardData(
    workspaceId: string,
    timeRange = "1M"
): Promise<{ success: boolean; data?: InvestmentDashboardData; error?: string }> {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "No autorizado" }

        // 1. Verify workspace membership
        const [workspace] = await db
            .select({
                id: workspaces.id,
                name: workspaces.name,
                baseCurrency: workspaces.baseCurrency,
            })
            .from(workspaces)
            .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
            .where(and(eq(workspaces.id, workspaceId), eq(workspaceMembers.userId, session.user.id)))

        if (!workspace) return { success: false, error: "Workspace no encontrado o sin permisos" }

        // 2. Fetch and ensure market rates exist
        await checkAndUpdateRates().catch(() => {})
        const allRates = await db.select().from(marketRates)
        const ratesMap: Record<string, Record<string, number>> = {}
        for (const r of allRates) {
            if (!ratesMap[r.baseCurrency]) ratesMap[r.baseCurrency] = {}
            ratesMap[r.baseCurrency][r.targetCurrency] = parseFloat(r.rate)
        }

        // 3. Fetch all investment transactions
        const rawTxs = await db
            .select({
                id: investmentTransactions.id,
                assetId: investmentTransactions.assetId,
                type: investmentTransactions.type,
                quantity: investmentTransactions.quantity,
                unitPrice: investmentTransactions.unitPrice,
                totalAmount: investmentTransactions.totalAmount,
                currency: investmentTransactions.currency,
                exchangeRate: investmentTransactions.exchangeRate,
                fees: investmentTransactions.fees,
                date: investmentTransactions.date,
                notes: investmentTransactions.notes,
                linkedTransactionId: investmentTransactions.linkedTransactionId,
                symbol: investmentAssets.symbol,
                name: investmentAssets.name,
                assetType: investmentAssets.assetType,
                defaultCurrency: investmentAssets.defaultCurrency,
                icon: investmentAssets.icon,
            })
            .from(investmentTransactions)
            .innerJoin(investmentAssets, eq(investmentTransactions.assetId, investmentAssets.id))
            .where(eq(investmentTransactions.workspaceId, workspaceId))
            .orderBy(asc(investmentTransactions.date))

        // 4. Decrypt and normalize transactions
        const decryptedTxs = rawTxs.map((tx) => {
            const quantity = parseFloat(decryptAmount(tx.quantity)) || 0
            const unitPrice = parseFloat(decryptAmount(tx.unitPrice)) || 0
            const totalAmount = parseFloat(decryptAmount(tx.totalAmount)) || 0
            const fees = parseFloat(decryptAmount(tx.fees)) || 0

            return {
                ...tx,
                quantity,
                unitPrice,
                totalAmount,
                fees,
                dateStr: new Date(tx.date).toISOString().split("T")[0],
            }
        })

        // 5. Calculate holdings positions (group by assetId) with multi-currency normalization
        const assetMap: Record<
            string,
            {
                assetId: string
                symbol: string
                name: string
                assetType: string
                defaultCurrency: string
                icon: string | null
                lastTxCurrency: string
                netQuantity: number
                totalBuyQuantity: number
                totalBuyCostInBase: number
                totalBuyCostInUSD: number
            }
        > = {}

        for (const tx of decryptedTxs) {
            if (!assetMap[tx.assetId]) {
                assetMap[tx.assetId] = {
                    assetId: tx.assetId,
                    symbol: tx.symbol,
                    name: tx.name,
                    assetType: tx.assetType,
                    defaultCurrency: tx.defaultCurrency,
                    icon: tx.icon,
                    lastTxCurrency: tx.currency,
                    netQuantity: 0,
                    totalBuyQuantity: 0,
                    totalBuyCostInBase: 0,
                    totalBuyCostInUSD: 0,
                }
            }

            if (tx.type === "BUY") {
                const txCostInBase = convertAmount(
                    tx.quantity * tx.unitPrice,
                    tx.currency,
                    workspace.baseCurrency,
                    ratesMap
                )
                const txCostInUSD = convertAmount(
                    tx.quantity * tx.unitPrice,
                    tx.currency,
                    "USD",
                    ratesMap
                )

                assetMap[tx.assetId].netQuantity += tx.quantity
                assetMap[tx.assetId].totalBuyQuantity += tx.quantity
                assetMap[tx.assetId].totalBuyCostInBase += txCostInBase
                assetMap[tx.assetId].totalBuyCostInUSD += txCostInUSD
                assetMap[tx.assetId].lastTxCurrency = tx.currency
            } else if (tx.type === "SELL") {
                assetMap[tx.assetId].netQuantity -= tx.quantity
            }
        }

        const activeHoldingAssets = Object.values(assetMap).filter((a) => a.netQuantity > 0.00000001)

        // 6. Fetch live prices for active holding symbols
        const holdingSymbols = activeHoldingAssets.map((a) => a.symbol)
        const livePrices = await getOrUpdateAssetPrices(holdingSymbols)

        // 7. Calculate individual holding metrics
        const holdings: HoldingPosition[] = []
        let totalPortfolioValue = 0
        let totalInvestedCost = 0
        let totalPortfolioValueUSD = 0
        let totalInvestedCostUSD = 0

        for (const a of activeHoldingAssets) {
            const livePriceData = livePrices[a.symbol.toUpperCase()]
            const isBA = a.symbol.toUpperCase().endsWith(".BA") || a.assetType === "CEDEAR"
            const priceCurrency = isBA ? "ARS" : (livePriceData?.currency?.toUpperCase() || (a.defaultCurrency?.toUpperCase() || "USD"))
            
            const currentPrice = livePriceData?.price ?? (a.totalBuyQuantity > 0 ? (priceCurrency === "USD" ? a.totalBuyCostInUSD / a.totalBuyQuantity : a.totalBuyCostInBase / a.totalBuyQuantity) : 0)

            // Current valuation converted from live price currency to baseCurrency and USD
            const currentValueInBaseCurrency = convertAmount(
                a.netQuantity * currentPrice,
                priceCurrency,
                workspace.baseCurrency,
                ratesMap
            )
            const currentValueInUSD = convertAmount(
                a.netQuantity * currentPrice,
                priceCurrency,
                "USD",
                ratesMap
            )

            // Cost basis for remaining active shares
            const remainingRatio = a.totalBuyQuantity > 0 ? a.netQuantity / a.totalBuyQuantity : 1
            const costBasisInBaseCurrency = a.totalBuyCostInBase * remainingRatio
            const costBasisInUSD = a.totalBuyCostInUSD * remainingRatio

            // Average buy price in base currency and in USD
            const avgBuyPrice = a.netQuantity > 0 ? costBasisInBaseCurrency / a.netQuantity : 0
            const avgBuyPriceUSD = a.netQuantity > 0 ? costBasisInUSD / a.netQuantity : 0

            // Market price converted to base currency and USD
            const currentPriceInBase = convertAmount(currentPrice, priceCurrency, workspace.baseCurrency, ratesMap)
            const currentPriceInUSD = convertAmount(currentPrice, priceCurrency, "USD", ratesMap)

            const unrealizedPnLBaseCurrency = currentValueInBaseCurrency - costBasisInBaseCurrency
            const unrealizedPnLUSD = currentValueInUSD - costBasisInUSD
            const unrealizedPnLPct =
                costBasisInBaseCurrency > 0 ? (unrealizedPnLBaseCurrency / costBasisInBaseCurrency) * 100 : 0
            const unrealizedPnLPctUSD =
                costBasisInUSD > 0 ? (unrealizedPnLUSD / costBasisInUSD) * 100 : 0

            totalPortfolioValue += currentValueInBaseCurrency
            totalInvestedCost += costBasisInBaseCurrency
            totalPortfolioValueUSD += currentValueInUSD
            totalInvestedCostUSD += costBasisInUSD

            holdings.push({
                assetId: a.assetId,
                symbol: a.symbol,
                name: a.name,
                assetType: a.assetType,
                defaultCurrency: a.defaultCurrency,
                icon: a.icon,
                quantity: a.netQuantity,
                avgBuyPrice,
                avgBuyPriceUSD,
                currency: workspace.baseCurrency,
                currentPrice: currentPriceInBase,
                currentPriceUSD: currentPriceInUSD,
                currentValueInAssetCurrency: a.netQuantity * currentPrice,
                currentValueInBaseCurrency,
                currentValueInUSD,
                costBasisInBaseCurrency,
                costBasisInUSD,
                unrealizedPnLBaseCurrency,
                unrealizedPnLUSD,
                unrealizedPnLPct,
                unrealizedPnLPctUSD,
                change24hPct: livePriceData?.change24hPct,
            })
        }

        // Sort holdings by value descending
        holdings.sort((a, b) => b.currentValueInBaseCurrency - a.currentValueInBaseCurrency)

        const totalPnLAmount = totalPortfolioValue - totalInvestedCost
        const totalPnLPct = totalInvestedCost > 0 ? (totalPnLAmount / totalInvestedCost) * 100 : 0

        const totalPnLAmountUSD = totalPortfolioValueUSD - totalInvestedCostUSD
        const totalPnLPctUSD = totalInvestedCostUSD > 0 ? (totalPnLAmountUSD / totalInvestedCostUSD) * 100 : 0

        // 8. Asset and Category Allocation Donut Data
        const assetAllocation = holdings.map((h, i) => ({
            name: h.name,
            symbol: h.symbol,
            assetType: h.assetType,
            value: h.currentValueInBaseCurrency,
            valueUSD: h.currentValueInUSD,
            percentage: totalPortfolioValue > 0 ? (h.currentValueInBaseCurrency / totalPortfolioValue) * 100 : 0,
            color: PALETTE[i % PALETTE.length],
        }))

        const categoryGroupMap: Record<string, { base: number; usd: number }> = {}
        for (const h of holdings) {
            if (!categoryGroupMap[h.assetType]) {
                categoryGroupMap[h.assetType] = { base: 0, usd: 0 }
            }
            categoryGroupMap[h.assetType].base += h.currentValueInBaseCurrency
            categoryGroupMap[h.assetType].usd += h.currentValueInUSD
        }

        const categoryAllocation = Object.entries(categoryGroupMap).map(([cat, data]) => ({
            category: cat,
            label: CATEGORY_LABELS[cat] || cat,
            value: data.base,
            valueUSD: data.usd,
            percentage: totalPortfolioValue > 0 ? (data.base / totalPortfolioValue) * 100 : 0,
            color: CATEGORY_COLORS[cat] || "#6b7280",
        }))

        // 9. Time series data for portfolio performance chart
        let days = 30
        if (timeRange === "3M") days = 90
        else if (timeRange === "6M") days = 180
        else if (timeRange === "1Y") days = 365
        else if (timeRange === "ALL") days = 730

        const chartPoints: {
            date: string
            portfolioValue: number
            investedCost: number
            portfolioValueUSD: number
            investedCostUSD: number
        }[] = []
        const now = new Date()

        for (let d = days; d >= 0; d--) {
            const targetDate = new Date(now)
            targetDate.setDate(targetDate.getDate() - d)
            const dateStr = targetDate.toISOString().split("T")[0]

            // Sum transactions up to this date
            const txsUpToDate = decryptedTxs.filter((tx) => tx.dateStr <= dateStr)
            if (txsUpToDate.length === 0) continue

            let dayInvestedCost = 0
            let dayInvestedCostUSD = 0
            const dayAssetQuantities: Record<string, { qty: number; symbol: string; currency: string }> = {}

            for (const tx of txsUpToDate) {
                if (!dayAssetQuantities[tx.assetId]) {
                    dayAssetQuantities[tx.assetId] = { qty: 0, symbol: tx.symbol, currency: tx.currency }
                }

                const txAmountInBase = convertAmount(tx.totalAmount, tx.currency, workspace.baseCurrency, ratesMap)
                const txAmountInUSD = convertAmount(tx.totalAmount, tx.currency, "USD", ratesMap)

                if (tx.type === "BUY") {
                    dayAssetQuantities[tx.assetId].qty += tx.quantity
                    dayInvestedCost += txAmountInBase
                    dayInvestedCostUSD += txAmountInUSD
                } else if (tx.type === "SELL") {
                    dayAssetQuantities[tx.assetId].qty -= tx.quantity
                    dayInvestedCost -= txAmountInBase
                    dayInvestedCostUSD -= txAmountInUSD
                }
            }

            let dayValuation = 0
            let dayValuationUSD = 0
            for (const [aId, data] of Object.entries(dayAssetQuantities)) {
                if (data.qty <= 0.00000001) continue
                const price = livePrices[data.symbol.toUpperCase()]?.price ?? 0
                const priceCurrency = livePrices[data.symbol.toUpperCase()]?.currency ?? data.currency
                const valInBase = convertAmount(data.qty * price, priceCurrency, workspace.baseCurrency, ratesMap)
                const valInUSD = convertAmount(data.qty * price, priceCurrency, "USD", ratesMap)

                dayValuation += valInBase > 0 ? valInBase : dayInvestedCost
                dayValuationUSD += valInUSD > 0 ? valInUSD : dayInvestedCostUSD
            }

            const pVal = Math.max(0, dayValuation > 0 ? dayValuation : dayInvestedCost)
            const iCost = Math.max(0, dayInvestedCost)
            const pValUSD = Math.max(0, dayValuationUSD > 0 ? dayValuationUSD : dayInvestedCostUSD)
            const iCostUSD = Math.max(0, dayInvestedCostUSD)

            chartPoints.push({
                date: dateStr,
                portfolioValue: pVal,
                investedCost: iCost,
                portfolioValueUSD: pValUSD,
                investedCostUSD: iCostUSD,
            })
        }

        // 10. Available catalog assets for creation modal
        const catalogAssets = await db
            .select({
                id: investmentAssets.id,
                symbol: investmentAssets.symbol,
                name: investmentAssets.name,
                assetType: investmentAssets.assetType,
                defaultCurrency: investmentAssets.defaultCurrency,
                icon: investmentAssets.icon,
            })
            .from(investmentAssets)
            .where(
                and(
                    eq(investmentAssets.isActive, true),
                    or(isNull(investmentAssets.workspaceId), eq(investmentAssets.workspaceId, workspaceId))
                )
            )
            .orderBy(investmentAssets.assetType, investmentAssets.symbol)

        // 11. Recent Transactions sorted descending
        const recentTransactions = [...decryptedTxs]
            .reverse()
            .map((tx) => {
                const rawDate = new Date(tx.date).toISOString().split("T")[0]
                const totalAmountBase = convertAmount(tx.totalAmount, tx.currency, workspace.baseCurrency, ratesMap)
                const totalAmountUSD = convertAmount(tx.totalAmount, tx.currency, "USD", ratesMap)
                const unitPriceBase = convertAmount(tx.unitPrice, tx.currency, workspace.baseCurrency, ratesMap)
                const unitPriceUSD = convertAmount(tx.unitPrice, tx.currency, "USD", ratesMap)

                return {
                    id: tx.id,
                    assetId: tx.assetId,
                    symbol: tx.symbol,
                    name: tx.name,
                    assetType: tx.assetType,
                    type: tx.type,
                    quantity: tx.quantity,
                    unitPrice: tx.unitPrice,
                    unitPriceBase,
                    unitPriceUSD,
                    totalAmount: tx.totalAmount,
                    totalAmountBase,
                    totalAmountUSD,
                    currency: tx.currency,
                    fees: tx.fees,
                    rawDate,
                    date: new Date(tx.date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    }),
                    notes: tx.notes,
                    linkedTransactionId: tx.linkedTransactionId,
                }
            })

        return {
            success: true,
            data: {
                workspace,
                holdings,
                totalPortfolioValue,
                totalInvestedCost,
                totalPnLAmount,
                totalPnLPct,
                totalPortfolioValueUSD,
                totalInvestedCostUSD,
                totalPnLAmountUSD,
                totalPnLPctUSD,
                assetAllocation,
                categoryAllocation,
                chartPoints,
                recentTransactions,
                availableAssets: catalogAssets,
            },
        }
    } catch (err: any) {
        console.error("Error in getInvestmentsDashboardData:", err)
        return { success: false, error: err.message || "Error al cargar datos de inversiones" }
    }
}
