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
import { updateInvestmentTransaction } from "@/app/actions/investments"
import { toast } from "sonner"
import { Loader2, Calculator, Edit3, Link2 } from "lucide-react"

export interface EditTransactionData {
    id: string
    symbol: string
    name: string
    assetType: string
    type: "BUY" | "SELL"
    quantity: number
    unitPrice: number
    totalAmount: number
    currency: string
    fees: number
    rawDate?: string
    date: string
    notes?: string | null
    linkedTransactionId?: string | null
}

interface EditInvestmentModalProps {
    isOpen: boolean
    onClose: () => void
    workspaceId: string
    transaction: EditTransactionData | null
}

export function EditInvestmentModal({
    isOpen,
    onClose,
    workspaceId,
    transaction,
}: EditInvestmentModalProps) {
    const [quantity, setQuantity] = React.useState<string>("")
    const [unitPrice, setUnitPrice] = React.useState<string>("")
    const [totalAmount, setTotalAmount] = React.useState<string>("")
    const [currency, setCurrency] = React.useState<string>("USD")
    const [fees, setFees] = React.useState<string>("")
    const [date, setDate] = React.useState<string>("")
    const [notes, setNotes] = React.useState<string>("")
    const [isLoading, setIsLoading] = React.useState(false)

    // Populate data when transaction changes
    React.useEffect(() => {
        if (transaction) {
            setQuantity(transaction.quantity.toString())
            setUnitPrice(transaction.unitPrice.toString())
            setTotalAmount(transaction.totalAmount.toString())
            setCurrency(transaction.currency || "USD")
            setFees(transaction.fees ? transaction.fees.toString() : "0")
            const initialDate = transaction.rawDate || (transaction.date?.includes("-") ? transaction.date.split("T")[0] : new Date().toISOString().split("T")[0])
            setDate(initialDate)
            setNotes(transaction.notes || "")
        }
    }, [transaction])

    // Bidirectional calculations
    const handleQuantityChange = (val: string) => {
        setQuantity(val)
        const q = parseFloat(val)
        const p = parseFloat(unitPrice)
        const f = parseFloat(fees) || 0
        const t = parseFloat(totalAmount)

        if (!isNaN(q) && q > 0) {
            if (!isNaN(p) && p > 0) {
                setTotalAmount((q * p + (transaction?.type === "BUY" ? f : -f)).toFixed(2))
            } else if (!isNaN(t) && t > 0) {
                const netT = transaction?.type === "BUY" ? t - f : t + f
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
                setTotalAmount((q * p + (transaction?.type === "BUY" ? f : -f)).toFixed(2))
            } else if (!isNaN(t) && t > 0) {
                const netT = transaction?.type === "BUY" ? t - f : t + f
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
        const netT = transaction?.type === "BUY" ? t - f : t + f

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
            setTotalAmount((q * p + (transaction?.type === "BUY" ? f : -f)).toFixed(2))
        }
    }

    const numQty = parseFloat(quantity) || 0
    const numPrice = parseFloat(unitPrice) || 0
    const numFees = parseFloat(fees) || 0
    const effectiveTotal = parseFloat(totalAmount) || (numQty * numPrice + (transaction?.type === "BUY" ? numFees : -numFees))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!transaction) return

        if (numQty <= 0 || numPrice < 0 || effectiveTotal <= 0) {
            toast.error("La cantidad, precio y total deben ser valores válidos mayores a cero")
            return
        }

        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("id", transaction.id)
            formData.append("workspaceId", workspaceId)
            formData.append("quantity", quantity.trim())
            formData.append("unitPrice", unitPrice.trim())
            formData.append("totalAmount", effectiveTotal.toString())
            formData.append("currency", currency)
            formData.append("fees", fees ? fees.trim() : "0")
            formData.append("date", date)
            formData.append("notes", notes.trim())

            const res = await updateInvestmentTransaction(formData)
            if (res.success) {
                toast.success("Operación de inversión actualizada con éxito")
                onClose()
            } else {
                toast.error(res.error || "Error al actualizar la operación")
            }
        } catch (err) {
            toast.error("Error al procesar la actualización")
        } finally {
            setIsLoading(false)
        }
    }

    if (!transaction) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-emerald-500" />
                        Editar Operación: {transaction.symbol}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500">
                        Modifica los valores de cantidad, precio, comisiones o total invertido.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Asset Info Banner */}
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-xs">
                                {transaction.symbol.slice(0, 3)}
                            </div>
                            <div>
                                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                                    {transaction.symbol} - {transaction.name}
                                </span>
                                <span className="text-[11px] text-zinc-500 font-medium">
                                    Tipo: {transaction.type === "BUY" ? "Compra" : "Venta"} ({transaction.assetType})
                                </span>
                            </div>
                        </div>

                        {transaction.linkedTransactionId && (
                            <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                <Link2 className="w-3 h-3" />
                                Vinculado a Gastos
                            </Badge>
                        )}
                    </div>

                    {/* Quantity and Unit Price */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-quantity" className="text-xs font-semibold">
                                Cantidad *
                            </Label>
                            <Input
                                id="edit-quantity"
                                type="number"
                                step="any"
                                value={quantity}
                                onChange={(e) => handleQuantityChange(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-price" className="text-xs font-semibold">
                                Precio Unitario *
                            </Label>
                            <Input
                                id="edit-price"
                                type="number"
                                step="any"
                                value={unitPrice}
                                onChange={(e) => handleUnitPriceChange(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Total Invested (Editable & Bi-directional) with Currency Selector */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="edit-total" className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <Calculator className="w-3.5 h-3.5 text-emerald-500" />
                                {transaction.type === "BUY" ? "Total Invertido (Monto Pagado) *" : "Total Recibido (Monto Cobrado) *"}
                            </Label>
                            <span className="text-[10px] text-zinc-400 font-medium">Cálculo bidireccional</span>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="edit-total"
                                type="number"
                                step="any"
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
                            <Label htmlFor="edit-fees" className="text-xs font-semibold">
                                Comisión / Fees (Opcional)
                            </Label>
                            <Input
                                id="edit-fees"
                                type="number"
                                step="any"
                                value={fees}
                                onChange={(e) => handleFeesChange(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-date" className="text-xs font-semibold">
                                Fecha de Operación *
                            </Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Effective Total Banner */}
                    <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg flex items-center justify-between border border-emerald-500/20">
                        <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                            <Calculator className="w-4 h-4 text-emerald-500" />
                            <span>Total Efectivo:</span>
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
                        <Label htmlFor="edit-notes" className="text-xs font-semibold">
                            Notas / Detalle (Opcional)
                        </Label>
                        <Input
                            id="edit-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
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
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
