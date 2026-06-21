"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteTransaction } from "@/app/actions/transactions"
import { toast } from "sonner"
import { Trash2, AlertTriangle } from "lucide-react"

interface DeleteTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: any
}

export function DeleteTransactionDialog({
    open,
    onOpenChange,
    transaction
}: DeleteTransactionDialogProps) {
    const [loading, setLoading] = useState(false)
    const [deleteMode, setDeleteMode] = useState<'single' | 'subsequent'>('single')

    if (!transaction) return null

    const isFixed = transaction.isFixed
    const isInstallments = transaction.isInstallments

    async function handleDelete() {
        setLoading(true)
        try {
            // For fixed transactions, the default is deleting "this and all subsequent ones" (subsequent)
            const mode = isFixed ? 'subsequent' : deleteMode
            const res = await deleteTransaction(transaction.id, mode)

            if (res.success) {
                toast.success(
                    isFixed
                        ? "Transacción fija y repeticiones futuras eliminadas"
                        : mode === 'subsequent'
                        ? "Cuota seleccionada y cuotas futuras eliminadas"
                        : "Transacción eliminada correctamente"
                )
                onOpenChange(false)
            } else {
                toast.error(res.error || "Ocurrió un error al intentar eliminar")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error al procesar la solicitud")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                        <Trash2 className="h-5 w-5 text-rose-500" />
                        Eliminar Transacción
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-zinc-500 dark:text-zinc-400">
                        ¿Estás seguro de que deseas eliminar la transacción <strong>"{transaction.concept}"</strong>?
                    </DialogDescription>
                </DialogHeader>

                {isFixed && (
                    <div className="my-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg flex gap-2 items-start text-xs text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>
                            Esta es una <strong>transacción fija</strong>. Eliminarla también eliminará todas las repeticiones en los meses siguientes.
                        </p>
                    </div>
                )}

                {isInstallments && (
                    <div className="my-4 space-y-3">
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Opciones de eliminación</p>
                            
                            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-zinc-800 dark:text-zinc-200 select-none">
                                <input
                                    type="radio"
                                    name="deleteMode"
                                    checked={deleteMode === 'single'}
                                    onChange={() => setDeleteMode('single')}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-zinc-300 dark:border-zinc-700 accent-emerald-600 cursor-pointer"
                                />
                                <span>Eliminar solo esta cuota ({transaction.installmentNumber}/{transaction.installmentsCount})</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-zinc-800 dark:text-zinc-200 select-none">
                                <input
                                    type="radio"
                                    name="deleteMode"
                                    checked={deleteMode === 'subsequent'}
                                    onChange={() => setDeleteMode('subsequent')}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-zinc-300 dark:border-zinc-700 accent-emerald-600 cursor-pointer"
                                />
                                <span>Eliminar esta cuota y todas las siguientes</span>
                            </label>
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading ? "Eliminando..." : "Confirmar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
