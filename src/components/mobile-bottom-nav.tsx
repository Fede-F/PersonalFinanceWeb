"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, TrendingUp, Plus } from "lucide-react"
import { triggerHaptic } from "@/lib/haptics"

interface MobileBottomNavProps {
    currentWorkspaceId?: string
    onQuickActionClick?: () => void
}

export function MobileBottomNav({
    currentWorkspaceId,
    onQuickActionClick,
}: MobileBottomNavProps) {
    const pathname = usePathname()
    const wsParam = currentWorkspaceId ? `?workspaceId=${currentWorkspaceId}` : ""

    const isDashboard = pathname === "/dashboard" || pathname === "/"
    const isInvestments = pathname === "/investments"

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 px-6 py-2 pb-safe shadow-lg select-none">
            <div className="flex items-center justify-around relative">
                {/* 1. Dashboard / Gastos */}
                <Link
                    href={`/dashboard${wsParam}`}
                    onClick={() => triggerHaptic("light")}
                    className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all duration-100 active:scale-90 touch-manipulation ${
                        isDashboard
                            ? "text-emerald-600 dark:text-emerald-400 font-bold"
                            : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium"
                    }`}
                >
                    <LayoutDashboard className={`w-5 h-5 ${isDashboard ? "stroke-[2.5]" : ""}`} />
                    <span className="text-[10px]">Gastos</span>
                </Link>

                {/* 2. Quick Action Center Button */}
                {onQuickActionClick && (
                    <button
                        onClick={() => {
                            triggerHaptic("light")
                            onQuickActionClick()
                        }}
                        className="-mt-5 w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-90 active:shadow-md text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all duration-100 cursor-pointer touch-manipulation"
                        title="Nueva Operación"
                    >
                        <Plus className="w-6 h-6 stroke-[2.5]" />
                    </button>
                )}

                {/* 3. Inversiones */}
                <Link
                    href={`/investments${wsParam}`}
                    onClick={() => triggerHaptic("light")}
                    className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all duration-100 active:scale-90 touch-manipulation ${
                        isInvestments
                            ? "text-emerald-600 dark:text-emerald-400 font-bold"
                            : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium"
                    }`}
                >
                    <TrendingUp className={`w-5 h-5 ${isInvestments ? "stroke-[2.5]" : ""}`} />
                    <span className="text-[10px]">Inversiones</span>
                </Link>
            </div>
        </div>
    )
}
