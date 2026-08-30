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
import { Plus, Edit2, Trash2, Loader2, Layers, AlertTriangle, Shield } from "lucide-react"
import {
    createInvestmentCategory,
    updateInvestmentCategory,
    deleteInvestmentCategory,
} from "@/app/actions/investments"
import { toast } from "sonner"
import { triggerHaptic } from "@/lib/haptics"

export interface InvestmentCategoryItem {
    id: string
    name: string
    label: string
    color: string
    isSystem: boolean
    assetsCount?: number
}

interface ManageCategoriesModalProps {
    isOpen: boolean
    onClose: () => void
    workspaceId: string
    categories: InvestmentCategoryItem[]
}

const PRESET_COLORS = [
    "#8b5cf6", // Violet
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#6366f1", // Indigo
    "#f97316", // Orange
    "#14b8a6", // Teal
    "#84cc16", // Lime
    "#6b7280", // Gray
]

export function ManageCategoriesModal({
    isOpen,
    onClose,
    workspaceId,
    categories,
}: ManageCategoriesModalProps) {
    const [isCreating, setIsCreating] = React.useState(false)
    const [editingCategory, setEditingCategory] = React.useState<InvestmentCategoryItem | null>(null)
    const [deletingCategory, setDeletingCategory] = React.useState<InvestmentCategoryItem | null>(null)

    // Form states
    const [label, setLabel] = React.useState("")
    const [color, setColor] = React.useState(PRESET_COLORS[0])
    const [isLoading, setIsLoading] = React.useState(false)

    const handleStartCreate = () => {
        triggerHaptic("light")
        setLabel("")
        setColor(PRESET_COLORS[0])
        setEditingCategory(null)
        setIsCreating(true)
    }

    const handleStartEdit = (cat: InvestmentCategoryItem) => {
        triggerHaptic("light")
        setLabel(cat.label)
        setColor(cat.color)
        setEditingCategory(cat)
        setIsCreating(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!label.trim()) {
            toast.error("El nombre de la categoría es obligatorio")
            return
        }

        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("workspaceId", workspaceId)
            formData.append("label", label.trim())
            formData.append("color", color)

            if (editingCategory) {
                formData.append("id", editingCategory.id)
                const res = await updateInvestmentCategory(formData)
                if (res.success) {
                    toast.success("Categoría actualizada con éxito")
                    setIsCreating(false)
                    setEditingCategory(null)
                } else {
                    toast.error(res.error || "Error al actualizar categoría")
                }
            } else {
                const res = await createInvestmentCategory(formData)
                if (res.success) {
                    toast.success("Categoría creada con éxito")
                    setIsCreating(false)
                    setLabel("")
                } else {
                    toast.error(res.error || "Error al crear categoría")
                }
            }
        } catch (err) {
            toast.error("Error al procesar la solicitud")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deletingCategory) return
        setIsLoading(true)
        try {
            const res = await deleteInvestmentCategory(deletingCategory.id, workspaceId)
            if (res.success) {
                toast.success(
                    `Categoría eliminada. ${
                        (deletingCategory.assetsCount || 0) > 0
                            ? `${deletingCategory.assetsCount} activos fueron reasignados a "Otros"`
                            : ""
                    }`
                )
                setDeletingCategory(null)
            } else {
                toast.error(res.error || "Error al eliminar categoría")
            }
        } catch (err) {
            toast.error("Error al procesar la solicitud")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between pr-4">
                            <DialogTitle className="text-base font-semibold flex items-center gap-2">
                                <Layers className="w-4 h-4 text-emerald-500" />
                                Categorías de Inversión
                            </DialogTitle>
                            {!isCreating && (
                                <Button
                                    size="sm"
                                    onClick={handleStartCreate}
                                    className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs active:scale-95 duration-100 touch-manipulation cursor-pointer select-none"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Nueva
                                </Button>
                            )}
                        </div>
                        <DialogDescription className="text-xs text-zinc-500">
                            Administra las categorías de tus activos para organizar los gráficos y filtros.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Create / Edit Form */}
                    {isCreating ? (
                        <form onSubmit={handleSave} className="space-y-3.5 py-2 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                    {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setIsCreating(false)
                                        setEditingCategory(null)
                                    }}
                                    className="h-6 text-xs text-zinc-400 hover:text-zinc-700"
                                >
                                    Cancelar
                                </Button>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="cat-label" className="text-xs font-semibold">
                                    Nombre de la Categoría *
                                </Label>
                                <Input
                                    id="cat-label"
                                    placeholder="Ej: Inmuebles, Metales, Venture"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    className="h-9 text-xs"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold block">Color Identificador</Label>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {PRESET_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => {
                                                triggerHaptic("selection")
                                                setColor(c)
                                            }}
                                            style={{ backgroundColor: c }}
                                            className={`w-6 h-6 rounded-full transition-transform ${
                                                color === c ? "ring-2 ring-offset-2 ring-emerald-500 scale-110" : "opacity-80 hover:opacity-100"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setIsCreating(false)
                                        setEditingCategory(null)
                                    }}
                                    className="h-8 text-xs"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isLoading}
                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                >
                                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {editingCategory ? "Guardar" : "Crear"}
                                </Button>
                            </div>
                        </form>
                    ) : null}

                    {/* Categories List */}
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[50vh] overflow-y-auto pr-1">
                        {categories.map((cat) => (
                            <div
                                key={cat.id || cat.name}
                                className="py-2.5 flex items-center justify-between hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 px-2 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: cat.color }}
                                    />
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                                            {cat.label}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-mono">
                                            {cat.assetsCount ?? 0} {cat.assetsCount === 1 ? "activo" : "activos"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {cat.isSystem ? (
                                        <Badge
                                            variant="secondary"
                                            className="text-[9px] px-1.5 py-0.5 gap-1 font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800"
                                        >
                                            <Shield className="w-2.5 h-2.5 text-zinc-400" />
                                            Sistema
                                        </Badge>
                                    ) : (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleStartEdit(cat)}
                                                className="h-7 w-7 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-90 touch-manipulation cursor-pointer"
                                                title="Editar categoría"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    triggerHaptic("light")
                                                    setDeletingCategory(cat)
                                                }}
                                                className="h-7 w-7 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-90 touch-manipulation cursor-pointer"
                                                title="Eliminar categoría"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button variant="outline" size="sm" onClick={onClose} className="w-full text-xs">
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2 text-rose-600">
                            <AlertTriangle className="w-4 h-4" />
                            ¿Eliminar categoría "{deletingCategory?.label}"?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 space-y-2">
                            <p>Esta acción eliminará la categoría personalizada permanentemente.</p>
                            {(deletingCategory?.assetsCount || 0) > 0 && (
                                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-800 dark:text-amber-300 text-xs font-medium">
                                    ⚠️ {deletingCategory?.assetsCount} activos vinculados a esta categoría serán reasignados automáticamente a la categoría <strong>"Otros"</strong>.
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingCategory(null)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="gap-1.5"
                        >
                            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Eliminar Categoría
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
