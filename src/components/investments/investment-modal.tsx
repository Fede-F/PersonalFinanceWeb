"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createInvestmentTransaction, getOrCreateAsset } from "@/app/actions/investments"
import { AddAssetModal } from "./add-asset-modal"
import { AssetSearchCombobox } from "./asset-search-combobox"
import { MarketSearchResult } from "@/lib/investment-rates"
import { useInvestmentCurrency } from "./investment-currency-provider"
import { toast } from "sonner"
import { Loader2, Plus, ArrowDownLeft, ArrowUpRight, Calculator, Building2, Sparkles } from "lucide-react"

interface AssetOption {
    id: string
    symbol: string
    name: string
    assetType: string
    defaultCurrency: string
    icon: string | null
}

interface WorkspaceOption {
    id: string
    name: string
    baseCurrency: string
}

interface InvestmentModalProps {
    isOpen: boolean
    onClose: () => void
    workspaceId: string
    availableAssets: AssetOption[]
    userWorkspaces: WorkspaceOption[]
    baseCurrency: string
}

export function InvestmentModal({
    isOpen,
    onClose,
    workspaceId,
    availableAssets,
    userWorkspaces,
    baseCurrency,
}: InvestmentModalProps) {
    const { selectedCurrency } = useInvestmentCurrency()
    const [selectedAsset, setSelectedAsset] = React.useState<MarketSearchResult | null>(null)
    const [type, setType] = React.useState<"BUY" | "SELL">("BUY")
    const [quantity, setQuantity] = React.useState<string>("")
    const [unitPrice, setUnitPrice] = React.useState<string>("")
    const [totalAmount, setTotalAmount] = React.useState<string>("")
    const [currency, setCurrency] = React.useState<string>(selectedCurrency || baseCurrency || "USD")
    const [fees, setFees] = React.useState<string>("")
    const [date, setDate] = React.useState<string>(() => new Date().toISOString().split("T")[0])
    const [notes, setNotes] = React.useState<string>("")

    // Update currency to active switch currency when opening modal
    React.useEffect(() => {
        if (isOpen) {
            setCurrency(selectedCurrency || baseCurrency || "USD")
        }
    }, [isOpen, selectedCurrency, baseCurrency])

    // Workspace discount toggle
    const [discountFromWorkspace, setDiscountFromWorkspace] = React.useState<boolean>(false)
    const [targetExpenseWorkspaceId, setTargetExpenseWorkspaceId] = React.useState<string>(workspaceId)

    // Add Custom Asset modal state
    const [isAddAssetOpen, setIsAddAssetOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)

    // Auto-select first asset if available and none selected
    React.useEffect(() => {
        if (!selectedAsset && availableAssets.length > 0) {
            const first = availableAssets[0]
            setSelectedAsset({
                id: first.id,
                symbol: first.symbol,
                name: first.name,
                assetType: first.assetType as any,
                defaultCurrency: first.defaultCurrency || "USD",
            })
            setCurrency(first.defaultCurrency || "USD")
        }
    }, [availableAssets])

    const handleSelectAsset = (asset: MarketSearchResult) => {
        setSelectedAsset(asset)
        setCurrency(asset.defaultCurrency || "USD")
        if (asset.currentPrice !== undefined && asset.currentPrice > 0) {
            setUnitPrice(asset.currentPrice.toString())
            const q = parseFloat(quantity)
            const f = parseFloat(fees) || 0
            if (!isNaN(q) && q > 0) {
                setTotalAmount((q * asset.currentPrice + (type === "BUY" ? f : -f)).toFixed(2))
            }
        }
    }

    const handleQuantityChange = (val: string) => {
        setQuantity(val)
        const q = parseFloat(val)
        const p = parseFloat(unitPrice)
        const f = parseFloat(fees) || 0
        const t = parseFloat(totalAmount)

        if (!isNaN(q) && q > 0) {
            if (!isNaN(p) && p > 0) {
                setTotalAmount((q * p + (type === "BUY" ? f : -f)).toFixed(2))
            } else if (!isNaN(t) && t > 0) {
                const netT = type === "BUY" ? t - f : t + f
                setUnitPrice((netT / q).toFixed(4))
            }
        }
    }

    const handleUnitPriceChange = (val: string) => {
        setUnitPrice(val)
        const p = parseFloat(val)
        const q = parseFloat(quantity)
        const f = parseFloat(fees) || 0
        const t = parseFloat(totalAmount)

        if (!isNaN(p) && p > 0) {
            if (!isNaN(q) && q > 0) {
                setTotalAmount((q * p + (type === "BUY" ? f : -f)).toFixed(2))
            } else if (!isNaN(t) && t > 0) {
                const netT = type === "BUY" ? t - f : t + f
                setQuantity((netT / p).toFixed(6))
            }
        }
    }

    const handleTotalAmountChange = (val: string) => {
        setTotalAmount(val)
        const t = parseFloat(val)
        const q = parseFloat(quantity)
        const p = parseFloat(unitPrice)
        const f = parseFloat(fees) || 0
        const netT = type === "BUY" ? t - f : t + f

        if (!isNaN(t) && t > 0) {
            if (!isNaN(q) && q > 0) {
                setUnitPrice((netT / q).toFixed(4))
            } else if (!isNaN(p) && p > 0) {
                setQuantity((netT / p).toFixed(6))
            }
        }
    }

    const handleFeesChange = (val: string) => {
        setFees(val)
        const f = parseFloat(val) || 0
        const q = parseFloat(quantity)
        const p = parseFloat(unitPrice)
        if (!isNaN(q) && q > 0 && !isNaN(p) && p > 0) {
            setTotalAmount((q * p + (type === "BUY" ? f : -f)).toFixed(2))
        }
    }

    const handleAssetCreated = (newAsset: any) => {
        const mapped: MarketSearchResult = {
            id: newAsset.id,
            symbol: newAsset.symbol,
            name: newAsset.name,
            assetType: newAsset.assetType,
            defaultCurrency: newAsset.defaultCurrency,
        }
        handleSelectAsset(mapped)
    }

    // Calculated effective total
    const numQty = parseFloat(quantity) || 0
    const numPrice = parseFloat(unitPrice) || 0
    const numFees = parseFloat(fees) || 0
    const effectiveTotal = parseFloat(totalAmount) || (numQty * numPrice + (type === "BUY" ? numFees : -numFees))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAsset || (!quantity && !totalAmount)) {
            toast.error("Por favor selecciona un activo y completa los montos requeridos")
            return
        }

        if (numQty <= 0 || numPrice < 0 || effectiveTotal <= 0) {
            toast.error("La cantidad, precio y total deben ser valores válidos mayores a cero")
            return
        }

        setIsLoading(true)
        try {
            // 1. Ensure asset exists in DB and get its ID
            const assetRes = await getOrCreateAsset({
                id: selectedAsset.id,
                symbol: selectedAsset.symbol,
                name: selectedAsset.name,
                assetType: selectedAsset.assetType,
                defaultCurrency: selectedAsset.defaultCurrency,
                workspaceId,
            })

            if (!assetRes.success || !assetRes.asset) {
                toast.error(assetRes.error || "Error al procesar el activo")
                setIsLoading(false)
                return
            }

            const assetId = assetRes.asset.id

            const formData = new FormData()
            formData.append("workspaceId", workspaceId)
            formData.append("assetId", assetId)
            formData.append("type", type)
            formData.append("quantity", quantity.trim())
            formData.append("unitPrice", unitPrice.trim())
            formData.append("totalAmount", effectiveTotal.toString())
            formData.append("currency", currency)
            formData.append("fees", fees ? fees.trim() : "0")
            formData.append("date", date)
            formData.append("notes", notes.trim())
            formData.append("discountFromWorkspace", discountFromWorkspace ? "true" : "false")
            if (discountFromWorkspace) {
                formData.append("targetExpenseWorkspaceId", targetExpenseWorkspaceId)
            }

            const res = await createInvestmentTransaction(formData)
            if (res.success) {
                toast.success(
                    `${type === "BUY" ? "Compra" : "Venta"} de ${selectedAsset.symbol} registrada con éxito`
                )
                setQuantity("")
                setUnitPrice("")
                setTotalAmount("")
                setFees("")
                setNotes("")
                setDiscountFromWorkspace(false)
                onClose()
            } else {
                toast.error(res.error || "Error al registrar la operación")
            }
        } catch (err) {
            toast.error("Error al procesar la operación")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            {type === "BUY" ? (
                                <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <ArrowUpRight className="w-5 h-5 text-rose-500" />
                            )}
                            Registrar Operación de Inversión
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">
                            Ingresa la cantidad y precio, o directamente el total invertido.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        {/* Type Toggle: BUY vs SELL */}
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setType("BUY")}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                                    type === "BUY"
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                }`}
                            >
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                Compra (Buy)
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("SELL")}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                                    type === "SELL"
                                        ? "bg-rose-600 text-white shadow-xs"
                                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                }`}
                            >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                Venta (Sell)
                            </button>
                        </div>

                        {/* Live Asset Search Combobox */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="asset-search" className="text-xs font-semibold">
                                    Activo / Ticker *
                                </Label>
                                <button
                                    type="button"
                                    onClick={() => setIsAddAssetOpen(true)}
                                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                                >
                                    <Plus className="w-3 h-3" />
                                    ¿Falta un activo? Agrégalo
                                </button>
                            </div>

                            <AssetSearchCombobox
                                workspaceId={workspaceId}
                                selectedAsset={selectedAsset}
                                onSelectAsset={handleSelectAsset}
                                onOpenAddCustomModal={() => setIsAddAssetOpen(true)}
                            />
                        </div>

                        {/* Quantity and Unit Price */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="inv-quantity" className="text-xs font-semibold">
                                    Cantidad *
                                </Label>
                                <Input
                                    id="inv-quantity"
                                    type="number"
                                    step="any"
                                    placeholder="Ej: 0.05 o 10"
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="inv-price" className="text-xs font-semibold">
                                    Precio Unitario *
                                </Label>
                                <Input
                                    id="inv-price"
                                    type="number"
                                    step="any"
                                    placeholder="Ej: 95000"
                                    value={unitPrice}
                                    onChange={(e) => handleUnitPriceChange(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Total Invested (Editable & Bi-directional) with Currency Selector */}
                        <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="inv-total" className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                    <Calculator className="w-3.5 h-3.5 text-emerald-500" />
                                    {type === "BUY" ? "Total Invertido (Monto Pagado) *" : "Total Recibido (Monto Cobrado) *"}
                                </Label>
                                <span className="text-[10px] text-zinc-400 font-medium">Cálculo bidireccional</span>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    id="inv-total"
                                    type="number"
                                    step="any"
                                    placeholder="Ej: 100000"
                                    value={totalAmount}
                                    onChange={(e) => handleTotalAmountChange(e.target.value)}
                                    className="font-bold text-sm bg-white dark:bg-zinc-900"
                                    required
                                />
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-24 h-9 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-zinc-900 dark:text-zinc-50 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-bold"
                                >
                                    <option value="USD">USD</option>
                                    <option value="ARS">ARS</option>
                                    <option value="EUR">EUR</option>
                                    <option value="BRL">BRL</option>
                                </select>
                            </div>
                        </div>

                        {/* Fees and Date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="inv-fees" className="text-xs font-semibold">
                                    Comisión / Fees (Opcional)
                                </Label>
                                <Input
                                    id="inv-fees"
                                    type="number"
                                    step="any"
                                    placeholder="0.00"
                                    value={fees}
                                    onChange={(e) => handleFeesChange(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="inv-date" className="text-xs font-semibold">
                                    Fecha de Operación *
                                </Label>
                                <Input
                                    id="inv-date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Total Calculated Banner */}
                        <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg flex items-center justify-between border border-emerald-500/20">
                            <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                                <Calculator className="w-4 h-4 text-emerald-500" />
                                <span>Total {type === "BUY" ? "Invertido" : "Recibido"} Efectivo:</span>
                            </div>
                            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                                {new Intl.NumberFormat("es-AR", {
                                    style: "currency",
                                    currency: currency,
                                    maximumFractionDigits: 2,
                                }).format(effectiveTotal)}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <Label htmlFor="inv-notes" className="text-xs font-semibold">
                                Notas / Detalle (Opcional)
                            </Label>
                            <Input
                                id="inv-notes"
                                placeholder="Ej: Compra mensual DCA, broker Binance"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {/* Discount from Workspace Balance Toggle (only on BUY) */}
                        {type === "BUY" && userWorkspaces.length > 0 && (
                            <div className="space-y-2 p-3 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <label className="flex items-start gap-2.5 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={discountFromWorkspace}
                                        onChange={(e) => setDiscountFromWorkspace(e.target.checked)}
                                        className="mt-0.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0"
                                    />
                                    <div>
                                        <span className="font-semibold block">Descontar del balance de un Workspace</span>
                                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                                            Crea un gasto automático en el módulo de gastos para mantener el saldo sincronizado.
                                        </span>
                                    </div>
                                </label>

                                {discountFromWorkspace && (
                                    <div className="pt-2">
                                        <Label htmlFor="target-workspace" className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                                            Workspace a descontar el gasto:
                                        </Label>
                                        <select
                                            id="target-workspace"
                                            value={targetExpenseWorkspaceId}
                                            onChange={(e) => setTargetExpenseWorkspaceId(e.target.value)}
                                            className="w-full h-8 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 text-zinc-900 dark:text-zinc-50 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden mt-1 font-medium"
                                        >
                                            {userWorkspaces.map((w) => (
                                                <option key={w.id} value={w.id}>
                                                    {w.name} (Moneda: {w.baseCurrency})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isLoading}
                                className={`text-white gap-1.5 ${
                                    type === "BUY" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                                }`}
                            >
                                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {type === "BUY" ? "Registrar Compra" : "Registrar Venta"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Custom Asset Modal */}
            <AddAssetModal
                isOpen={isAddAssetOpen}
                onClose={() => setIsAddAssetOpen(false)}
                workspaceId={workspaceId}
                onAssetCreated={handleAssetCreated}
            />
        </>
    )
}
