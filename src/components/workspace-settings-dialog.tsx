"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateWorkspace, deleteWorkspace } from "@/app/actions/workspace"
import { toast } from "sonner"
import { Settings, Trash2, Edit2, Check, X, AlertTriangle, ShieldAlert } from "lucide-react"

interface Workspace {
    id: string
    name: string
    baseCurrency: string
    ownerId: string
}

interface WorkspaceSettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspaces: Workspace[]
    currentWorkspaceId: string
    userId: string
}

export function WorkspaceSettingsDialog({
    open,
    onOpenChange,
    workspaces,
    currentWorkspaceId,
    userId,
}: WorkspaceSettingsDialogProps) {
    const router = useRouter()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Sort workspaces so the active one is always first
    const sortedWorkspaces = [...workspaces].sort((a, b) => {
        if (a.id === currentWorkspaceId) return -1
        if (b.id === currentWorkspaceId) return 1
        return 0
    })

    const handleStartEdit = (w: Workspace) => {
        setEditingId(w.id)
        setEditName(w.name)
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditName("")
    }

    const handleSaveEdit = async (workspaceId: string) => {
        if (!editName.trim()) {
            toast.error("El nombre no puede estar vacío")
            return
        }
        setLoading(true)
        try {
            const res = await updateWorkspace(workspaceId, editName)
            if (res.success) {
                toast.success("Nombre del espacio actualizado")
                setEditingId(null)
                router.refresh()
            } else {
                toast.error(res.error || "Ocurrió un error")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error al guardar cambios")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (workspaceId: string) => {
        setLoading(true)
        try {
            const res = await deleteWorkspace(workspaceId)
            if (res.success) {
                toast.success("Espacio de trabajo eliminado")
                setDeletingId(null)
                
                // If we deleted the current active workspace, redirect to another one
                if (workspaceId === currentWorkspaceId) {
                    const remaining = workspaces.filter(w => w.id !== workspaceId)
                    if (remaining.length > 0) {
                        router.push(`/dashboard?workspaceId=${remaining[0].id}`)
                    } else {
                        // No workspaces left, refresh to show the workspace creation screen
                        router.push("/dashboard")
                    }
                } else {
                    router.refresh()
                }
            } else {
                toast.error(res.error || "Ocurrió un error")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error al eliminar espacio")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-emerald-600" />
                        Configurar Espacios de Trabajo
                    </DialogTitle>
                    <DialogDescription>
                        Administra y renombra tus espacios de trabajo actuales.
                    </DialogDescription>
                </DialogHeader>

                {deletingId ? (
                    // Deletion Confirmation Screen
                    <div className="space-y-4 py-3 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-lg flex gap-3 items-start text-sm text-rose-800 dark:text-rose-300">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-semibold">¿Confirmas la eliminación?</p>
                                <p className="text-xs leading-relaxed opacity-90">
                                    Esta acción es <strong>irreversible</strong>. Se eliminará permanentemente el espacio de trabajo 
                                    <strong> "{workspaces.find(w => w.id === deletingId)?.name}"</strong> junto con todas sus cuentas, 
                                    categorías, transacciones e histórico financiero registrado.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setDeletingId(null)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                className="flex-1 bg-rose-600 hover:bg-rose-700 font-bold"
                                onClick={() => handleDelete(deletingId)}
                                disabled={loading}
                            >
                                {loading ? "Eliminando..." : "Confirmar eliminación"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Workspaces List Screen
                    <div className="space-y-4 py-3">
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {sortedWorkspaces.map((w) => {
                                const isOwner = w.ownerId === userId
                                const isActive = w.id === currentWorkspaceId
                                const isEditing = editingId === w.id

                                return (
                                    <div
                                        key={w.id}
                                        className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
                                            isActive
                                                ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-500/5"
                                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {isActive && (
                                                    <span className="text-[10px] font-bold bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full select-none">
                                                        Espacio Activo
                                                    </span>
                                                )}
                                                {!isOwner && (
                                                    <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <ShieldAlert size={10} /> Invitado
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                                                Base: {w.baseCurrency}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            {isEditing ? (
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="h-8 py-1 text-sm bg-white dark:bg-zinc-900 border-emerald-500"
                                                    autoFocus
                                                    disabled={loading}
                                                />
                                            ) : (
                                                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                                    {w.name}
                                                </span>
                                            )}

                                            {/* Action Controls */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                {isOwner ? (
                                                    isEditing ? (
                                                        <>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                                                onClick={() => handleSaveEdit(w.id)}
                                                                disabled={loading}
                                                            >
                                                                <Check size={16} />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                                onClick={handleCancelEdit}
                                                                disabled={loading}
                                                            >
                                                                <X size={16} />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                                onClick={() => handleStartEdit(w)}
                                                                disabled={loading}
                                                                title="Renombrar"
                                                            >
                                                                <Edit2 size={14} />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                                onClick={() => setDeletingId(w.id)}
                                                                disabled={loading}
                                                                title="Eliminar espacio"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </>
                                                    )
                                                ) : (
                                                    <span className="text-xs text-zinc-400 italic px-2">Solo lectura</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="w-full"
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
