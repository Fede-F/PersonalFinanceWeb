"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { triggerHaptic } from "@/lib/haptics"

interface PrivacyContextType {
    isPrivate: boolean
    togglePrivacy: () => void
}

const PrivacyContext = React.createContext<PrivacyContextType>({
    isPrivate: false,
    togglePrivacy: () => {},
})

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
    const [isPrivate, setIsPrivate] = React.useState<boolean>(false)
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
        const stored = localStorage.getItem("privacy_mode_enabled")
        if (stored === "true") {
            setIsPrivate(true)
        }
    }, [])

    const togglePrivacy = React.useCallback(() => {
        triggerHaptic("light")
        setIsPrivate((prev) => {
            const next = !prev
            localStorage.setItem("privacy_mode_enabled", next ? "true" : "false")
            return next
        })
    }, [])

    return (
        <PrivacyContext.Provider value={{ isPrivate: mounted ? isPrivate : false, togglePrivacy }}>
            {children}
        </PrivacyContext.Provider>
    )
}

export function usePrivacy() {
    return React.useContext(PrivacyContext)
}

export function PrivacyToggle({ className }: { className?: string }) {
    const { isPrivate, togglePrivacy } = usePrivacy()

    return (
        <div className="relative group">
            <Button
                variant="ghost"
                size="icon"
                onClick={togglePrivacy}
                className={`rounded-full h-9 w-9 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 active:scale-90 transition-all duration-100 touch-manipulation cursor-pointer ${className || ""}`}
                aria-label="Alternar privacidad de montos"
            >
                {isPrivate ? (
                    <EyeOff className="w-4 h-4 text-amber-500" />
                ) : (
                    <Eye className="w-4 h-4" />
                )}
            </Button>

            {/* Hover tooltip for desktop only */}
            <div className="absolute top-full right-0 mt-2 hidden md:group-hover:block z-50 bg-zinc-900 text-zinc-100 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-zinc-800 whitespace-nowrap shadow-xl pointer-events-none select-none transition-all duration-200">
                {isPrivate ? "Mostrar montos (Modo Privacidad activo)" : "Ocultar montos (Modo Privacidad)"}
            </div>
        </div>
    )
}

export function MaskedValue({
    value,
    className = "",
    replacement = "••••••",
}: {
    value: React.ReactNode
    className?: string
    replacement?: string
}) {
    const { isPrivate } = usePrivacy()

    if (isPrivate) {
        return (
            <span className={`tracking-wider font-bold select-none text-zinc-400 dark:text-zinc-500 ${className}`}>
                {replacement}
            </span>
        )
    }

    return <span className={className}>{value}</span>
}
