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
import { User, LogOut, Settings, Coins } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateDefaultCurrency } from "@/app/actions/user"
import { toast } from "sonner"

interface UserNavProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
        defaultCurrency?: string
    }
    currencies: any[]
}

export function UserNav({ user, currencies }: UserNavProps) {
    const router = useRouter()

    const handleCurrencyChange = async (value: string) => {
        const result = await updateDefaultCurrency(value)
        if (result.success) {
            toast.success("Moneda por defecto actualizada")
            router.refresh()
        } else {
            toast.error(result.error || "Error al actualizar la moneda")
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-9 w-9 border-2 border-emerald-500/20">
                        <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <div className="px-2 py-1.5 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                            <Coins size={14} />
                            Moneda por Defecto
                        </div>
                        <Select defaultValue={user.defaultCurrency} onValueChange={handleCurrencyChange}>
                            <SelectTrigger className="h-8 text-xs">
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
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-rose-600 focus:text-rose-600 cursor-pointer"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
