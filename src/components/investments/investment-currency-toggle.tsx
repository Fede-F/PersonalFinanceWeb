"use client"

import * as React from "react"
import { useInvestmentCurrency } from "./investment-currency-provider"
import { Check, Coins, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { triggerHaptic } from "@/lib/haptics"

export function InvestmentCurrencyToggle({ className = "" }: { className?: string }) {
    const { selectedCurrency, setSelectedCurrency, localCurrency, isUSD } = useInvestmentCurrency()

    return (
        <div className={`flex items-center ${className}`}>
            {/* Desktop Switch Pill (md+) */}
            <div className="hidden md:flex items-center relative group">
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
                    <button
                        type="button"
                        onClick={() => setSelectedCurrency(localCurrency)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-100 active:scale-95 touch-manipulation cursor-pointer ${
                            !isUSD
                                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-xs"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                    >
                        {localCurrency}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCurrency("USD")}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-100 active:scale-95 touch-manipulation cursor-pointer ${
                            isUSD
                                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-xs"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                    >
                        USD
                    </button>
                </div>

                {/* Hover Tooltip on Desktop */}
                <div className="absolute top-full right-0 mt-2 hidden md:group-hover:block z-50 bg-zinc-900 text-zinc-100 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-zinc-800 whitespace-nowrap shadow-xl pointer-events-none select-none transition-all duration-200">
                    Visualizar portafolio en {isUSD ? `moneda local (${localCurrency})` : "Dólares (USD)"}
                </div>
            </div>

            {/* Mobile Dropdown Button (<md) */}
            <div className="flex md:hidden items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => triggerHaptic("light")}
                            className="rounded-full h-9 w-9 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 relative active:scale-90 transition-all duration-100 touch-manipulation"
                            aria-label="Cambiar moneda de visualización"
                        >
                            <Coins className="w-4 h-4 text-emerald-500" />
                            <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-extrabold px-1 py-0.2 rounded bg-emerald-500 text-white leading-tight shadow-xs">
                                {isUSD ? "USD" : localCurrency}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 p-1.5">
                        <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            Moneda de Visualización
                        </div>
                        <DropdownMenuItem
                            onClick={() => setSelectedCurrency(localCurrency)}
                            className="flex items-center justify-between text-xs py-2 cursor-pointer font-medium"
                        >
                            <span>{localCurrency} (Moneda Local)</span>
                            {!isUSD && <Check className="w-4 h-4 text-emerald-500" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setSelectedCurrency("USD")}
                            className="flex items-center justify-between text-xs py-2 cursor-pointer font-medium"
                        >
                            <span>USD (Dólares)</span>
                            {isUSD && <Check className="w-4 h-4 text-emerald-500" />}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
