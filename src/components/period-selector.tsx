"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { format, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { useLoading } from "./loading-provider"
import { triggerHaptic } from "@/lib/haptics"

interface PeriodSelectorProps {
    initialMonth?: number
    initialYear?: number
}

export function PeriodSelector({ initialMonth, initialYear }: PeriodSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { startLoading, stopLoading } = useLoading()
    const [isPending, startTransition] = React.useTransition()

    // Base date from props / query
    const now = new Date()
    const currentMonth = initialMonth !== undefined ? initialMonth : now.getMonth()
    const currentYear = initialYear !== undefined ? initialYear : now.getFullYear()
    const currentDate = React.useMemo(() => new Date(currentYear, currentMonth, 1), [currentYear, currentMonth])

    // Optimistic local date for instant visual feedback on touch
    const [displayDate, setDisplayDate] = React.useState<Date>(currentDate)
    const [pendingDirection, setPendingDirection] = React.useState<"prev" | "next" | "reset" | null>(null)

    // Sync with server props once resolved
    React.useEffect(() => {
        setDisplayDate(currentDate)
        setPendingDirection(null)
    }, [currentDate])

    const updatePeriod = (newDate: Date, direction: "prev" | "next" | "reset") => {
        triggerHaptic("selection")
        setDisplayDate(newDate)
        setPendingDirection(direction)

        const params = new URLSearchParams(searchParams.toString())
        if (direction === "reset") {
            params.delete("month")
            params.delete("year")
        } else {
            params.set("month", newDate.getMonth().toString())
            params.set("year", newDate.getFullYear().toString())
        }

        startLoading()
        startTransition(() => {
            router.push(`?${params.toString()}`)
        })
    }

    const handlePrev = () => updatePeriod(subMonths(displayDate, 1), "prev")
    const handleNext = () => updatePeriod(addMonths(displayDate, 1), "next")
    const handleReset = () => updatePeriod(now, "reset")

    return (
        <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs select-none">
            {/* Prev Month Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                disabled={isPending}
                className="h-8 w-8 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 active:scale-85 active:bg-zinc-100 dark:active:bg-zinc-800 transition-all duration-100 touch-manipulation"
                title="Mes anterior"
            >
                {isPending && pendingDirection === "prev" ? (
                    <Loader2 size={16} className="animate-spin text-emerald-500" />
                ) : (
                    <ChevronLeft size={18} />
                )}
            </Button>

            {/* Current Month Title Button (Reset to today on tap) */}
            <Button
                variant="ghost"
                onClick={handleReset}
                disabled={isPending}
                className="px-2.5 h-8 text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all duration-100 touch-manipulation text-zinc-800 dark:text-zinc-200"
                title="Ir al mes actual"
            >
                {isPending && pendingDirection === "reset" ? (
                    <Loader2 size={13} className="animate-spin text-emerald-500" />
                ) : (
                    <CalendarIcon size={14} className="text-emerald-500 shrink-0" />
                )}
                <span className={`capitalize transition-opacity duration-150 ${isPending ? "opacity-70" : "opacity-100"}`}>
                    {format(displayDate, "MMMM yyyy", { locale: es })}
                </span>
            </Button>

            {/* Next Month Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={isPending}
                className="h-8 w-8 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 active:scale-85 active:bg-zinc-100 dark:active:bg-zinc-800 transition-all duration-100 touch-manipulation"
                title="Mes siguiente"
            >
                {isPending && pendingDirection === "next" ? (
                    <Loader2 size={16} className="animate-spin text-emerald-500" />
                ) : (
                    <ChevronRight size={18} />
                )}
            </Button>
        </div>
    )
}
