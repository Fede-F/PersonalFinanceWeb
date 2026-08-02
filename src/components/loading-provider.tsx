"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface LoadingContextType {
    isLoading: boolean
    startLoading: () => void
    stopLoading: () => void
}

const LoadingContext = createContext<LoadingContextType>({
    isLoading: false,
    startLoading: () => { },
    stopLoading: () => { },
})

export const useLoading = () => useContext(LoadingContext)

interface PeriodChangeTrackerProps {
    period: string
}

export function PeriodChangeTracker({ period }: PeriodChangeTrackerProps) {
    const { stopLoading } = useLoading()

    useEffect(() => {
        stopLoading()
    }, [period, stopLoading])

    return null
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false)

    const startLoading = () => setIsLoading(true)
    const stopLoading = () => setIsLoading(false)

    return (
        <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
            {children}

            {/* Premium Top Progress Bar & Blur Overlay */}
            {isLoading && (
                <>
                    {/* Glowing Top Progress Bar */}
                    <div className="fixed top-0 left-0 right-0 h-1 z-[9999] overflow-hidden bg-emerald-500/10">
                        <div className="h-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 w-1/2 rounded-r-full animate-[loading-bar_1.5s_infinite_linear]" />
                    </div>

                    {/* Subtle micro-loading spinner overlay for feedback on both web and mobile */}
                    <div className="fixed inset-0 bg-white/20 dark:bg-zinc-950/20 backdrop-blur-[1px] z-[9998] pointer-events-none flex items-start justify-center pt-24 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-zinc-900 shadow-lg border rounded-full px-4 py-2 flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 animate-bounce">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span>Actualizando período...</span>
                        </div>
                    </div>
                </>
            )}
        </LoadingContext.Provider>
    )
}
