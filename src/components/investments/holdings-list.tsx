"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HoldingPosition } from "@/app/actions/investments"
import { MaskedValue } from "@/components/privacy-provider"
import { useInvestmentCurrency } from "./investment-currency-provider"
import { formatCurrency, formatQuantity, formatPercentage } from "@/lib/formatters"
import { triggerHaptic } from "@/lib/haptics"
import { TrendingUp, TrendingDown, Coins, Briefcase, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

interface HoldingsListProps {
    holdings: HoldingPosition[]
    baseCurrency: string
}

const TYPE_COLORS: Record<string, string> = {
    CRYPTO: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
    STOCK: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30",
    ETF: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
    CEDEAR: "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30",
    BOND: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30",
    OTHER: "bg-zinc-500/15 text-zinc-800 dark:text-zinc-300 border-zinc-500/30",
}

const TYPE_AVATAR_COLORS: Record<string, string> = {
    CRYPTO: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
    STOCK: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30",
    ETF: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
    CEDEAR: "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30",
    BOND: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30",
    OTHER: "bg-zinc-500/15 text-zinc-800 dark:text-zinc-300 border-zinc-500/30",
}

const TYPE_LABELS: Record<string, string> = {
    CRYPTO: "Cripto",
    STOCK: "Acción",
    ETF: "ETF",
    CEDEAR: "CEDEAR",
    BOND: "Bono",
    OTHER: "Otro",
}

type SortField = "symbol" | "quantity" | "avgBuyPrice" | "currentPrice" | "currentValue" | "pnl"

export function HoldingsList({ holdings, baseCurrency }: HoldingsListProps) {
    const { isUSD, selectedCurrency } = useInvestmentCurrency()
    const activeCurrency = isUSD ? "USD" : baseCurrency

    const [sortField, setSortField] = React.useState<SortField>("currentValue")
    const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc")

    const handleSort = (field: SortField) => {
        triggerHaptic("selection")
        if (sortField === field) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
        } else {
            setSortField(field)
            setSortDirection("desc")
        }
    }

    const sortedHoldings = React.useMemo(() => {
        return [...holdings].sort((a, b) => {
            let res = 0
            if (sortField === "symbol") res = a.symbol.localeCompare(b.symbol)
            else if (sortField === "quantity") res = a.quantity - b.quantity
            else if (sortField === "avgBuyPrice") res = a.avgBuyPrice - b.avgBuyPrice
            else if (sortField === "currentPrice") res = a.currentPrice - b.currentPrice
            else if (sortField === "currentValue") {
                const valA = isUSD ? a.currentValueInUSD : a.currentValueInBaseCurrency
                const valB = isUSD ? b.currentValueInUSD : b.currentValueInBaseCurrency
                res = valA - valB
            } else if (sortField === "pnl") {
                const pnlA = isUSD ? a.unrealizedPnLUSD : a.unrealizedPnLBaseCurrency
                const pnlB = isUSD ? b.unrealizedPnLUSD : b.unrealizedPnLBaseCurrency
                res = pnlA - pnlB
            }

            return sortDirection === "asc" ? res : -res
        })
    }, [holdings, sortField, sortDirection, isUSD])

    if (holdings.length === 0) {
        return (
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-8 text-center">
                <Briefcase className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                    No tienes activos en cartera
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Comienza registrando tu primera compra de Cripto, Acciones o CEDEARs para hacer seguimiento de tus rendimientos.
                </p>
            </Card>
        )
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        return sortDirection === "asc" ? (
            <ArrowUp className="w-3 h-3 text-emerald-500 ml-1" />
        ) : (
            <ArrowDown className="w-3 h-3 text-emerald-500 ml-1" />
        )
    }

    return (
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                            <Coins className="w-4 h-4 text-emerald-500" />
                            Mis Activos en Cartera
                        </CardTitle>
                        <CardDescription className="text-xs text-zinc-500">
                            {holdings.length} {holdings.length === 1 ? "posición activa" : "posiciones activas"} • Valuadas en {activeCurrency}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase tracking-wider font-semibold border-y border-zinc-100 dark:border-zinc-800 select-none">
                            <tr>
                                <th className="px-6 py-3 cursor-pointer group hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort("symbol")}>
                                    <div className="flex items-center">
                                        <span>Activo</span>
                                        <SortIcon field="symbol" />
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-right cursor-pointer group hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort("quantity")}>
                                    <div className="flex items-center justify-end">
                                        <span>Tenencia</span>
                                        <SortIcon field="quantity" />
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-right cursor-pointer group hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort("avgBuyPrice")}>
                                    <div className="flex items-center justify-end">
                                        <span>Precio Prom.</span>
                                        <SortIcon field="avgBuyPrice" />
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-right cursor-pointer group hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort("currentPrice")}>
                                    <div className="flex items-center justify-end">
                                        <span>Precio Mercado</span>
                                        <SortIcon field="currentPrice" />
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-right cursor-pointer group hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort("currentValue")}>
                                    <div className="flex items-center justify-end">
                                        <span>Valuación ({activeCurrency})</span>
                                        <SortIcon field="currentValue" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-right cursor-pointer group hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort("pnl")}>
                                    <div className="flex items-center justify-end">
                                        <span>Ganancia / Pérdida</span>
                                        <SortIcon field="pnl" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {sortedHoldings.map((h) => {
                                const pnl = isUSD ? h.unrealizedPnLUSD : h.unrealizedPnLBaseCurrency
                                const pnlPct = isUSD ? (h.unrealizedPnLPctUSD ?? h.unrealizedPnLPct) : h.unrealizedPnLPct
                                const isPositive = pnl >= 0
                                const currentVal = isUSD ? h.currentValueInUSD : h.currentValueInBaseCurrency
                                const avgBuyPrice = isUSD ? (h.avgBuyPriceUSD ?? h.avgBuyPrice) : h.avgBuyPrice
                                const currentPrice = isUSD ? (h.currentPriceUSD ?? h.currentPrice) : h.currentPrice
                                const avatarColor = TYPE_AVATAR_COLORS[h.assetType] || TYPE_AVATAR_COLORS.OTHER

                                return (
                                    <tr
                                        key={h.assetId}
                                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${avatarColor}`}>
                                                    {h.symbol.slice(0, 3)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                                            {h.symbol}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[9px] px-1.5 py-0 font-semibold ${
                                                                TYPE_COLORS[h.assetType] || TYPE_COLORS.OTHER
                                                            }`}
                                                        >
                                                            {TYPE_LABELS[h.assetType] || h.assetType}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-[11px] text-zinc-400 truncate max-w-xs block">
                                                        {h.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 text-right font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                                            {formatQuantity(h.quantity)}
                                        </td>

                                        <td className="px-4 py-4 text-right font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                                            <MaskedValue value={formatCurrency(avgBuyPrice, activeCurrency)} />
                                        </td>

                                        <td className="px-4 py-4 text-right font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                                            <div className="flex flex-col items-end">
                                                <span><MaskedValue value={formatCurrency(currentPrice, activeCurrency)} /></span>
                                                {h.change24hPct !== undefined && (
                                                    <span
                                                        className={`text-[10px] font-bold ${
                                                            h.change24hPct >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                                                        }`}
                                                    >
                                                        {h.change24hPct >= 0 ? "+" : ""}
                                                        {h.change24hPct.toFixed(1)}% (24h)
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 text-right font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 text-sm">
                                            <MaskedValue value={formatCurrency(currentVal, activeCurrency)} />
                                        </td>

                                        <td className="px-6 py-4 text-right font-mono tabular-nums">
                                            <div className="flex flex-col items-end">
                                                <div
                                                    className={`inline-flex items-center gap-1 font-bold text-xs sm:text-sm ${
                                                        isPositive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                                                    }`}
                                                >
                                                    {isPositive ? (
                                                        <TrendingUp className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <TrendingDown className="w-3.5 h-3.5" />
                                                    )}
                                                    <span>
                                                        {isPositive ? "+" : ""}
                                                        <MaskedValue value={formatCurrency(pnl, activeCurrency)} />
                                                    </span>
                                                </div>
                                                <span
                                                    className={`text-[11px] font-bold ${
                                                        isPositive ? "text-emerald-700/80 dark:text-emerald-400/80" : "text-rose-700/80 dark:text-rose-400/80"
                                                    }`}
                                                >
                                                    {isPositive ? "+" : ""}
                                                    {pnlPct.toFixed(2)}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View */}
                <div className="block lg:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                    {sortedHoldings.map((h) => {
                        const pnl = isUSD ? h.unrealizedPnLUSD : h.unrealizedPnLBaseCurrency
                        const pnlPct = isUSD ? (h.unrealizedPnLPctUSD ?? h.unrealizedPnLPct) : h.unrealizedPnLPct
                        const isPositive = pnl >= 0
                        const currentVal = isUSD ? h.currentValueInUSD : h.currentValueInBaseCurrency
                        const avgBuyPrice = isUSD ? (h.avgBuyPriceUSD ?? h.avgBuyPrice) : h.avgBuyPrice
                        const currentPrice = isUSD ? (h.currentPriceUSD ?? h.currentPrice) : h.currentPrice
                        const avatarColor = TYPE_AVATAR_COLORS[h.assetType] || TYPE_AVATAR_COLORS.OTHER

                        return (
                            <div key={h.assetId} className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${avatarColor}`}>
                                            {h.symbol.slice(0, 3)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                                    {h.symbol}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[9px] px-1 py-0 font-semibold ${
                                                        TYPE_COLORS[h.assetType] || TYPE_COLORS.OTHER
                                                    }`}
                                                >
                                                    {TYPE_LABELS[h.assetType] || h.assetType}
                                                </Badge>
                                            </div>
                                            <span className="text-[11px] text-zinc-400 truncate max-w-[180px] block">
                                                {h.name}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 font-mono tabular-nums">
                                            <MaskedValue value={formatCurrency(currentVal, activeCurrency)} />
                                        </div>
                                        <span className="text-[11px] text-zinc-400 font-medium font-mono tabular-nums">
                                            {formatQuantity(h.quantity)} {h.symbol}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-center text-xs">
                                    <div>
                                        <span className="text-[10px] text-zinc-400 uppercase font-medium block">Precio Prom.</span>
                                        <span className="font-bold font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                                            <MaskedValue value={formatCurrency(avgBuyPrice, activeCurrency)} />
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-400 uppercase font-medium block">Mercado</span>
                                        <span className="font-bold font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                                            <MaskedValue value={formatCurrency(currentPrice, activeCurrency)} />
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-400 uppercase font-medium block">Rendimiento</span>
                                        <span
                                            className={`font-bold font-mono tabular-nums flex items-center justify-center gap-0.5 ${
                                                isPositive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                                            }`}
                                        >
                                            {isPositive ? "+" : ""}
                                            {pnlPct.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
