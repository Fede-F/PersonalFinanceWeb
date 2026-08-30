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
import { updateCustomAssetPrice } from "@/app/actions/investments"
import { toast } from "sonner"
import { Loader2, DollarSign, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"

export interface UpdatePriceAssetData {
    assetId: string
    symbol: string
    name: string
    currentPrice: number
    currency: string
}

interface UpdateAssetPriceModalProps {
    isOpen: boolean
    onClose: () => void
    workspaceId: string
    asset: UpdatePriceAssetData | null
}

export function UpdateAssetPriceModal({
    isOpen,
    onClose,
    workspaceId,
    asset,
}: UpdateAssetPriceModalProps) {
    const [price, setPrice] = React.useState("")
    const [currency, setCurrency] = React.useState("USD")
    const [date, setDate] = React.useState(new Date().toISOString().split("T")[0])
    const [isLoading, setIsLoading] = React.useState(false)

    React.useEffect(() => {
        if (asset) {
            setPrice(asset.currentPrice > 0 ? asset.currentPrice.toString() : "")
            setCurrency(asset.currency || "USD")
            setDate(new Date().toISOString().split("T")[0])
        }
    }, [asset])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!asset) return

        const numPrice = parseFloat(price)
        if (isNaN(numPrice) || numPrice < 0) {
            toast.error("Ingresa un precio o cotización válida")
            return
        }

        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("assetId", asset.assetId)
            formData.append("workspaceId", workspaceId)
            formData.append("price", price.trim())
            formData.append("currency", currency)
            formData.append("date", date)

            const res = await updateCustomAssetPrice(formData)
            if (res.success) {
                toast.success(`Cotización de ${asset.symbol} actualizada correctamente`)
                onClose()
            } else {
                toast.error(res.error || "Error al actualizar cotización")
            }
        } catch (err) {
            toast.error("Error al procesar la solicitud")
        } finally {
            setIsLoading(false)
        }
    }

    if (!asset) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        Actualizar Cotización: {asset.symbol}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500">
                        Ingresa el valor de mercado o cotización estimada actual para este activo.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Asset Info Card */}
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                                {asset.symbol} - {asset.name}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                                Precio actual registrado:
                            </span>
                        </div>
                        <span className="font-bold text-xs font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                            {formatCurrency(asset.currentPrice, asset.currency)}
                        </span>
                    </div>

                    {/* Price and Currency */}
                    <div className="space-y-1.5">
                        <Label htmlFor="new-price" className="text-xs font-semibold">
                            Nueva Cotización / Valor Unitario *
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="new-price"
                                type="number"
                                step="any"
                                placeholder="Ej: 150000"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="font-bold text-sm"
                                required
                                autoFocus
                            />
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-24 h-9 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-zinc-900 dark:text-zinc-50 font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                            >
                                <option value="USD">USD</option>
                                <option value="ARS">ARS</option>
                                <option value="EUR">EUR</option>
                                <option value="BRL">BRL</option>
                            </select>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-1.5">
                        <Label htmlFor="price-date" className="text-xs font-semibold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            Fecha de Valuación
                        </Label>
                        <Input
                            id="price-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        >
                            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Actualizar Precio
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
