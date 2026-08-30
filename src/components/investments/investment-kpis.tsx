"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { MaskedValue } from "@/components/privacy-provider"
import { useInvestmentCurrency } from "./investment-currency-provider"
import { TrendingUp, TrendingDown, Wallet, DollarSign, PiggyBank, Layers } from "lucide-react"

interface InvestmentKPIsProps {
    totalValue: number
    totalInvested: number
    totalPnLAmount: number
    totalPnLPct: number
    totalValueUSD: number
    totalInvestedUSD: number
    totalPnLAmountUSD: number
    totalPnLPctUSD: number
    baseCurrency: string
    activeHoldingsCount: number
}

export function InvestmentKPIs({
    totalValue,
    totalInvested,
    totalPnLAmount,
    totalPnLPct,
    totalValueUSD,
    totalInvestedUSD,
    totalPnLAmountUSD,
    totalPnLPctUSD,
    baseCurrency,
    activeHoldingsCount,
}: InvestmentKPIsProps) {
    const { isUSD, selectedCurrency } = useInvestmentCurrency()

    // Determine primary and secondary display values based on active currency switch
    const primaryCurrency = isUSD ? "USD" : baseCurrency
    const secondaryCurrency = isUSD ? baseCurrency : "USD"

    const primaryTotalValue = isUSD ? totalValueUSD : totalValue
    const secondaryTotalValue = isUSD ? totalValue : totalValueUSD

    const primaryPnLAmount = isUSD ? totalPnLAmountUSD : totalPnLAmount
    const secondaryPnLAmount = isUSD ? totalPnLAmount : totalPnLAmountUSD
    const primaryPnLPct = isUSD ? totalPnLPctUSD : totalPnLPct

    const primaryInvested = isUSD ? totalInvestedUSD : totalInvested
    const secondaryInvested = isUSD ? totalInvested : totalInvestedUSD

    const isPositive = primaryPnLAmount >= 0

    const formatCurrency = (val: number, curr: string) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: curr,
            maximumFractionDigits: curr === "USD" ? 2 : 0,
        }).format(val)
    }

    return (
        <div>
            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-4 gap-4">
                {/* 1. Valuación Total */}
                <Card className="p-5 border-none shadow-sm bg-white dark:bg-zinc-900 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            Valuación Total
                        </span>
                        <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <Wallet className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                            <MaskedValue value={formatCurrency(primaryTotalValue, primaryCurrency)} />
                        </div>
                        {baseCurrency !== "USD" && (
                            <div className="text-xs text-zinc-400 mt-0.5">
                                ≈ <MaskedValue value={formatCurrency(secondaryTotalValue, secondaryCurrency)} />
                            </div>
                        )}
                    </div>
                </Card>

                {/* 2. Rendimiento Neto (P&L) */}
                <Card className="p-5 border-none shadow-sm bg-white dark:bg-zinc-900 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            Ganancia / Pérdida
                        </span>
                        <div
                            className={`p-2 rounded-lg ${
                                isPositive
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                        >
                            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                    </div>
                    <div className="mt-3">
                        <div
                            className={`text-2xl font-bold ${
                                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            }`}
                        >
                            {isPositive ? "+" : ""}
                            <MaskedValue value={formatCurrency(primaryPnLAmount, primaryCurrency)} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span
                                className={`text-xs font-semibold inline-flex items-center gap-1 ${
                                    isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                }`}
                            >
                                {isPositive ? "+" : ""}
                                {primaryPnLPct.toFixed(2)}% retorno
                            </span>
                            {baseCurrency !== "USD" && (
                                <span className="text-xs text-zinc-400">
                                    (≈ <MaskedValue value={`${secondaryPnLAmount >= 0 ? "+" : ""}${formatCurrency(secondaryPnLAmount, secondaryCurrency)}`} />)
                                </span>
                            )}
                        </div>
                    </div>
                </Card>

                {/* 3. Capital Invertido */}
                <Card className="p-5 border-none shadow-sm bg-white dark:bg-zinc-900 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            Capital Invertido
                        </span>
                        <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                            <PiggyBank className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                            <MaskedValue value={formatCurrency(primaryInvested, primaryCurrency)} />
                        </div>
                        {baseCurrency !== "USD" && (
                            <div className="text-xs text-zinc-400 mt-0.5">
                                ≈ <MaskedValue value={formatCurrency(secondaryInvested, secondaryCurrency)} />
                            </div>
                        )}
                    </div>
                </Card>

                {/* 4. Activos en Cartera */}
                <Card className="p-5 border-none shadow-sm bg-white dark:bg-zinc-900 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            Posiciones Activas
                        </span>
                        <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                            <Layers className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                            {activeHoldingsCount}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">Activos con saldo positivo</div>
                    </div>
                </Card>
            </div>

            {/* Mobile Carousel (Horizontal scroll with snap) */}
            <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-2 px-2 select-none">
                {/* Valuación */}
                <Card className="snap-center shrink-0 w-[78vw] max-w-[280px] p-4 border-none shadow-sm bg-white dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-zinc-500 uppercase">Valuación Total</span>
                        <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                            <Wallet className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                            <MaskedValue value={formatCurrency(primaryTotalValue, primaryCurrency)} />
                        </div>
                        {baseCurrency !== "USD" && (
                            <div className="text-[11px] text-zinc-400">
                                ≈ <MaskedValue value={formatCurrency(secondaryTotalValue, secondaryCurrency)} />
                            </div>
                        )}
                    </div>
                </Card>

                {/* Ganancia/Pérdida */}
                <Card className="snap-center shrink-0 w-[78vw] max-w-[280px] p-4 border-none shadow-sm bg-white dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-zinc-500 uppercase">Ganancia / Pérdida</span>
                        <div
                            className={`p-1.5 rounded-md ${
                                isPositive
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                        >
                            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        </div>
                    </div>
                    <div className="mt-2">
                        <div
                            className={`text-xl font-bold ${
                                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            }`}
                        >
                            {isPositive ? "+" : ""}
                            <MaskedValue value={formatCurrency(primaryPnLAmount, primaryCurrency)} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                                className={`text-[11px] font-semibold ${
                                    isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                }`}
                            >
                                {isPositive ? "+" : ""}
                                {primaryPnLPct.toFixed(2)}%
                            </span>
                            {baseCurrency !== "USD" && (
                                <span className="text-[10px] text-zinc-400 truncate">
                                    (≈ <MaskedValue value={`${secondaryPnLAmount >= 0 ? "+" : ""}${formatCurrency(secondaryPnLAmount, secondaryCurrency)}`} />)
                                </span>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Capital Invertido */}
                <Card className="snap-center shrink-0 w-[78vw] max-w-[280px] p-4 border-none shadow-sm bg-white dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-zinc-500 uppercase">Capital Invertido</span>
                        <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md">
                            <PiggyBank className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                            <MaskedValue value={formatCurrency(primaryInvested, primaryCurrency)} />
                        </div>
                        {baseCurrency !== "USD" && (
                            <div className="text-[11px] text-zinc-400">
                                ≈ <MaskedValue value={formatCurrency(secondaryInvested, secondaryCurrency)} />
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}
