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

export const MobileExpenseDonut: React.FC<ExpenseDonutProps> = ({
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
                <div className="relative z-50 bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-700/90 p-2 rounded-xl shadow-2xl text-[10px] space-y-0.5 select-none pointer-events-none">
                    <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-50">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name}</span>
                    </div>
                    <div className="flex justify-between gap-2 text-zinc-500 font-mono tabular-nums">
                        <span>{item.value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">({item.pct.toFixed(0)}%)</span>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <div className="flex items-center gap-3 mt-1">
            {/* Donut Chart with Recharts */}
            <div className="relative w-[84px] h-[84px] shrink-0 flex items-center justify-center">
                {totalExpenses === 0 ? (
                    <div className="w-full h-full rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-[9px] text-zinc-400">
                        0
                    </div>
                ) : (
                    <>
                        {/* Center label (z-0) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1 pointer-events-none z-0">
                            <span className="text-[7px] uppercase font-bold text-zinc-400 tracking-wider">Gastos</span>
                            <span className="text-[9px] font-black text-zinc-800 dark:text-zinc-100 font-mono tabular-nums truncate max-w-[50px]">
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
                                    innerRadius={24}
                                    outerRadius={38}
                                    paddingAngle={2}
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
            <div className="flex-1 space-y-1 max-h-[92px] overflow-y-auto pr-1">
                {segments.map((seg, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-1" suppressHydrationWarning>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                            <span className="font-bold text-zinc-600 dark:text-zinc-400 text-[10px] leading-tight truncate">
                                {seg.name}
                            </span>
                        </div>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-[10px] tabular-nums shrink-0">
                            {seg.pct.toFixed(0)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
