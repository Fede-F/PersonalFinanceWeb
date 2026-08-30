"use client"

import React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

export interface CategorySegment {
    name: string
    pct: number
    amount: number
    color: string
}

interface ExpenseDonutProps {
    totalExpenses: number
    segments: CategorySegment[]
}

export const DesktopExpenseDonut: React.FC<ExpenseDonutProps> = ({
    totalExpenses,
    segments,
}) => {
    const data = segments.map((s) => ({
        name: s.name,
        value: s.amount,
        pct: s.pct,
        color: s.color,
    }))

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload
            return (
                <div className="relative z-50 bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-700/90 p-2.5 rounded-xl shadow-2xl text-xs space-y-1 select-none pointer-events-none">
                    <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-zinc-500 font-mono tabular-nums">
                        <span>Monto:</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {item.value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                    <div className="flex justify-between gap-4 text-zinc-500 font-mono tabular-nums">
                        <span>Porcentaje:</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {item.pct.toFixed(1)}%
                        </span>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <div className="flex items-center gap-6 mt-2">
            {/* Donut chart */}
            <div className="relative w-[140px] h-[140px] shrink-0 flex items-center justify-center">
                {totalExpenses === 0 ? (
                    <div className="w-full h-full rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-xs text-zinc-400">
                        Sin datos
                    </div>
                ) : (
                    <>
                        {/* Center label (z-0) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 pointer-events-none z-0">
                            <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Gastos</span>
                            <span className="text-sm font-black text-zinc-800 dark:text-zinc-100 font-mono tabular-nums truncate max-w-[90px]">
                                {totalExpenses.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                            </span>
                        </div>

                        <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                            <PieChart>
                                <Tooltip
                                    wrapperStyle={{ zIndex: 1000, pointerEvents: "none" }}
                                    content={<CustomTooltip />}
                                />
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={42}
                                    outerRadius={62}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </>
                )}
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {segments.map((seg, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2" suppressHydrationWarning>
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                            <div className="flex flex-col min-w-0">
                                <span className="font-bold text-zinc-600 dark:text-zinc-400 text-xs leading-tight truncate">
                                    {seg.name}
                                </span>
                            </div>
                        </div>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm tabular-nums shrink-0">
                            {seg.pct.toFixed(0)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
