"use client"

import * as React from "react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import { useInvestmentCurrency } from "./investment-currency-provider"
import { MaskedValue } from "@/components/privacy-provider"
import { formatCurrency } from "@/lib/formatters"
import { triggerHaptic } from "@/lib/haptics"

interface ChartPoint {
    date: string
    portfolioValue: number
    investedCost: number
    portfolioValueUSD?: number
    investedCostUSD?: number
}

interface PortfolioChartProps {
    chartPoints: ChartPoint[]
    baseCurrency: string
    currentValue: number
    investedCost: number
    totalPnLAmount: number
    totalPnLPct: number
    currentValueUSD: number
    investedCostUSD: number
    totalPnLAmountUSD: number
    totalPnLPctUSD: number
    selectedRange: string
    onRangeChange: (range: string) => void
}

const RANGES = [
    { label: "1M", value: "1M" },
    { label: "3M", value: "3M" },
    { label: "6M", value: "6M" },
    { label: "1A", value: "1Y" },
    { label: "Todo", value: "ALL" },
]

export function PortfolioChart({
    chartPoints,
    baseCurrency,
    currentValue,
    investedCost,
    totalPnLAmount,
    totalPnLPct,
    currentValueUSD,
    investedCostUSD,
    totalPnLAmountUSD,
    totalPnLPctUSD,
    selectedRange,
    onRangeChange,
}: PortfolioChartProps) {
    const { isUSD } = useInvestmentCurrency()
    const activeCurrency = isUSD ? "USD" : baseCurrency

    const displayCurrentValue = isUSD ? currentValueUSD : currentValue
    const displayPnLAmount = isUSD ? totalPnLAmountUSD : totalPnLAmount
    const displayPnLPct = isUSD ? totalPnLPctUSD : totalPnLPct
    const isPositive = displayPnLAmount >= 0

    const formatDate = (dateStr: string) => {
        if (!dateStr) return ""
        const parts = dateStr.split("-")
        if (parts.length < 3) return dateStr
        return `${parts[2]}/${parts[1]}`
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            const pVal = isUSD ? (data.portfolioValueUSD ?? data.portfolioValue) : data.portfolioValue
            const iCost = isUSD ? (data.investedCostUSD ?? data.investedCost) : data.investedCost
            const pnl = pVal - iCost
            const pnlPct = iCost > 0 ? (pnl / iCost) * 100 : 0

            return (
                <div className="relative z-50 bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-700/90 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[190px] select-none pointer-events-none">
                    <div className="font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-1">
                        {data.date}
                    </div>
                    <div className="flex justify-between items-center pt-0.5">
                        <span className="text-zinc-500 dark:text-zinc-400">Valuación:</span>
                        <span className="font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-50">
                            <MaskedValue value={formatCurrency(pVal, activeCurrency)} />
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-500 dark:text-zinc-400">Invertido:</span>
                        <span className="font-medium font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                            <MaskedValue value={formatCurrency(iCost, activeCurrency)} />
                        </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-1 font-mono tabular-nums">
                        <span className="text-zinc-500 dark:text-zinc-400 font-sans">Rendimiento:</span>
                        <span
                            className={`font-bold ${
                                pnl >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                            }`}
                        >
                            {pnl >= 0 ? "+" : ""}
                            <MaskedValue value={formatCurrency(pnl, activeCurrency)} /> ({pnlPct >= 0 ? "+" : ""}
                            {pnlPct.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            )
        }
        return null
    }

    // Chart points mapped for current active currency
    const mappedPoints = chartPoints.map((p) => ({
        ...p,
        portfolioValue: isUSD ? (p.portfolioValueUSD ?? p.portfolioValue) : p.portfolioValue,
        investedCost: isUSD ? (p.investedCostUSD ?? p.investedCost) : p.investedCost,
    }))

    return (
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
                <div>
                    <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Evolución del Portafolio ({activeCurrency})
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-500">
                        Histórico de valuación vs capital invertido
                    </CardDescription>
                </div>

                {/* Time Range Selector */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg self-start sm:self-auto select-none">
                    {RANGES.map((r) => {
                        const isSelected = selectedRange === r.value
                        return (
                            <button
                                key={r.value}
                                onClick={() => {
                                    triggerHaptic("selection")
                                    onRangeChange(r.value)
                                }}
                                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all duration-100 active:scale-95 touch-manipulation cursor-pointer ${
                                    isSelected
                                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-xs font-semibold"
                                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                                }`}
                            >
                                {r.label}
                            </button>
                        )
                    })}
                </div>
            </CardHeader>

            <CardContent className="pt-2">
                {/* Header Summary inside chart */}
                <div className="flex flex-wrap items-baseline gap-3 mb-4">
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        <MaskedValue value={formatCurrency(displayCurrentValue, activeCurrency)} />
                    </div>
                    <div
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
                            isPositive
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                    >
                        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>
                            {isPositive ? "+" : ""}
                            <MaskedValue value={formatCurrency(displayPnLAmount, activeCurrency)} /> ({isPositive ? "+" : ""}
                            {displayPnLPct.toFixed(2)}%)
                        </span>
                    </div>
                </div>

                {/* Recharts Area Chart */}
                <div className="h-64 sm:h-72 w-full">
                    {mappedPoints.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                            No hay suficientes datos para generar el gráfico en este período.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mappedPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-zinc-100 dark:stroke-zinc-800" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    tickLine={false}
                                    axisLine={false}
                                    className="text-[10px] text-zinc-400"
                                    minTickGap={20}
                                />
                                <YAxis
                                    tickFormatter={(v) => {
                                        if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
                                        if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
                                        return v.toString()
                                    }}
                                    tickLine={false}
                                    axisLine={false}
                                    className="text-[10px] text-zinc-400"
                                />
                                <Tooltip
                                    wrapperStyle={{ zIndex: 1000, pointerEvents: "none" }}
                                    content={<CustomTooltip />}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="portfolioValue"
                                    name="Valuación"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fill="url(#portfolioGradient)"
                                    activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="investedCost"
                                    name="Invertido"
                                    stroke="#3b82f6"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 4"
                                    fill="url(#investedGradient)"
                                    activeDot={{ r: 4, strokeWidth: 0, fill: "#3b82f6" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
