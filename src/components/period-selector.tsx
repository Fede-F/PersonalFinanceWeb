"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { format, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"

interface PeriodSelectorProps {
    initialMonth?: number
    initialYear?: number
}

export function PeriodSelector({ initialMonth, initialYear }: PeriodSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Si no vienen valores, usamos la fecha actual
    const now = new Date()
    const currentMonth = initialMonth !== undefined ? initialMonth : now.getMonth()
    const currentYear = initialYear !== undefined ? initialYear : now.getFullYear()
    
    // Crear objeto Date para el periodo actual (siempre el día 1)
    const currentDate = new Date(currentYear, currentMonth, 1)

    const updatePeriod = (newDate: Date) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("month", newDate.getMonth().toString())
        params.set("year", newDate.getFullYear().toString())
        
        router.push(`?${params.toString()}`)
    }

    const handlePrev = () => updatePeriod(subMonths(currentDate, 1))
    const handleNext = () => updatePeriod(addMonths(currentDate, 1))
    const handleReset = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("month")
        params.delete("year")
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-lg border shadow-sm">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrev}
                className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
            >
                <ChevronLeft size={18} />
            </Button>
            
            <Button 
                variant="ghost" 
                onClick={handleReset}
                className="px-3 h-8 text-sm font-semibold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
                <CalendarIcon size={14} className="text-emerald-500" />
                <span className="capitalize">
                    {format(currentDate, "MMMM yyyy", { locale: es })}
                </span>
            </Button>
            
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNext}
                className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
            >
                <ChevronRight size={18} />
            </Button>
        </div>
    )
}
