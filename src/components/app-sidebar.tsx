"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
    LayoutDashboard,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    Wallet,
    PieChart,
    Layers,
} from "lucide-react"

interface AppSidebarProps {
    currentWorkspaceId?: string
}

export function AppSidebar({ currentWorkspaceId }: AppSidebarProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Read initial collapse state from localStorage
    React.useEffect(() => {
        const saved = localStorage.getItem("sidebar-collapsed")
        if (saved !== null) {
            setIsCollapsed(saved === "true")
        }
    }, [])

    const toggleCollapse = () => {
        const next = !isCollapsed
        setIsCollapsed(next)
        localStorage.setItem("sidebar-collapsed", String(next))
    }

    const wsParam = currentWorkspaceId ? `?workspaceId=${currentWorkspaceId}` : ""

    const navItems = [
        {
            title: "Gastos & Flujo",
            href: `/dashboard${wsParam}`,
            icon: LayoutDashboard,
            active: pathname === "/dashboard" || pathname === "/",
        },
        {
            title: "Inversiones",
            href: `/investments${wsParam}`,
            icon: TrendingUp,
            active: pathname === "/investments",
        },
    ]

    return (
        <aside
            className={`hidden md:flex flex-col border-r bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md transition-all duration-300 z-20 shrink-0 ${
                isCollapsed ? "w-16" : "w-56"
            }`}
        >
            {/* Top Brand */}
            <div className="h-16 flex items-center px-4 border-b border-zinc-200/80 dark:border-zinc-800/80 justify-between">
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <div className="bg-emerald-500 text-white font-black text-sm px-2 py-0.5 rounded shadow-xs">
                            FA
                        </div>
                        <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-50">
                            FinanceApp
                        </span>
                    </div>
                )}
                {isCollapsed && (
                    <div className="mx-auto bg-emerald-500 text-white font-black text-xs px-1.5 py-0.5 rounded shadow-xs">
                        FA
                    </div>
                )}
            </div>

            {/* Navigation links */}
            <div className="flex-1 py-4 px-2 space-y-1.5">
                {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={isCollapsed ? item.title : undefined}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                                item.active
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                            } ${isCollapsed ? "justify-center px-0" : ""}`}
                        >
                            <Icon className={`w-4 h-4 shrink-0 ${item.active ? "text-emerald-500" : ""}`} />
                            {!isCollapsed && <span>{item.title}</span>}
                        </Link>
                    )
                })}
            </div>

            {/* Bottom Collapse Toggle */}
            <div className="p-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <button
                    onClick={toggleCollapse}
                    className="w-full flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs font-medium"
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <ChevronLeft className="w-4 h-4" />
                            <span>Colapsar barra</span>
                        </div>
                    )}
                </button>
            </div>
        </aside>
    )
}
