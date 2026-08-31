"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { searchMarketAssets } from "@/app/actions/investments"
import { MarketSearchResult } from "@/lib/investment-rates"
import { Search, Loader2, X, Clock, TrendingUp, TrendingDown, Plus, Check } from "lucide-react"

interface AssetSearchComboboxProps {
    workspaceId: string
    selectedAsset: MarketSearchResult | null
    onSelectAsset: (asset: MarketSearchResult) => void
    onOpenAddCustomModal?: () => void
}

const searchMemoryCache = new Map<string, { data: MarketSearchResult[]; timestamp: number }>()

const TYPE_COLORS: Record<string, string> = {
    CRYPTO: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
    STOCK: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30",
    ETF: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
    CEDEAR: "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30",
    BOND: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30",
    FCI: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30",
    OTHER: "bg-zinc-500/15 text-zinc-800 dark:text-zinc-300 border-zinc-500/30",
}

const TYPE_LABELS: Record<string, string> = {
    CRYPTO: "Cripto",
    STOCK: "Acción",
    ETF: "ETF",
    CEDEAR: "CEDEAR",
    BOND: "Bono",
    FCI: "FCI",
    OTHER: "Otro",
}

export function AssetSearchCombobox({
    workspaceId,
    selectedAsset,
    onSelectAsset,
    onOpenAddCustomModal,
}: AssetSearchComboboxProps) {
    const [query, setQuery] = React.useState("")
    const [isOpen, setIsOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [results, setResults] = React.useState<MarketSearchResult[]>([])
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Close dropdown on click outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Fetch initial recent assets when focused with memory caching
    const loadRecentOrSearch = React.useCallback(
        async (q: string) => {
            const cacheKey = `${workspaceId}_${q.trim().toLowerCase()}`
            const cached = searchMemoryCache.get(cacheKey)
            if (cached && Date.now() - cached.timestamp < 30 * 1000) {
                setResults(cached.data)
                return
            }

            setIsLoading(true)
            try {
                const res = await searchMarketAssets(q, workspaceId)
                if (res.success && res.results) {
                    searchMemoryCache.set(cacheKey, { data: res.results, timestamp: Date.now() })
                    setResults(res.results)
                }
            } catch (err) {
                console.error("Error searching assets:", err)
            } finally {
                setIsLoading(false)
            }
        },
        [workspaceId]
    )

    // Debounce search when typing
    React.useEffect(() => {
        if (!isOpen) return

        const timer = setTimeout(() => {
            loadRecentOrSearch(query)
        }, 250)

        return () => clearTimeout(timer)
    }, [query, isOpen, loadRecentOrSearch])

    const handleFocus = () => {
        setIsOpen(true)
        if (results.length === 0) {
            loadRecentOrSearch(query)
        }
    }

    const handleSelect = (asset: MarketSearchResult) => {
        onSelectAsset(asset)
        setQuery("")
        setIsOpen(false)
    }

    const formatPrice = (price?: number, currency = "USD") => {
        if (price === undefined || price === null) return ""
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency,
            maximumFractionDigits: price < 1 ? 4 : 2,
        }).format(price)
    }

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Input bar */}
            <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                <Input
                    placeholder={
                        selectedAsset
                            ? `${selectedAsset.symbol} - ${selectedAsset.name}`
                            : "Buscar por ticker o nombre (ej: BTC, Apple, SPY, Galicia)..."
                    }
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={handleFocus}
                    className={`pl-9 pr-16 text-xs h-9 font-medium ${
                        selectedAsset && !query ? "placeholder:text-zinc-900 dark:placeholder:text-zinc-100 placeholder:font-bold" : ""
                    }`}
                />
                <div className="absolute right-2 flex items-center gap-1">
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />}
                    {query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("")
                                loadRecentOrSearch("")
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Selected asset tag indicator if present and not searching */}
            {selectedAsset && !isOpen && (
                <div className="mt-1.5 flex items-center justify-between p-2 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                            {selectedAsset.symbol.slice(0, 3)}
                        </div>
                        <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedAsset.symbol}</span>
                            <span className="text-zinc-500 dark:text-zinc-400 ml-1.5 text-[11px] truncate">
                                {selectedAsset.name}
                            </span>
                        </div>
                        <Badge
                            variant="outline"
                            className={`text-[9px] px-1 py-0 font-normal ${
                                TYPE_COLORS[selectedAsset.assetType] || TYPE_COLORS.OTHER
                            }`}
                        >
                            {TYPE_LABELS[selectedAsset.assetType] || selectedAsset.assetType}
                        </Badge>
                    </div>

                    {selectedAsset.currentPrice !== undefined && selectedAsset.currentPrice > 0 && (
                        <div className="text-right">
                            <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                                {formatPrice(selectedAsset.currentPrice, selectedAsset.defaultCurrency)}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-between">
                        <span>{query ? "Resultados de búsqueda" : "Activos frecuentes / Populares"}</span>
                        {isLoading && <span className="text-emerald-500 font-medium">Buscando...</span>}
                    </div>

                    {results.length === 0 && !isLoading ? (
                        <div className="p-4 text-center text-xs text-zinc-400">
                            No se encontraron activos para "{query}"
                        </div>
                    ) : (
                        <div className="py-1 divide-y divide-zinc-100/50 dark:divide-zinc-800/50">
                            {results.map((item, idx) => {
                                const isSelected = selectedAsset?.symbol === item.symbol
                                return (
                                    <button
                                        key={`${item.symbol}-${idx}`}
                                        type="button"
                                        onClick={() => handleSelect(item)}
                                        className={`w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors ${
                                            isSelected ? "bg-emerald-500/10 dark:bg-emerald-500/15" : ""
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
                                                {item.symbol.slice(0, 3)}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                                        {item.symbol}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[9px] px-1 py-0 font-normal ${
                                                            TYPE_COLORS[item.assetType] || TYPE_COLORS.OTHER
                                                        }`}
                                                    >
                                                        {TYPE_LABELS[item.assetType] || item.assetType}
                                                    </Badge>
                                                    {item.isRecent && (
                                                        <span title="Reciente" className="text-zinc-400">
                                                            <Clock className="w-2.5 h-2.5" />
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-zinc-400 truncate max-w-[200px] sm:max-w-[260px]">
                                                    {item.name}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            {item.currentPrice !== undefined && item.currentPrice > 0 ? (
                                                <>
                                                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                                                        {formatPrice(item.currentPrice, item.defaultCurrency)}
                                                    </div>
                                                    {item.change24hPct !== undefined && (
                                                        <div
                                                            className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${
                                                                item.change24hPct >= 0 ? "text-emerald-500" : "text-rose-500"
                                                            }`}
                                                        >
                                                            {item.change24hPct >= 0 ? (
                                                                <TrendingUp className="w-2.5 h-2.5" />
                                                            ) : (
                                                                <TrendingDown className="w-2.5 h-2.5" />
                                                            )}
                                                            {item.change24hPct >= 0 ? "+" : ""}
                                                            {item.change24hPct.toFixed(1)}%
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-[11px] text-zinc-400 font-medium">
                                                    {item.defaultCurrency}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* Footer button to create custom asset if not found */}
                    {onOpenAddCustomModal && (
                        <div className="p-2 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false)
                                    onOpenAddCustomModal()
                                }}
                                className="w-full py-1.5 px-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                ¿No figura el activo? Crearlo manualmente
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
