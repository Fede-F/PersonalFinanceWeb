"use client"

import * as React from "react"
import { HoldingPosition } from "@/app/actions/investments"
import { useInvestmentCurrency } from "./investment-currency-provider"
import { MaskedValue } from "@/components/privacy-provider"
import { formatCurrency, formatPercentage } from "@/lib/formatters"
import { TrendingUp, TrendingDown, Coins, Building2, Globe, BarChart2 } from "lucide-react"

interface CategoryPerformanceSummaryProps {
    holdings: HoldingPosition[]
}

const CATEGORY_META: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
    CRYPTO: {
        label: "Criptomonedas",
        icon: Coins,
        color: "text-amber-800 dark:text-amber-300",
        bgColor: "bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/15",
    },
    STOCK: {
        label: "Acciones USA",
        icon: Building2,
        color: "text-blue-800 dark:text-blue-300",
        bgColor: "bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/15",
    },
    CEDEAR: {
        label: "CEDEARs",
        icon: Globe,
        color: "text-purple-800 dark:text-purple-300",
        bgColor: "bg-purple-500/10 border-purple-500/20 dark:bg-purple-500/15",
    },
    ETF: {
        label: "ETFs",
        icon: BarChart2,
        color: "text-emerald-800 dark:text-emerald-300",
        bgColor: "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/15",
    },
    BOND: {
        label: "Bonos / Renta Fija",
        icon: Building2,
        color: "text-cyan-800 dark:text-cyan-300",
        bgColor: "bg-cyan-500/10 border-cyan-500/20 dark:bg-cyan-500/15",
    },
    FCI: {
        label: "Fondos Comunes (FCI)",
        icon: BarChart2,
        color: "text-indigo-800 dark:text-indigo-300",
        bgColor: "bg-indigo-500/10 border-indigo-500/20 dark:bg-indigo-500/15",
    },
    OTHER: {
        label: "Otros",
        icon: Building2,
        color: "text-zinc-800 dark:text-zinc-300",
        bgColor: "bg-zinc-500/10 border-zinc-500/20 dark:bg-zinc-500/15",
    },
}

export function CategoryPerformanceSummary({ holdings }: CategoryPerformanceSummaryProps) {
    const { isUSD, selectedCurrency } = useInvestmentCurrency()

    const categoryStats = React.useMemo(() => {
        const groups: Record<
            string,
            {
                category: string
                currentValue: number
                costBasis: number
                pnlAmount: number
                pnlPct: number
                count: number
            }
        > = {}

        for (const h of holdings) {
            const cat = h.assetType || "OTHER"
            if (!groups[cat]) {
                groups[cat] = {
                    category: cat,
                    currentValue: 0,
                    costBasis: 0,
                    pnlAmount: 0,
                    pnlPct: 0,
                    count: 0,
                }
            }

            const val = isUSD ? h.currentValueInUSD : h.currentValueInBaseCurrency
            const cost = isUSD ? h.costBasisInUSD : h.costBasisInBaseCurrency
            const pnl = isUSD ? h.unrealizedPnLUSD : h.unrealizedPnLBaseCurrency

            groups[cat].currentValue += val
            groups[cat].costBasis += cost
            groups[cat].pnlAmount += pnl
            groups[cat].count += 1
        }

        return Object.values(groups).map((g) => {
            const pct = g.costBasis > 0 ? (g.pnlAmount / g.costBasis) * 100 : 0
            return { ...g, pnlPct: pct }
        })
    }, [holdings, isUSD])

    if (categoryStats.length <= 1) return null

    return (
        <div className="space-y-2 animate-in fade-in duration-300">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1">
                Rendimiento por Categoría ({selectedCurrency})
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {categoryStats.map((item) => {
                    const meta = CATEGORY_META[item.category] || {
                        label: item.category,
                        icon: Coins,
                        color: "text-zinc-700 dark:text-zinc-300",
                        bgColor: "bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700",
                    }
                    const Icon = meta.icon
                    const isPositive = item.pnlAmount >= 0

                    return (
                        <div
                            key={item.category}
                            className={`p-3 rounded-xl border ${meta.bgColor} transition-all duration-200 hover:shadow-xs space-y-1.5`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
                                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                        {meta.label}
                                    </span>
                                </div>
                                <span className="text-[10px] text-zinc-400 font-medium">
                                    {item.count} {item.count === 1 ? "activo" : "activos"}
                                </span>
                            </div>

                            <div className="flex items-baseline justify-between pt-0.5">
                                <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 font-mono tabular-nums">
                                    <MaskedValue value={formatCurrency(item.currentValue, selectedCurrency)} />
                                </div>
                                <div
                                    className={`inline-flex items-center gap-0.5 text-xs font-bold font-mono tabular-nums ${
                                        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                    }`}
                                >
                                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    <span>
                                        <MaskedValue
                                            value={`${isPositive ? "+" : ""}${item.pnlPct.toFixed(1)}%`}
                                            replacement="••%"
                                        />
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
