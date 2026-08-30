"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { History, Trash2, ArrowDownLeft, ArrowUpRight, Link2, Loader2, Edit3, Filter } from "lucide-react"
import { deleteInvestmentTransaction } from "@/app/actions/investments"
import { EditInvestmentModal, EditTransactionData } from "./edit-investment-modal"
import { MaskedValue } from "@/components/privacy-provider"
import { formatCurrency, formatQuantity } from "@/lib/formatters"
import { triggerHaptic } from "@/lib/haptics"
import { toast } from "sonner"

interface InvestmentHistoryProps {
    transactions: {
        id: string
        assetId: string
        symbol: string
        name: string
        assetType: string
        type: string
        quantity: number
        unitPrice: number
        totalAmount: number
        currency: string
        fees: number
        date: string
        notes: string | null
        linkedTransactionId: string | null
    }[]
    workspaceId: string
    baseCurrency: string
}

const TYPE_COLORS: Record<string, string> = {
    CRYPTO: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
    STOCK: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30",
    ETF: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
    CEDEAR: "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30",
    BOND: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30",
    OTHER: "bg-zinc-500/15 text-zinc-800 dark:text-zinc-300 border-zinc-500/30",
}

const PAGE_SIZE = 15

export function InvestmentHistory({
    transactions,
    workspaceId,
    baseCurrency,
}: InvestmentHistoryProps) {
    const [editingTx, setEditingTx] = React.useState<EditTransactionData | null>(null)
    const [selectedTx, setSelectedTx] = React.useState<any | null>(null)
    const [deleteLinkedExpense, setDeleteLinkedExpense] = React.useState(true)
    const [isDeleting, setIsDeleting] = React.useState(false)

    // Pill Filter state
    const [activeFilter, setActiveFilter] = React.useState<"ALL" | "BUY" | "SELL" | "CRYPTO" | "STOCK" | "CEDEAR">("ALL")
    
    // Progressive pagination state
    const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)
    const observerTarget = React.useRef<HTMLDivElement>(null)

    // Filter transactions
    const filteredTxs = React.useMemo(() => {
        return transactions.filter((tx) => {
            if (activeFilter === "ALL") return true
            if (activeFilter === "BUY") return tx.type === "BUY"
            if (activeFilter === "SELL") return tx.type === "SELL"
            if (activeFilter === "CRYPTO") return tx.assetType === "CRYPTO"
            if (activeFilter === "STOCK") return tx.assetType === "STOCK" || tx.assetType === "ETF"
            if (activeFilter === "CEDEAR") return tx.assetType === "CEDEAR"
            return true
        })
    }, [transactions, activeFilter])

    // Reset visible count when filter changes
    React.useEffect(() => {
        setVisibleCount(PAGE_SIZE)
    }, [activeFilter])

    // IntersectionObserver for infinite scrolling
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleCount < filteredTxs.length) {
                    setVisibleCount((prev) => prev + PAGE_SIZE)
                }
            },
            { threshold: 0.1 }
        )

        const currentTarget = observerTarget.current
        if (currentTarget) {
            observer.observe(currentTarget)
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget)
            }
        }
    }, [filteredTxs.length, visibleCount])

    const handleDelete = async () => {
        if (!selectedTx) return
        setIsDeleting(true)
        try {
            const res = await deleteInvestmentTransaction(selectedTx.id, workspaceId, deleteLinkedExpense)
            if (res.success) {
                toast.success("Operación eliminada correctamente")
                setSelectedTx(null)
            } else {
                toast.error(res.error || "Error al eliminar la operación")
            }
        } catch (err) {
            toast.error("Error al procesar la solicitud")
        } finally {
            setIsDeleting(false)
        }
    }

    const visibleTxs = filteredTxs.slice(0, visibleCount)

    const filters = [
        { id: "ALL", label: "Todos" },
        { id: "BUY", label: "Compras" },
        { id: "SELL", label: "Ventas" },
        { id: "CRYPTO", label: "Cripto" },
        { id: "STOCK", label: "Acciones / ETFs" },
        { id: "CEDEAR", label: "CEDEARs" },
    ]

    return (
        <>
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
                <CardHeader className="pb-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                <History className="w-4 h-4 text-emerald-500" />
                                Historial de Operaciones
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-500">
                                {filteredTxs.length} transacciones registradas
                            </CardDescription>
                        </div>
                    </div>

                    {/* Pill Filters Bar */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
                        {filters.map((f) => {
                            const isActive = activeFilter === f.id
                            return (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic("selection")
                                        setActiveFilter(f.id as any)
                                    }}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full shrink-0 transition-all duration-100 active:scale-95 touch-manipulation cursor-pointer ${
                                        isActive
                                            ? "bg-emerald-600 text-white shadow-xs"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                    }`}
                                >
                                    {f.label}
                                </button>
                            )
                        })}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {filteredTxs.length === 0 ? (
                        <div className="p-8 text-center text-xs text-zinc-400">
                            No hay transacciones registradas para este filtro.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {visibleTxs.map((tx) => {
                                const isBuy = tx.type === "BUY"
                                return (
                                    <div
                                        key={tx.id}
                                        className="p-4 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <div
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                                    isBuy
                                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                                        : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                                                }`}
                                            >
                                                {isBuy ? (
                                                    <ArrowDownLeft className="w-4 h-4" />
                                                ) : (
                                                    <ArrowUpRight className="w-4 h-4" />
                                                )}
                                            </div>

                                            <div className="space-y-0.5 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                                                        {isBuy ? "Compra de" : "Venta de"} {tx.symbol}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[9px] px-1.5 py-0 font-semibold ${
                                                            isBuy
                                                                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                                                                : "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30"
                                                        }`}
                                                    >
                                                        {isBuy ? "Compra" : "Venta"}
                                                    </Badge>
                                                    {tx.linkedTransactionId && (
                                                        <span
                                                            title="Sincronizado con balance de gastos"
                                                            className="inline-flex items-center text-[10px] text-zinc-400 hover:text-emerald-500"
                                                        >
                                                            <Link2 className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-zinc-400 flex flex-wrap items-center gap-x-2 font-mono tabular-nums">
                                                    <span className="font-sans">{tx.date}</span>
                                                    <span>•</span>
                                                    <span>
                                                        {formatQuantity(tx.quantity)} {tx.symbol} @{" "}
                                                        <MaskedValue value={formatCurrency(tx.unitPrice, tx.currency)} />
                                                    </span>
                                                    {tx.fees > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span>Comisión: <MaskedValue value={formatCurrency(tx.fees, tx.currency)} /></span>
                                                        </>
                                                    )}
                                                </div>
                                                {tx.notes && (
                                                    <div className="text-[11px] text-zinc-500 italic mt-0.5 truncate max-w-xs sm:max-w-md">
                                                        "{tx.notes}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="text-right mr-1 font-mono tabular-nums">
                                                <div className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-50">
                                                    <MaskedValue value={formatCurrency(tx.totalAmount, tx.currency)} />
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    triggerHaptic("light")
                                                    setEditingTx(tx as any)
                                                }}
                                                className="h-8 w-8 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-90 touch-manipulation cursor-pointer"
                                                title="Editar operación"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    triggerHaptic("light")
                                                    setSelectedTx(tx)
                                                }}
                                                className="h-8 w-8 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-90 touch-manipulation cursor-pointer"
                                                title="Eliminar operación"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Sentinel element for infinite scroll */}
                            {visibleCount < filteredTxs.length && (
                                <div ref={observerTarget} className="p-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                                    <span>Cargando más operaciones...</span>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Investment Transaction Modal */}
            <EditInvestmentModal
                isOpen={!!editingTx}
                onClose={() => setEditingTx(null)}
                workspaceId={workspaceId}
                transaction={editingTx}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">¿Eliminar operación de inversión?</DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">
                            Esta acción eliminará el registro de {selectedTx?.type === "BUY" ? "compra" : "venta"} de{" "}
                            {selectedTx?.symbol} por {selectedTx && formatCurrency(selectedTx.totalAmount, selectedTx.currency)}.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTx?.linkedTransactionId && (
                        <div className="py-2">
                            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                <input
                                    type="checkbox"
                                    checked={deleteLinkedExpense}
                                    onChange={(e) => setDeleteLinkedExpense(e.target.checked)}
                                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                />
                                <span>También eliminar el gasto vinculado en el workspace</span>
                            </label>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => setSelectedTx(null)} disabled={isDeleting}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="gap-1.5"
                        >
                            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
