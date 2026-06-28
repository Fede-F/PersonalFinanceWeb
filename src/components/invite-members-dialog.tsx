"use client"

import { useState, useEffect } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { inviteMembersToWorkspace } from "@/app/actions/workspace-members"
import { X, Check, Mail, AlertCircle, Sparkles, Send } from "lucide-react"

interface Workspace {
    id: string
    name: string
    baseCurrency: string
    ownerId: string
}

interface InviteMembersProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspaces: Workspace[]
    currentWorkspaceId: string
    userId: string
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export function InviteMembersDialog({
    open,
    onOpenChange,
    workspaces,
    currentWorkspaceId,
    userId,
}: InviteMembersProps) {
    const ownedWorkspaces = workspaces.filter((w) => w.ownerId === userId)
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("")
    const [emailInput, setEmailInput] = useState("")
    const [emails, setEmails] = useState<string[]>([])
    const [emailError, setEmailError] = useState("")
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<Record<string, { success: boolean; message: string }> | null>(null)

    // Set initial selected workspace to currentWorkspaceId if owned, else first owned
    useEffect(() => {
        if (open) {
            setEmailInput("")
            setEmails([])
            setEmailError("")
            setResults(null)
            const isOwnedCurrent = ownedWorkspaces.some((w) => w.id === currentWorkspaceId)
            if (isOwnedCurrent) {
                setSelectedWorkspaceId(currentWorkspaceId)
            } else if (ownedWorkspaces.length > 0) {
                setSelectedWorkspaceId(ownedWorkspaces[0].id)
            } else {
                setSelectedWorkspaceId("")
            }
        }
    }, [open, currentWorkspaceId])

    const handleAddEmail = () => {
        const trimmed = emailInput.trim().toLowerCase()
        if (!trimmed) return

        if (!EMAIL_REGEX.test(trimmed)) {
            setEmailError("Por favor, ingresa un correo válido")
            return
        }

        if (emails.includes(trimmed)) {
            setEmailError("Este correo ya está en la lista")
            return
        }

        setEmails([...emails, trimmed])
        setEmailInput("")
        setEmailError("")
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === "," || e.key === " ") {
            e.preventDefault()
            handleAddEmail()
        }
    };

    const handleRemoveEmail = (index: number) => {
        setEmails(emails.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (emails.length === 0) {
            // If they have typed something but not added it, try to add it first
            if (emailInput.trim()) {
                const trimmed = emailInput.trim().toLowerCase()
                if (EMAIL_REGEX.test(trimmed)) {
                    const updatedEmails = [...emails, trimmed]
                    setEmails(updatedEmails)
                    setEmailInput("")
                    setEmailError("")
                    sendInvitations(updatedEmails)
                } else {
                    setEmailError("Por favor, agrega el correo válido antes de enviar")
                }
            } else {
                setEmailError("Agrega al menos un correo electrónico")
            }
            return
        }

        sendInvitations(emails)
    }

    const sendInvitations = async (emailsToSend: string[]) => {
        if (!selectedWorkspaceId) return
        setLoading(true)
        try {
            const res = await inviteMembersToWorkspace(selectedWorkspaceId, emailsToSend)
            if (res.success && res.results) {
                setResults(res.results)
            }
        } catch (error) {
            console.error(error)
            setEmailError("Error al enviar las invitaciones. Inténtalo de nuevo.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] bg-card border border-border/80 backdrop-blur-md rounded-2xl shadow-xl p-6">
                <DialogHeader className="space-y-2">
                    <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
                        <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500/20" />
                        Invitar colaboradores
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                        Invita miembros a tu espacio de trabajo para compartir el registro de transacciones.
                    </DialogDescription>
                </DialogHeader>

                {ownedWorkspaces.length === 0 ? (
                    <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 bg-muted/40 rounded-xl p-4 border border-dashed border-border/60">
                        <AlertCircle className="h-10 w-10 text-amber-500" />
                        <div>
                            <p className="text-sm font-semibold text-foreground">No tienes workspaces propios</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                                Solo el propietario del workspace puede realizar invitaciones. Crea uno nuevo para invitar.
                            </p>
                        </div>
                    </div>
                ) : results ? (
                    // Results View
                    <div className="space-y-4 py-4 animate-in fade-in-50 duration-200">
                        <Label className="text-sm font-semibold text-foreground">Resultados del envío</Label>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {Object.entries(results).map(([email, detail]) => (
                                <div
                                    key={email}
                                    className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                                        detail.success
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                            : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
                                    }`}
                                >
                                    {detail.success ? (
                                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                                    ) : (
                                        <X className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                                    )}
                                    <div className="space-y-0.5">
                                        <p className="font-medium break-all">{email}</p>
                                        <p className="text-xs opacity-90">{detail.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={() => {
                                    setResults(null)
                                    setEmails([])
                                    onOpenChange(false)
                                }}
                                className="bg-primary hover:bg-primary/95 text-primary-foreground rounded-lg px-4"
                            >
                                Aceptar
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Form View
                    <div className="space-y-5 py-4">
                        {/* Select Workspace */}
                        <div className="space-y-2">
                            <Label htmlFor="workspace" className="text-sm font-medium text-foreground">
                                Seleccionar Workspace
                            </Label>
                            <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
                                <SelectTrigger id="workspace" className="bg-background border-border/80 rounded-lg">
                                    <SelectValue placeholder="Selecciona un espacio de trabajo" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {ownedWorkspaces.map((w) => (
                                        <SelectItem key={w.id} value={w.id} className="focus:bg-accent">
                                            {w.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Input Emails */}
                        <div className="space-y-2">
                            <Label htmlFor="email-input" className="text-sm font-medium text-foreground">
                                Correo(s) electrónico(s)
                            </Label>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                                        <Input
                                            id="email-input"
                                            type="email"
                                            placeholder="ejemplo@correo.com"
                                            value={emailInput}
                                            onChange={(e) => {
                                                setEmailInput(e.target.value)
                                                if (emailError) setEmailError("")
                                            }}
                                            onKeyDown={handleKeyDown}
                                            className={`pl-10 bg-background rounded-lg focus-visible:ring-1 ${
                                                emailError ? "border-red-500 focus-visible:ring-red-500" : "border-border/80"
                                            }`}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleAddEmail}
                                        className="rounded-lg border border-border/60 hover:bg-accent"
                                    >
                                        Agregar
                                    </Button>
                                </div>

                                {emailError && (
                                    <p className="text-xs text-red-500 flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-150">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {emailError}
                                    </p>
                                )}

                                {/* Emails Tag List */}
                                {emails.length > 0 && (
                                    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 border border-border/40 rounded-xl max-h-[140px] overflow-y-auto">
                                        {emails.map((email, idx) => (
                                            <span
                                                key={email}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-accent text-accent-foreground border border-border/60 hover:border-border transition-colors animate-in zoom-in-95 duration-150"
                                            >
                                                {email}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveEmail(idx)}
                                                    className="rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors focus:outline-none"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <span className="text-[11px] text-muted-foreground block">
                                Presiona Enter, Espacio o Coma para añadir el correo a la lista.
                            </span>
                        </div>

                        {/* Dialog Action Buttons */}
                        <div className="flex justify-end gap-3 pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="rounded-lg border-border"
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading || !selectedWorkspaceId}
                                className="bg-primary hover:bg-primary/95 text-primary-foreground rounded-lg flex items-center gap-2 px-4 shadow-sm"
                            >
                                {loading ? (
                                    "Enviando..."
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Enviar Invitaciones
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
