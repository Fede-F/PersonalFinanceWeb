"use client"

import * as React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { PieChart as PieIcon } from "lucide-react"
import { useInvestmentCurrency } from "./investment-currency-provider"
import { MaskedValue } from "@/components/privacy-provider"
import { formatCurrency } from "@/lib/formatters"
import { triggerHaptic } from "@/lib/haptics"

interface AllocationItem {
    name: string
    symbol?: string
    assetType?: string
    value: number
    valueUSD?: number
    percentage: number
    color: string
}

interface AssetAllocationDonutProps {
    assetAllocation: AllocationItem[]
    categoryAllocation: {
        category: string
        label: string
        value: number
        valueUSD?: number
        percentage: number
        color: string
    }[]
    baseCurrency: string
    totalValue: number
    totalValueUSD: number
}

export function AssetAllocationDonut({
    assetAllocation,
    categoryAllocation,
    baseCurrency,
    totalValue,
    totalValueUSD,
}: AssetAllocationDonutProps) {
    const { isUSD } = useInvestmentCurrency()
    const activeCurrency = isUSD ? "USD" : baseCurrency
    const [viewMode, setViewMode] = React.useState<"category" | "asset">("category")

    const currentData = viewMode === "category"
        ? categoryAllocation.map((c) => ({
              name: c.label,
              value: isUSD ? (c.valueUSD ?? c.value) : c.value,
              percentage: c.percentage,
              color: c.color,
          }))
        : assetAllocation.map((a) => ({
              name: a.symbol ? `${a.symbol} (${a.name})` : a.name,
              value: isUSD ? (a.valueUSD ?? a.value) : a.value,
              percentage: a.percentage,
              color: a.color,
          }))

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg shadow-lg text-xs space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                        {data.name}
                    </div>
                    <div className="flex justify-between gap-4 text-zinc-500 dark:text-zinc-400">
                        <span>Monto:</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            <MaskedValue value={formatCurrency(data.value, activeCurrency)} />
                        </span>
                    </div>
                    <div className="flex justify-between gap-4 text-zinc-500 dark:text-zinc-400">
                        <span>Porcentaje:</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{data.percentage.toFixed(1)}%</span>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 flex flex-col h-full overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div>
                    <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        <PieIcon className="w-4 h-4 text-emerald-500" />
                        Distribución de Cartera
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-500">
                        Composición en {activeCurrency}
                    </CardDescription>
                </div>

                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg select-none">
                    <button
                        onClick={() => {
                            triggerHaptic("selection")
                            setViewMode("category")
                        }}
                        className={`text-xs px-2 py-1 rounded-md font-medium transition-all duration-100 active:scale-95 touch-manipulation cursor-pointer ${
                            viewMode === "category"
                                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-xs font-semibold"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                    >
                        Categorías
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic("selection")
                            setViewMode("asset")
                        }}
                        className={`text-xs px-2 py-1 rounded-md font-medium transition-all duration-100 active:scale-95 touch-manipulation cursor-pointer ${
                            viewMode === "asset"
                                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-xs font-semibold"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                    >
                        Activos
                    </button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col items-center justify-center p-4">
                {currentData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-xs text-zinc-400">
                        No hay posiciones en cartera
                    </div>
                ) : (
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
                        {/* Donut Chart */}
                        <div className="h-48 relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Pie
                                        data={currentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {currentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] text-zinc-400 font-medium">Total</span>
                                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-50">
                                    <MaskedValue value={formatCurrency(isUSD ? totalValueUSD : totalValue, activeCurrency)} />
                                </span>
                            </div>
                        </div>

                        {/* Legend List */}
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {currentData.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-zinc-400 text-[11px]">{item.percentage.toFixed(1)}%</span>
                                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                            <MaskedValue value={formatCurrency(item.value, activeCurrency)} />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
