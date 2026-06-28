"use client"

import { useState, useEffect } from "react"
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
import {
    getWorkspaceMembersDetails,
    leaveWorkspaceAction,
    removeWorkspaceMember
} from "@/app/actions/workspace-members"
import { toast } from "sonner"
import { Settings, Trash2, Edit2, Check, X, AlertTriangle, ShieldAlert, Users, LogOut } from "lucide-react"

interface Workspace {
    id: string
    name: string
    baseCurrency: string
    ownerId: string
}

interface Member {
    userId: string
    name: string | null
    email: string
    role: string
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
    const [membersMap, setMembersMap] = useState<Record<string, Member[]>>({})
    const [loadingMembers, setLoadingMembers] = useState(false)

    // Sort workspaces so the active one is always first
    const sortedWorkspaces = [...workspaces].sort((a, b) => {
        if (a.id === currentWorkspaceId) return -1
        if (b.id === currentWorkspaceId) return 1
        return 0
    })

    const fetchAllMembers = async () => {
        if (workspaces.length === 0) return
        setLoadingMembers(true)
        try {
            const tempMap: Record<string, Member[]> = {}
            for (const w of workspaces) {
                const details = await getWorkspaceMembersDetails(w.id)
                tempMap[w.id] = details
            }
            setMembersMap(tempMap)
        } catch (err) {
            console.error("Error loading members map:", err)
        } finally {
            setLoadingMembers(false)
        }
    }

    // Load members details when the dialog opens
    useEffect(() => {
        if (open) {
            fetchAllMembers()
            setEditingId(null)
            setEditName("")
            setDeletingId(null)
        }
    }, [open, workspaces])

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

    const handleLeaveWorkspace = async (workspaceId: string) => {
        if (!window.confirm("¿Estás seguro de que deseas salir de este espacio de trabajo? Perderás el acceso inmediato a sus registros.")) return

        setLoading(true)
        try {
            const res = await leaveWorkspaceAction(workspaceId)
            if (res.success) {
                toast.success("Has salido del espacio de trabajo")
                if (workspaceId === currentWorkspaceId) {
                    const remaining = workspaces.filter(w => w.id !== workspaceId)
                    if (remaining.length > 0) {
                        router.push(`/dashboard?workspaceId=${remaining[0].id}`)
                    } else {
                        router.push("/dashboard")
                    }
                } else {
                    router.refresh()
                }
            }
        } catch (error: any) {
            toast.error(error.message || "Error al salir del espacio")
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveMember = async (workspaceId: string, memberId: string) => {
        if (!window.confirm("¿Estás seguro de que deseas remover a este miembro del espacio de trabajo?")) return

        setLoading(true)
        try {
            const res = await removeWorkspaceMember(workspaceId, memberId)
            if (res.success) {
                toast.success("Miembro removido con éxito")
                fetchAllMembers()
                router.refresh()
            }
        } catch (error: any) {
            toast.error(error.message || "Error al remover miembro")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] bg-card border border-border backdrop-blur-md rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <Settings className="h-5 w-5 text-emerald-600" />
                        Configurar Espacios de Trabajo
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Administra y consulta los workspaces a los que perteneces.
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
                                className="flex-1 rounded-lg"
                                onClick={() => setDeletingId(null)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                className="flex-1 bg-rose-600 hover:bg-rose-700 font-bold rounded-lg"
                                onClick={() => handleDelete(deletingId)}
                                disabled={loading}
                            >
                                {loading ? "Eliminando..." : "Confirmar eliminación"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Workspaces List Screen
                    <div className="space-y-4 py-2">
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {sortedWorkspaces.map((w) => {
                                const isOwner = w.ownerId === userId
                                const isActive = w.id === currentWorkspaceId
                                const isEditing = editingId === w.id
                                const members = membersMap[w.id] || []

                                return (
                                    <div
                                        key={w.id}
                                        className={`p-3.5 rounded-xl border flex flex-col gap-3 transition-all ${
                                            isActive
                                                ? "border-emerald-500 bg-emerald-50/15 dark:bg-emerald-500/5"
                                                : "border-border/60 bg-background/50"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {isActive && (
                                                    <span className="text-[9px] font-bold bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-400 px-2.5 py-0.5 rounded-full select-none">
                                                        Espacio Activo
                                                    </span>
                                                )}
                                                {!isOwner && (
                                                    <span className="text-[9px] font-bold bg-muted text-muted-foreground border border-border/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                        <ShieldAlert size={10} /> Invitado
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                                                Base: {w.baseCurrency}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            {isEditing ? (
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="h-8 py-1 text-sm bg-background border-emerald-500 rounded-lg focus-visible:ring-emerald-500"
                                                    autoFocus
                                                    disabled={loading}
                                                />
                                            ) : (
                                                <span className="text-sm font-bold text-foreground truncate">
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
                                                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-md"
                                                                onClick={() => handleSaveEdit(w.id)}
                                                                disabled={loading}
                                                            >
                                                                <Check size={16} />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
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
                                                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                                                                onClick={() => handleStartEdit(w)}
                                                                disabled={loading}
                                                                title="Renombrar"
                                                            >
                                                                <Edit2 size={14} />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-md"
                                                                onClick={() => setDeletingId(w.id)}
                                                                disabled={loading}
                                                                title="Eliminar espacio"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </>
                                                    )
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-md px-2 text-xs flex items-center gap-1"
                                                        onClick={() => handleLeaveWorkspace(w.id)}
                                                        disabled={loading}
                                                    >
                                                        <LogOut size={12} />
                                                        Salir
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Member Listing Section */}
                                        <div className="mt-1 text-xs space-y-1.5 border-t border-border/40 pt-2.5">
                                            <div className="flex items-center gap-1.5 font-semibold text-muted-foreground mb-1">
                                                <Users size={12} className="text-zinc-400" />
                                                <span>Miembros ({members.length}):</span>
                                            </div>
                                            {loadingMembers && members.length === 0 ? (
                                                <p className="text-[10px] text-muted-foreground italic">Cargando miembros...</p>
                                            ) : (
                                                members.map((m) => (
                                                    <div key={m.userId} className="flex items-center justify-between gap-2 text-foreground/80">
                                                        <span className="truncate max-w-[200px]" title={`${m.name || "Invitado"} (${m.email})`}>
                                                            <span className="font-medium text-foreground">{m.name || "Colaborador"}</span>{" "}
                                                            <span className="text-[10px] text-muted-foreground">({m.email})</span>
                                                        </span>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase ${
                                                                m.role === 'OWNER'
                                                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                                                    : "bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20"
                                                            }`}>
                                                                {m.role === 'OWNER' ? "Owner" : "Editor"}
                                                            </span>
                                                            {isOwner && m.userId !== userId && (
                                                                <button
                                                                    onClick={() => handleRemoveMember(w.id, m.userId)}
                                                                    className="text-muted-foreground hover:text-red-500 transition-colors p-0.5 rounded focus:outline-none"
                                                                    title="Remover miembro"
                                                                    disabled={loading}
                                                                >
                                                                    <X size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
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
                                className="w-full rounded-lg border-border"
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
