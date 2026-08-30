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
import { createCustomAsset } from "@/app/actions/investments"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"

interface AddAssetModalProps {
    isOpen: boolean
    onClose: () => void
    workspaceId: string
    onAssetCreated?: (asset: any) => void
}

export function AddAssetModal({
    isOpen,
    onClose,
    workspaceId,
    onAssetCreated,
}: AddAssetModalProps) {
    const [symbol, setSymbol] = React.useState("")
    const [name, setName] = React.useState("")
    const [assetType, setAssetType] = React.useState("STOCK")
    const [defaultCurrency, setDefaultCurrency] = React.useState("USD")
    const [isLoading, setIsLoading] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!symbol || !name) {
            toast.error("Por favor completa el símbolo y el nombre del activo")
            return
        }

        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("workspaceId", workspaceId)
            formData.append("symbol", symbol.trim().toUpperCase())
            formData.append("name", name.trim())
            formData.append("assetType", assetType)
            formData.append("defaultCurrency", defaultCurrency)

            const res = await createCustomAsset(formData)
            if (res.success) {
                toast.success(`Activo ${symbol.toUpperCase()} creado correctamente`)
                if (onAssetCreated) onAssetCreated(res.asset)
                setSymbol("")
                setName("")
                onClose()
            } else {
                toast.error(res.error || "Error al crear el activo")
            }
        } catch (err) {
            toast.error("Error al registrar el activo")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-500" />
                        Crear Nuevo Activo
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500">
                        Agrega un activo personalizado para tu portafolio si no figura en el catálogo.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="asset-symbol" className="text-xs font-semibold">
                            Símbolo / Ticker *
                        </Label>
                        <Input
                            id="asset-symbol"
                            placeholder="Ej: BTC, AAPL, SPY.BA, ETH"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            className="uppercase"
                            required
                        />
                        <p className="text-[10px] text-zinc-400">
                            Para activos argentinos o CEDEARs puedes usar el sufijo .BA (ej: GGAL.BA, AAPL.BA)
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="asset-name" className="text-xs font-semibold">
                            Nombre del Activo *
                        </Label>
                        <Input
                            id="asset-name"
                            placeholder="Ej: Apple Inc, Bitcoin, CEDEAR Nvidia"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="asset-type" className="text-xs font-semibold">
                                Tipo de Activo
                            </Label>
                            <select
                                id="asset-type"
                                value={assetType}
                                onChange={(e) => setAssetType(e.target.value)}
                                className="w-full h-9 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-zinc-900 dark:text-zinc-50 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                            >
                                <option value="CRYPTO">Criptomoneda</option>
                                <option value="STOCK">Acción (USA)</option>
                                <option value="ETF">ETF (Fondo Cotizado)</option>
                                <option value="CEDEAR">CEDEAR (Argentina)</option>
                                <option value="BOND">Bono / Renta Fija</option>
                                <option value="OTHER">Otro</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="asset-curr" className="text-xs font-semibold">
                                Moneda por Defecto
                            </Label>
                            <select
                                id="asset-curr"
                                value={defaultCurrency}
                                onChange={(e) => setDefaultCurrency(e.target.value)}
                                className="w-full h-9 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-zinc-900 dark:text-zinc-50 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                            >
                                <option value="USD">USD (Dólar)</option>
                                <option value="ARS">ARS (Pesos Arg)</option>
                                <option value="EUR">EUR (Euro)</option>
                                <option value="BRL">BRL (Real)</option>
                            </select>
                        </div>
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
                            Crear Activo
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
