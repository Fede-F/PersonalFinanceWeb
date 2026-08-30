"use client"

import * as React from "react"
import { useInvestmentCurrency } from "./investment-currency-provider"
import { triggerHaptic } from "@/lib/haptics"

interface InvestmentCurrencyToggleProps {
    className?: string
    showLabel?: boolean
    labelText?: string
}

export function InvestmentCurrencyToggle({
    className = "",
    showLabel = true,
    labelText = "Moneda a mostrar:",
}: InvestmentCurrencyToggleProps) {
    const { selectedCurrency, setSelectedCurrency, localCurrency, isUSD } = useInvestmentCurrency()

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            {showLabel && (
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap select-none">
                    {labelText}
                </span>
            )}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic("selection")
                        setSelectedCurrency(localCurrency)
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-100 active:scale-95 touch-manipulation cursor-pointer select-none ${
                        !isUSD
                            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                >
                    {localCurrency}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic("selection")
                        setSelectedCurrency("USD")
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-100 active:scale-95 touch-manipulation cursor-pointer select-none ${
                        isUSD
                            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                >
                    USD
                </button>
            </div>
        </div>
    )
}
