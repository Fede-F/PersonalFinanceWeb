"use client"

import * as React from "react"
import { triggerHaptic } from "@/lib/haptics"

interface InvestmentCurrencyContextType {
    selectedCurrency: string
    setSelectedCurrency: (c: string) => void
    baseCurrency: string
    localCurrency: string
    activeCurrency: string
    isUSD: boolean
}

const InvestmentCurrencyContext = React.createContext<InvestmentCurrencyContextType>({
    selectedCurrency: "USD",
    setSelectedCurrency: () => {},
    baseCurrency: "USD",
    localCurrency: "ARS",
    activeCurrency: "USD",
    isUSD: true,
})

export function InvestmentCurrencyProvider({
    baseCurrency,
    children,
}: {
    baseCurrency: string
    children: React.ReactNode
}) {
    // If workspace is USD, default local currency is ARS. Otherwise, it's the workspace currency.
    const localCurrency = baseCurrency === "USD" ? "ARS" : baseCurrency
    const [selectedCurrency, setSelectedCurrencyState] = React.useState<string>(baseCurrency || "USD")
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
        const stored = localStorage.getItem("investment_currency_view")
        if (stored && (stored === "USD" || stored === localCurrency || stored === baseCurrency)) {
            setSelectedCurrencyState(stored)
        } else {
            setSelectedCurrencyState(baseCurrency || "USD")
        }
    }, [baseCurrency, localCurrency])

    const setSelectedCurrency = React.useCallback((curr: string) => {
        triggerHaptic("selection")
        setSelectedCurrencyState(curr)
        localStorage.setItem("investment_currency_view", curr)
    }, [])

    const isUSD = mounted ? selectedCurrency === "USD" : selectedCurrency === "USD"
    const activeCurrency = isUSD ? "USD" : (baseCurrency || "ARS")

    return (
        <InvestmentCurrencyContext.Provider
            value={{
                selectedCurrency: mounted ? selectedCurrency : baseCurrency,
                setSelectedCurrency,
                baseCurrency,
                localCurrency,
                activeCurrency,
                isUSD,
            }}
        >
            {children}
        </InvestmentCurrencyContext.Provider>
    )
}

export function useInvestmentCurrency() {
    return React.useContext(InvestmentCurrencyContext)
}
