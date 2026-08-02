import React from "react"
import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
    return (
        <div className="flex flex-col min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
            {/* Header Skeleton */}
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-6 border-b bg-white/85 backdrop-blur-md dark:bg-zinc-900/85">
                <div className="flex items-center gap-3">
                    {/* Logo skeleton */}
                    <div className="w-8 h-8 rounded bg-emerald-500/20 dark:bg-emerald-500/10 animate-pulse" />
                    {/* Workspace switcher skeleton */}
                    <div className="w-40 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                </div>
                
                {/* Period Selector placeholder */}
                <div className="hidden md:flex w-48 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />

                <div className="flex items-center gap-3">
                    {/* Theme switcher / Notification / User nav skeletons */}
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                </div>
            </header>

            {/* Mobile Period Selector Skeleton */}
            <div className="flex justify-center mt-4 md:hidden px-6">
                <div className="w-48 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>

            {/* Main Content Skeleton */}
            <main className="flex-1 p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
                
                {/* Central spinner to indicate active data fetching explicitly */}
                <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm font-medium py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    <span>Cargando datos financieros...</span>
                </div>

                {/* PC Layout: 3 Columns (SavingsRate | Cards + Activity | ExpensesDistribution) */}
                <div className="hidden lg:grid grid-cols-4 gap-6 items-start">
                    
                    {/* Left Column: Savings Rate */}
                    <div className="col-span-1 border rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                        <div className="h-5 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                        <div className="flex justify-center py-6">
                            <div className="w-32 h-32 rounded-full border-8 border-zinc-200 dark:border-zinc-800 animate-pulse flex items-center justify-center" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full animate-pulse" />
                            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6 animate-pulse" />
                        </div>
                    </div>

                    {/* Center Column: Cards & Activity */}
                    <div className="col-span-2 space-y-6">
                        {/* Two top summary cards */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Card 1 */}
                            <div className="border rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
                                <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                <div className="h-8 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            </div>
                            {/* Card 2 */}
                            <div className="border rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
                                <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                <div className="h-8 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* Activity List */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <div className="h-6 w-28 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                    <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                </div>
                                <div className="w-32 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                            </div>

                            {/* Activity Items */}
                            <div className="border rounded-xl bg-white dark:bg-zinc-900 shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                                            <div className="space-y-2">
                                                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                                <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Expenses Distribution */}
                    <div className="col-span-1 border rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                        <div className="h-5 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                        <div className="space-y-3 pt-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 w-full">
                                        <div className="w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                                        <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                    </div>
                                    <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Layout: 1 Column */}
                <div className="lg:hidden flex flex-col space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-xl p-4 bg-white dark:bg-zinc-900 shadow-sm space-y-2">
                            <div className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                        </div>
                        <div className="border rounded-xl p-4 bg-white dark:bg-zinc-900 shadow-sm space-y-2">
                            <div className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                        </div>
                    </div>

                    {/* Carousel placeholder */}
                    <div className="border rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-sm h-48 animate-pulse" />

                    {/* Mobile Activity List */}
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2 items-center">
                            <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            <div className="h-3.5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            <div className="w-full h-8 mt-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                        </div>

                        <div className="border rounded-xl bg-white dark:bg-zinc-900 shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                                        <div className="space-y-1.5">
                                            <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                            <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
