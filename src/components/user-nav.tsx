"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { User, LogOut, Settings, Coins, UserPlus, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateDefaultCurrency, updateUserTheme } from "@/app/actions/user"
import { triggerHaptic } from "@/lib/haptics"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { WorkspaceSettingsDialog } from "./workspace-settings-dialog"
import { InviteMembersDialog } from "./invite-members-dialog"

interface UserNavProps {
    user: {
        id?: string
        name?: string | null
        email?: string | null
        image?: string | null
        defaultCurrency?: string
    }
    currencies: any[]
    workspaces: {
        id: string
        name: string
        baseCurrency: string
        ownerId: string
    }[]
    currentWorkspaceId: string
}

export function UserNav({ user, currencies, workspaces, currentWorkspaceId }: UserNavProps) {
    const router = useRouter()
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [inviteOpen, setInviteOpen] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const currentTheme = theme === "system" ? resolvedTheme : theme
    const isDark = mounted ? currentTheme === "dark" : false

    const handleThemeToggle = async () => {
        triggerHaptic("selection")
        const newTheme = isDark ? "light" : "dark"
        setTheme(newTheme)
        try {
            await updateUserTheme(newTheme)
        } catch (err) {
            console.error("Error al guardar tema:", err)
        }
    }

    const handleCurrencyChange = async (value: string) => {
        triggerHaptic("selection")
        const result = await updateDefaultCurrency(value)
        if (result.success) {
            toast.success("Moneda por defecto actualizada")
            router.refresh()
        } else {
            toast.error(result.error || "Error al actualizar la moneda")
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-9 w-9 rounded-full p-0 shrink-0 select-none active:scale-95 transition-transform duration-100 touch-manipulation focus-visible:ring-0 focus-visible:ring-offset-0"
                        aria-label="Menú de usuario"
                    >
                        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-emerald-500/30">
                            <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs">
                                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 p-1.5" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal px-2 py-1.5">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-none truncate">
                                {user.name || "Usuario"}
                            </p>
                            <p className="text-xs text-zinc-400 leading-none truncate">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Moneda por Defecto */}
                    <DropdownMenuGroup>
                        <div className="px-2 py-1.5 flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                                <Coins size={14} className="text-emerald-500" />
                                Moneda por Defecto
                            </div>
                            <Select defaultValue={user.defaultCurrency} onValueChange={handleCurrencyChange}>
                                <SelectTrigger className="h-8 text-xs font-medium">
                                    <SelectValue placeholder="Elegir moneda" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map((c) => (
                                        <SelectItem key={c.code} value={c.code} className="text-xs">
                                            {c.code} - {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    {/* Acciones Rápidas & Tema */}
                    <DropdownMenuGroup>
                        {/* Tema Oscuro / Claro integrado */}
                        <DropdownMenuItem
                            onClick={handleThemeToggle}
                            className="cursor-pointer flex items-center justify-between text-xs py-2 font-medium"
                        >
                            <div className="flex items-center gap-2">
                                {isDark ? (
                                    <Sun className="h-4 w-4 text-amber-500" />
                                ) : (
                                    <Moon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                )}
                                <span>Tema {isDark ? "Oscuro" : "Claro"}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                {isDark ? "Cambiar a Claro" : "Cambiar a Oscuro"}
                            </span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => setInviteOpen(true)} className="cursor-pointer text-xs py-2 font-medium">
                            <UserPlus className="mr-2 h-4 w-4 text-emerald-500" />
                            <span>Invitar al workspace</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer text-xs py-2 font-medium">
                            <Settings className="mr-2 h-4 w-4 text-zinc-500" />
                            <span>Configurar Workspaces</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer text-xs py-2 font-medium">
                            <User className="mr-2 h-4 w-4 text-zinc-500" />
                            <span>Perfil</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    {/* Cerrar Sesión */}
                    <DropdownMenuItem
                        className="text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400 cursor-pointer text-xs py-2 font-semibold"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <WorkspaceSettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                workspaces={workspaces}
                currentWorkspaceId={currentWorkspaceId}
                userId={user.id || ""}
            />

            <InviteMembersDialog
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                workspaces={workspaces}
                currentWorkspaceId={currentWorkspaceId}
                userId={user.id || ""}
            />
        </>
    )
}
