import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function InvestmentsLoading() {
    return (
        <div className="flex min-h-screen w-full flex-col bg-zinc-50/50 dark:bg-zinc-950 pb-20 md:pb-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="h-16 border-b bg-white dark:bg-zinc-900 px-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    <div className="hidden md:flex h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-3 sm:p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
                {/* Top Action Bar Skeleton */}
                <div className="h-20 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-4 flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-5 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                        <div className="h-3 w-64 bg-zinc-100 dark:bg-zinc-850 rounded-md" />
                    </div>
                    <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                </div>

                {/* KPIs Row Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="border-none shadow-sm bg-white dark:bg-zinc-900 p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                                <div className="h-7 w-7 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                            </div>
                            <div className="h-6 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                            <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-850 rounded-md" />
                        </Card>
                    ))}
                </div>

                {/* Charts Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-4 h-72 space-y-4">
                            <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                            <div className="h-48 w-full bg-zinc-100 dark:bg-zinc-850 rounded-xl" />
                        </Card>
                    </div>
                    <div>
                        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-4 h-72 space-y-4">
                            <div className="h-5 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                            <div className="h-48 w-full rounded-full border-4 border-dashed border-zinc-200 dark:border-zinc-800 mx-auto" />
                        </Card>
                    </div>
                </div>

                {/* Holdings Table Skeleton */}
                <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-4 space-y-3">
                    <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                    <div className="space-y-2 pt-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 w-full bg-zinc-100 dark:bg-zinc-850 rounded-lg" />
                        ))}
                    </div>
                </Card>
            </main>
        </div>
    )
}
