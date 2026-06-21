"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, ShieldAlert, PiggyBank } from "lucide-react"

interface FinancialStatsProps {
    transactions: any[]
    preferredCurrency: string
}

export function FinancialStats({ transactions, preferredCurrency }: FinancialStatsProps) {
    // 1. Calculate Expenses by type
    const expenses = transactions.filter(t => t.type === "EXPENSE")
    const totalExpenses = expenses.reduce((acc, t) => acc + (parseFloat(t.amount) * parseFloat(t.exchangeRate)), 0)

    const fixedExpenses = expenses
        .filter(t => t.isFixed)
        .reduce((acc, t) => acc + (parseFloat(t.amount) * parseFloat(t.exchangeRate)), 0)

    const installmentExpenses = expenses
        .filter(t => t.isInstallments)
        .reduce((acc, t) => acc + (parseFloat(t.amount) * parseFloat(t.exchangeRate)), 0)

    const normalExpenses = totalExpenses - fixedExpenses - installmentExpenses

    // Percentages
    const fixedPct = totalExpenses > 0 ? (fixedExpenses / totalExpenses) * 100 : 0
    const installmentPct = totalExpenses > 0 ? (installmentExpenses / totalExpenses) * 100 : 0
    const normalPct = totalExpenses > 0 ? (normalExpenses / totalExpenses) * 100 : 0

    // 2. Calculate Income vs Expenses for Savings rate
    const totalIncome = transactions
        .filter(t => t.type === "INCOME")
        .reduce((acc, t) => acc + (parseFloat(t.amount) * parseFloat(t.exchangeRate)), 0)

    const netSavings = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

    // SVG Donut Calculations
    const radius = 15.91549430918954
    const circumference = 2 * Math.PI * radius // 100

    // Segments calculations
    const strokeDasharrayFixed = `${fixedPct} ${100 - fixedPct}`
    const strokeDasharrayInstallments = `${installmentPct} ${100 - installmentPct}`
    const strokeDasharrayNormal = `${normalPct} ${100 - normalPct}`

    // Offset is calculated cumulatively
    const offsetFixed = 100 - fixedPct + 25 // start from top (25)
    const offsetInstallments = 100 - fixedPct - installmentPct + 25
    const offsetNormal = 100 - fixedPct - installmentPct - normalPct + 25

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
            {/* Donut Chart Card */}
            <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-900/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold tracking-tight">Distribución de Gastos</CardTitle>
                    <CardDescription>Análisis de los gastos fijos, en cuotas y discrecionales del mes</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                        {/* SVG Donut */}
                        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                            {totalExpenses === 0 ? (
                                <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="21"
                                        cy="21"
                                        r={radius}
                                        fill="transparent"
                                        stroke="#e4e4e7"
                                        strokeWidth="4.5"
                                        className="dark:stroke-zinc-800"
                                    />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                                    {/* Background Track */}
                                    <circle
                                        cx="21"
                                        cy="21"
                                        r={radius}
                                        fill="transparent"
                                        stroke="#f4f4f5"
                                        strokeWidth="4"
                                        className="dark:stroke-zinc-800/30"
                                    />
                                    {/* Comunes / Normales */}
                                    {normalPct > 0 && (
                                        <circle
                                            cx="21"
                                            cy="21"
                                            r={radius}
                                            fill="transparent"
                                            stroke="#a1a1aa" // zinc-400
                                            strokeWidth="4.5"
                                            strokeDasharray={strokeDasharrayNormal}
                                            strokeDashoffset={offsetNormal}
                                            strokeLinecap="round"
                                            className="transition-all duration-500 ease-out"
                                        />
                                    )}
                                    {/* En Cuotas */}
                                    {installmentPct > 0 && (
                                        <circle
                                            cx="21"
                                            cy="21"
                                            r={radius}
                                            fill="transparent"
                                            stroke="#6366f1" // indigo-500
                                            strokeWidth="4.5"
                                            strokeDasharray={strokeDasharrayInstallments}
                                            strokeDashoffset={offsetInstallments}
                                            strokeLinecap="round"
                                            className="transition-all duration-500 ease-out"
                                        />
                                    )}
                                    {/* Fijos */}
                                    {fixedPct > 0 && (
                                        <circle
                                            cx="21"
                                            cy="21"
                                            r={radius}
                                            fill="transparent"
                                            stroke="#10b981" // emerald-500
                                            strokeWidth="4.5"
                                            strokeDasharray={strokeDasharrayFixed}
                                            strokeDashoffset={offsetFixed}
                                            strokeLinecap="round"
                                            className="transition-all duration-500 ease-out"
                                        />
                                    )}
                                </svg>
                            )}

                            {/* Inner Info text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Gastos</span>
                                <span className="text-base font-extrabold text-zinc-800 dark:text-zinc-100 tabular-nums">
                                    {preferredCurrency} {totalExpenses.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        </div>

                        {/* Interactive Legend list */}
                        <div className="flex-1 w-full space-y-4 max-w-sm">
                            {/* Fijos */}
                            <div className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-3.5 h-3.5 rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/20" />
                                    <div>
                                        <p className="text-xs font-semibold text-zinc-500">Gastos Fijos</p>
                                        <p className="text-[10px] text-zinc-400">Alquiler, expensas, abonos...</p>
                                    </div>
                                </div>
                                <div className="text-right" suppressHydrationWarning>
                                    <p className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                        {preferredCurrency} {fixedExpenses.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{fixedPct.toFixed(1)}%</p>
                                </div>
                            </div>

                            {/* En Cuotas */}
                            <div className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-3.5 h-3.5 rounded-md bg-indigo-500 shadow-sm shadow-indigo-500/20" />
                                    <div>
                                        <p className="text-xs font-semibold text-zinc-500">En Cuotas</p>
                                        <p className="text-[10px] text-zinc-400">Tarjetas de crédito, pagos financiados</p>
                                    </div>
                                </div>
                                <div className="text-right" suppressHydrationWarning>
                                    <p className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                        {preferredCurrency} {installmentExpenses.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{installmentPct.toFixed(1)}%</p>
                                </div>
                            </div>

                            {/* Comunes / Variables */}
                            <div className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-3.5 h-3.5 rounded-md bg-zinc-400 shadow-sm shadow-zinc-400/20" />
                                    <div>
                                        <p className="text-xs font-semibold text-zinc-500">Gastos Comunes</p>
                                        <p className="text-[10px] text-zinc-400">Almuerzos, ocio, salidas...</p>
                                    </div>
                                </div>
                                <div className="text-right" suppressHydrationWarning>
                                    <p className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                        {preferredCurrency} {normalExpenses.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-[10px] font-bold text-zinc-500">{normalPct.toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Savings Rate Card */}
            <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-900/50 backdrop-blur-sm flex flex-col justify-between">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold tracking-tight">Capacidad de Ahorro</CardTitle>
                    <CardDescription>Relación entre tus ingresos y gastos del mes</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col justify-center space-y-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                            netSavings >= 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-rose-50 text-rose-600 dark:bg-rose-500/10"
                        )}>
                            {netSavings >= 0 ? <PiggyBank size={24} /> : <ShieldAlert size={24} />}
                        </div>
                        <div suppressHydrationWarning>
                            <p className="text-xs font-medium text-zinc-400">Balance Neto</p>
                            <p className={cn(
                                "text-2xl font-black tabular-nums",
                                netSavings >= 0 ? "text-emerald-600" : "text-rose-600"
                            )}>
                                {netSavings >= 0 ? "+" : ""}{preferredCurrency} {netSavings.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar comparisons */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold" suppressHydrationWarning>
                            <span className="text-zinc-400">Presupuesto Utilizado</span>
                            <span className={cn(
                                netSavings >= 0 ? "text-zinc-600 dark:text-zinc-300" : "text-rose-500"
                            )}>
                                {totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(0) : "100"}%
                            </span>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="h-3.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200/50 dark:border-zinc-800/40">
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
                        <div className="flex justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider" suppressHydrationWarning>
                            <span>Ingresos: {preferredCurrency} {totalIncome.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                            <span>Gastos: {preferredCurrency} {totalExpenses.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>

                    {/* Savings Message Indicator */}
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/20 text-xs leading-relaxed text-zinc-500" suppressHydrationWarning>
                        {totalIncome === 0 ? (
                            "Registra tus ingresos y gastos para calcular tu tasa de ahorro de este período."
                        ) : netSavings >= 0 ? (
                            <>
                                ¡Excelente! Estás ahorrando el <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{savingsRate.toFixed(0)}%</strong> de tus ingresos mensuales en este periodo.
                            </>
                        ) : (
                            <>
                                <strong className="text-rose-500 font-extrabold">Alerta de presupuesto</strong>: tus gastos superaron a tus ingresos por {preferredCurrency} {Math.abs(netSavings).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}.
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
