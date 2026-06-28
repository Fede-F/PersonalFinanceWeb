"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Bell, Check, X, Undo2, Inbox } from "lucide-react"
import {
    getNotifications,
    markAsRead,
    deleteNotification,
    respondToInvitation,
    undoInvitationResponse,
} from "@/app/actions/notifications"
import { toast } from "sonner"

interface Notification {
    id: string
    userId: string
    type: string
    title: string
    message: string
    read: boolean
    data: {
        workspaceId?: string
        workspaceName?: string
        role?: string
        status?: 'PENDING' | 'ACCEPTED' | 'REJECTED'
    } | null
    createdAt: Date
}

export function NotificationBell() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isMobile, setIsMobile] = useState(false)
    const [desktopOpen, setDesktopOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [loadingAction, setLoadingAction] = useState<string | null>(null)

    // Detect screen width
    useEffect(() => {
        const checkDevice = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkDevice()
        window.addEventListener("resize", checkDevice)
        return () => window.removeEventListener("resize", checkDevice)
    }, [])

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const data = await getNotifications()
            // Cast type since drizzle returns unknown/json for jsonb columns
            const castedData = data.map(n => ({
                ...n,
                createdAt: new Date(n.createdAt),
                data: n.data as Notification['data']
            })) as Notification[]
            setNotifications(castedData)
        } catch (error) {
            console.error("Error fetching notifications:", error)
        }
    }, [])

    // Poll notifications every 30 seconds for real-time updates
    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    const unreadCount = notifications.filter((n) => !n.read).length

    const handleBellClick = () => {
        fetchNotifications()
        if (isMobile) {
            setMobileOpen(true)
        } else {
            setDesktopOpen(!desktopOpen)
        }
    }

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return
        // Optimistic UI update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
        try {
            await markAsRead(id)
        } catch (err) {
            console.error("Error marking read:", err)
        }
    }

    const handleDelete = async (id: string) => {
        // Optimistic UI update
        setNotifications(prev => prev.filter(n => n.id !== id))
        try {
            await deleteNotification(id)
            toast.success("Notificación eliminada")
        } catch (err) {
            console.error("Error deleting notification:", err)
            fetchNotifications()
        }
    }

    const handleInviteResponse = async (id: string, accept: boolean) => {
        setLoadingAction(id)
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => {
                if (n.id === id) {
                    return {
                        ...n,
                        read: true,
                        data: n.data ? { ...n.data, status: accept ? 'ACCEPTED' : 'REJECTED' } : null
                    }
                }
                return n
            })
        )
        try {
            const res = await respondToInvitation(id, accept)
            if (res.success) {
                toast.success(accept ? "Invitación aceptada" : "Invitación rechazada")
                router.refresh()
            }
        } catch (err) {
            console.error(err)
            toast.error("Error al procesar la invitación")
            fetchNotifications()
        } finally {
            setLoadingAction(null)
        }
    }

    const handleUndo = async (id: string) => {
        setLoadingAction(id)
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => {
                if (n.id === id) {
                    return {
                        ...n,
                        data: n.data ? { ...n.data, status: 'PENDING' } : null
                    }
                }
                return n
            })
        )
        try {
            const res = await undoInvitationResponse(id)
            if (res.success) {
                toast.success("Cambio deshecho")
                router.refresh()
            }
        } catch (err) {
            console.error(err)
            toast.error("Error al deshacer")
            fetchNotifications()
        } finally {
            setLoadingAction(null)
        }
    }

    const formatNotificationDate = (date: Date) => {
        return date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const renderNotificationItem = (n: Notification, size: 'sm' | 'lg' = 'sm') => {
        const isInvitation = n.type === "WORKSPACE_INVITATION"
        const inviteStatus = n.data?.status || 'PENDING'

        return (
            <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id, n.read)}
                className={`relative group flex gap-3 p-3.5 border-b border-border/40 hover:bg-muted/40 transition-colors cursor-pointer ${
                    !n.read ? "bg-primary/5 dark:bg-primary/5" : ""
                }`}
            >
                {/* Unread circle dot indicator */}
                {!n.read && (
                    <span className="absolute left-2.5 top-5 h-2 w-2 rounded-full bg-primary" />
                )}

                <div className="flex-1 space-y-1.5 pl-2">
                    <div className="flex items-start justify-between gap-2">
                        <p className={`font-semibold text-foreground leading-tight ${size === 'lg' ? 'text-base' : 'text-sm'}`}>
                            {n.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                            {formatNotificationDate(n.createdAt)}
                        </span>
                    </div>

                    <p className={`text-muted-foreground leading-relaxed leading-normal ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
                        {n.message}
                    </p>

                    {/* Invitation Action Buttons */}
                    {isInvitation && (
                        <div className="flex items-center gap-2 pt-1">
                            {inviteStatus === 'PENDING' ? (
                                <>
                                    <Button
                                        size="xs"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleInviteResponse(n.id, true)
                                        }}
                                        disabled={loadingAction === n.id}
                                        className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-2.5 text-xs flex items-center gap-1"
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                        Aceptar
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleInviteResponse(n.id, false)
                                        }}
                                        disabled={loadingAction === n.id}
                                        className="h-7 border-border hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-md px-2 text-xs flex items-center gap-1"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Rechazar
                                    </Button>
                                </>
                            ) : (
                                <div className="flex items-center gap-2.5 text-xs">
                                    <span className={`font-medium ${
                                        inviteStatus === 'ACCEPTED'
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-rose-600 dark:text-rose-400"
                                    }`}>
                                        {inviteStatus === 'ACCEPTED' ? "Invitación aceptada" : "Invitación rechazada"}
                                    </span>
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleUndo(n.id)
                                        }}
                                        disabled={loadingAction === n.id}
                                        className="h-6 text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1 px-1.5"
                                    >
                                        <Undo2 className="h-3 w-3" />
                                        Deshacer
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Dismiss Cross Icon for general notifications */}
                {!isInvitation && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(n.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-1 focus:opacity-100 outline-none"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                )}
            </div>
        )
    }

    return (
        <>
            {isMobile ? (
                // Mobile Trigger
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBellClick}
                    className="relative rounded-full h-9 w-9 bg-background border border-border/40 hover:bg-accent"
                >
                    <Bell className="h-4.5 w-4.5 text-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            ) : (
                // Desktop Trigger (Popover)
                <Popover open={desktopOpen} onOpenChange={setDesktopOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBellClick}
                            className="relative rounded-full h-9 w-9 bg-background border border-border/40 hover:bg-accent"
                        >
                            <Bell className="h-4.5 w-4.5 text-foreground" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 bg-card border border-border/80 backdrop-blur-md rounded-xl shadow-lg mr-2" align="end">
                        <div className="flex items-center justify-between p-3 border-b border-border/60">
                            <span className="font-semibold text-sm text-foreground">Notificaciones</span>
                            {unreadCount > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                    {unreadCount} nuevas
                                </span>
                            )}
                        </div>
                        <div className="max-h-[350px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="py-8 flex flex-col items-center justify-center text-center text-muted-foreground gap-2">
                                    <Inbox className="h-8 w-8 opacity-40" />
                                    <p className="text-xs">No tienes notificaciones</p>
                                </div>
                            ) : (
                                notifications.map(n => renderNotificationItem(n, 'sm'))
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            )}

            {/* Mobile Full Screen/Large Dialog */}
            <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
                <DialogContent className="w-[90%] max-w-[420px] bg-card border border-border backdrop-blur-md rounded-2xl p-5 shadow-xl">
                    <DialogHeader className="border-b border-border/60 pb-3">
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            Mis Notificaciones
                        </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground gap-2.5">
                                <Inbox className="h-10 w-10 opacity-30" />
                                <p className="text-sm">No tienes notificaciones aún</p>
                            </div>
                        ) : (
                            notifications.map(n => renderNotificationItem(n, 'lg'))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
