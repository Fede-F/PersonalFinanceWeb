"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Info, X } from "lucide-react"
import { MobileExpenseDonut } from "@/components/expense-donut/MobileExpenseDonut"
import { DesktopExpenseDonut } from "@/components/expense-donut/DesktopExpenseDonut"

interface MobileStatsCarouselProps {
    transactions: any[]
    preferredCurrency: string
}

export function MobileStatsCarousel({ transactions, preferredCurrency }: MobileStatsCarouselProps) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [activeSlide, setActiveSlide] = React.useState(0)
    const [showInfo, setShowInfo] = React.useState(false)

    // --- Calculations for Capacidad de Ahorro ---
    const expenses = transactions.filter(t => t.type === "EXPENSE")
    const totalExpenses = expenses.reduce((acc, t) => acc + t.amountInPreferred, 0)

    const totalIncome = transactions
        .filter(t => t.type === "INCOME")
        .reduce((acc, t) => acc + t.amountInPreferred, 0)

    const netSavings = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

    // --- Calculations for Distribución de Gastos ---
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

    const allCategories = Object.values(categoryMap).sort((a, b) => b.amount - a.amount)
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

    const segments = mainCategories.map(cat => ({
        ...cat,
        pct: totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0
    }))


    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollLeft = e.currentTarget.scrollLeft
        const width = e.currentTarget.clientWidth
        if (width > 0) {
            const index = Math.round(scrollLeft / width)
            setActiveSlide(index)
        }
    }

    const scrollToSlide = (index: number) => {
        if (containerRef.current) {
            const width = containerRef.current.clientWidth
            containerRef.current.scrollTo({
                left: index * width,
                behavior: "smooth"
            })
            setActiveSlide(index)
        }
    }

    return (
        <div className="w-full relative group">
            {/* Carousel Container */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 py-2"
                style={{ scrollbarWidth: "none" }}
            >
                {/* SLIDE 1: Capacidad de Ahorro (Compacta) */}
                <div className="w-full shrink-0 snap-center relative">
                    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900/50 backdrop-blur-sm p-4 pb-5 h-[156px] flex flex-col justify-between overflow-hidden relative">
                        {/* Interactive overlay for info */}
                        {showInfo && (
                            <div className="absolute inset-0 bg-white/98 dark:bg-zinc-950/98 flex flex-col justify-between p-3.5 z-20 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1">
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Análisis de Ahorro</span>
                                    <button
                                        onClick={() => setShowInfo(false)}
                                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-zinc-400 hover:text-zinc-650"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                                <div className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed py-1.5 pr-1 overflow-y-auto" suppressHydrationWarning>
                                    {totalIncome === 0 ? (
                                        "Registra tus ingresos y gastos para calcular tu ahorro."
                                    ) : netSavings >= 0 ? (
                                        <>
                                            ¡Buen trabajo! Estás ahorrando el <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{savingsRate.toFixed(0)}%</strong> de tus ingresos mensuales.
                                        </>
                                    ) : (
                                        <>
                                            <strong className="text-rose-500 font-extrabold">Alerta de presupuesto</strong>: tus gastos superaron tus ingresos por {preferredCurrency} {Math.abs(netSavings).toLocaleString("es-AR", { minimumFractionDigits: 0 })}.
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowInfo(false)}
                                    className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 self-end mt-1 hover:underline"
                                >
                                    Volver
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Capacidad de Ahorro</h4>
                            <button
                                onClick={() => setShowInfo(true)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                                title="Ver información"
                            >
                                <Info size={14} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between gap-4 mt-2">
                            <div suppressHydrationWarning className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider leading-none">Balance Neto</p>
                                <p className={cn(
                                    "text-xl xs:text-2xl font-black tabular-nums truncate mt-0.5",
                                    netSavings >= 0 ? "text-emerald-600" : "text-rose-600"
                                )}>
                                    {netSavings >= 0 ? "+" : ""}{preferredCurrency} {netSavings.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </p>
                            </div>

                            <div className="w-[160px] shrink-0 space-y-1">
                                <div className="flex justify-between text-xs font-bold leading-none" suppressHydrationWarning>
                                    <span className="text-zinc-500 dark:text-zinc-400">Uso Presupuesto</span>
                                    <span className={netSavings >= 0 ? "text-zinc-700 dark:text-zinc-200" : "text-rose-500"}>
                                        {totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(0) : "100"}%
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-850 rounded-full overflow-hidden p-0.5 border border-zinc-200/50 dark:border-zinc-800/40">
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
                            </div>
                        </div>
                    </Card>
                </div>

                {/* SLIDE 2: Distribución de Gastos (Compacta) */}
                <div className="w-full shrink-0 snap-center">
                    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900/50 backdrop-blur-sm p-4 pb-5 h-[156px] md:h-auto flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Distribución de Gastos</h4>
                            <span className="text-xs font-bold text-zinc-400 leading-none">Total: {preferredCurrency} {totalExpenses.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
                        </div>
                        {/* Mobile version */}
                        <div className="block md:hidden">
                            <MobileExpenseDonut
                                totalExpenses={totalExpenses}
                                segments={segments}
                            />
                        </div>
                        {/* Desktop version */}
                        <div className="hidden md:block">
                            <DesktopExpenseDonut
                                totalExpenses={totalExpenses}
                                segments={segments}
                            />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-1.5 mt-2">
                <button
                    onClick={() => scrollToSlide(0)}
                    className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        activeSlide === 0 ? "bg-emerald-500 w-3" : "bg-zinc-300 dark:bg-zinc-700"
                    )}
                    aria-label="Ir a diapositiva 1"
                />
                <button
                    onClick={() => scrollToSlide(1)}
                    className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        activeSlide === 1 ? "bg-emerald-500 w-3" : "bg-zinc-300 dark:bg-zinc-700"
                    )}
                    aria-label="Ir a diapositiva 2"
                />
            </div>
        </div>
    )
}
