"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, ShieldAlert, PiggyBank } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { MaskedValue } from "@/components/privacy-provider"
import { formatCurrency } from "@/lib/formatters"

interface StatsProps {
    transactions: any[]
    preferredCurrency: string
}

export function ExpensesDistribution({ transactions, preferredCurrency }: StatsProps) {
    const expenses = transactions.filter(t => t.type === "EXPENSE")
    const totalExpenses = expenses.reduce((acc, t) => acc + t.amountInPreferred, 0)

    // Group by category
    const categoryMap: { [id: string]: { name: string; amount: number; color: string } } = {}
    expenses.forEach(t => {
        const catId = t.categoryId || "uncategorized"
        const name = t.categoryName || "Sin categoría"
        const color = t.categoryColor || "#a1a1aa"
        
        if (!categoryMap[catId]) {
            categoryMap[catId] = {
                name,
                amount: 0,
                color
            }
        }
        categoryMap[catId].amount += t.amountInPreferred
    })

    // Sort by amount descending
    const allCategories = Object.values(categoryMap).sort((a, b) => b.amount - a.amount)

    // Limit to top 5 categories and group the rest into "Otros"
    const maxMainCategories = 5
    let mainCategories = allCategories
    let otherCategoriesAmount = 0
    
    if (allCategories.length > maxMainCategories) {
        mainCategories = allCategories.slice(0, maxMainCategories - 1)
        otherCategoriesAmount = allCategories.slice(maxMainCategories - 1).reduce((sum, c) => sum + c.amount, 0)
        if (otherCategoriesAmount > 0) {
            mainCategories.push({
                name: "Otros",
                amount: otherCategoriesAmount,
                color: "#71717a"
            })
        }
    }

    const categoriesWithPct = mainCategories.map(cat => ({
        ...cat,
        pct: totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0
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
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono tabular-nums">
                            <MaskedValue value={formatCurrency(data.amount, preferredCurrency)} />
                        </span>
                    </div>
                    <div className="flex justify-between gap-4 text-zinc-500 dark:text-zinc-400">
                        <span>Porcentaje:</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono tabular-nums">{data.pct.toFixed(1)}%</span>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <Card className="w-full border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-900/50 backdrop-blur-sm p-0">
            <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="text-base sm:text-lg xl:text-xl font-bold tracking-tight">Distribución de Gastos</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Distribución de gastos por categoría en este mes</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-2">
                <div className="flex flex-col items-center justify-center gap-6">
                    {/* Recharts Donut */}
                    <div className="relative w-40 h-40 sm:w-48 sm:h-48 xl:w-52 xl:h-52 shrink-0 flex items-center justify-center">
                        {totalExpenses === 0 ? (
                            <div className="w-full h-full flex items-center justify-center rounded-full border-4 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs text-center p-4">
                                Sin gastos registrados
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Pie
                                            data={categoriesWithPct}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="65%"
                                            outerRadius="85%"
                                            paddingAngle={3}
                                            dataKey="amount"
                                        >
                                            {categoriesWithPct.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 pointer-events-none">
                                    <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Total</span>
                                    <span className="text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-100 font-mono tabular-nums truncate max-w-[100px]">
                                        <MaskedValue value={formatCurrency(totalExpenses, preferredCurrency)} />
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Category List */}
                    <div className="flex-1 w-full space-y-2 sm:space-y-3 lg:space-y-2 xl:space-y-3 max-w-sm">
                        {categoriesWithPct.map((seg, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl border border-zinc-100 dark:border-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded shadow-sm" style={{ backgroundColor: seg.color }} />
                                    <div>
                                        <p className="text-xs sm:text-sm xl:text-base font-bold text-zinc-700 dark:text-zinc-300 leading-tight">{seg.name}</p>
                                    </div>
                                </div>
                                <div className="text-right font-mono tabular-nums" suppressHydrationWarning>
                                    <p className="text-xs sm:text-sm xl:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                                        <MaskedValue value={formatCurrency(seg.amount, preferredCurrency)} />
                                    </p>
                                    <p className="text-[11px] xl:text-xs font-bold" style={{ color: seg.color }}>{seg.pct.toFixed(0)}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function SavingsRate({ transactions, preferredCurrency }: StatsProps) {
    const expenses = transactions.filter(t => t.type === "EXPENSE")
    const totalExpenses = expenses.reduce((acc, t) => acc + t.amountInPreferred, 0)

    const totalIncome = transactions
        .filter(t => t.type === "INCOME")
        .reduce((acc, t) => acc + t.amountInPreferred, 0)

    const netSavings = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

    return (
        <Card className="w-full border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-900/50 backdrop-blur-sm flex flex-col justify-between p-0">
            <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="text-base sm:text-lg xl:text-xl font-bold tracking-tight">Capacidad de Ahorro</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Relación entre tus ingresos y gastos del mes</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-4 flex-1 flex flex-col justify-center space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner shrink-0",
                        netSavings >= 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                    )}>
                        {netSavings >= 0 ? <PiggyBank size={20} className="sm:w-6 sm:h-6" /> : <ShieldAlert size={20} className="sm:w-6 sm:h-6" />}
                    </div>
                    <div suppressHydrationWarning className="min-w-0 font-mono tabular-nums">
                        <p className="text-[10px] sm:text-xs xl:text-sm font-medium text-zinc-400 font-sans">Balance Neto</p>
                        <p className={cn(
                            "text-lg sm:text-2xl xl:text-3xl font-black tabular-nums truncate leading-tight",
                            netSavings >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                        )}>
                            <MaskedValue value={`${netSavings >= 0 ? "+" : ""}${formatCurrency(netSavings, preferredCurrency)}`} />
                        </p>
                    </div>
                </div>

                {/* Progress Bar comparisons */}
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] sm:text-xs xl:text-sm font-bold font-mono tabular-nums" suppressHydrationWarning>
                        <span className="text-zinc-400 font-sans">Presupuesto Utilizado</span>
                        <span className={cn(
                            netSavings >= 0 ? "text-zinc-600 dark:text-zinc-300" : "text-rose-700 dark:text-rose-400"
                        )}>
                            {totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(0) : "100"}%
                        </span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="h-2.5 sm:h-3.5 xl:h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200/50 dark:border-zinc-800/40">
                        {totalIncome === 0 && totalExpenses > 0 ? (
                            <div className="h-full rounded-full bg-rose-500 w-full animate-pulse" />
                        ) : totalIncome === 0 ? (
                            <div className="h-full rounded-full bg-zinc-300 w-0" />
                        ) : (
                            <div className={cn(
                                "h-full rounded-full transition-all duration-700 ease-out",
                                savingsRate >= 20 ? "bg-emerald-500" :
                                    savingsRate >= 0 ? "bg-amber-500" :
                                        "bg-rose-500"
                            )}
                                style={{ width: `${Math.min((totalExpenses / totalIncome) * 100, 100)}%` }}
                            />
                        )}
                    </div>
                    <div className="flex justify-between text-[8px] sm:text-[10px] xl:text-xs text-zinc-400 font-bold uppercase tracking-wider gap-2 font-mono tabular-nums" suppressHydrationWarning>
                        <span className="truncate">Ingresos: <MaskedValue value={formatCurrency(totalIncome, preferredCurrency)} /></span>
                        <span className="truncate">Gastos: <MaskedValue value={formatCurrency(totalExpenses, preferredCurrency)} /></span>
                    </div>
                </div>

                {/* Savings Message Indicator */}
                <div className="p-2.5 sm:p-3.5 xl:p-4 rounded-lg sm:rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/20 text-[10px] sm:text-xs xl:text-sm leading-relaxed text-zinc-500" suppressHydrationWarning>
                    {totalIncome === 0 ? (
                        "Registra tus ingresos y gastos para calcular tu ahorro."
                    ) : netSavings >= 0 ? (
                        <>
                            Estás ahorrando el <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold font-mono tabular-nums">{savingsRate.toFixed(0)}%</strong> de tus ingresos mensuales.
                        </>
                    ) : (
                        <>
                            <strong className="text-rose-700 dark:text-rose-400 font-extrabold">Alerta de presupuesto</strong>: tus gastos superaron tus ingresos por <span className="font-mono tabular-nums"><MaskedValue value={formatCurrency(Math.abs(netSavings), preferredCurrency)} /></span>.
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
