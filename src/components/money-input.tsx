"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

interface MoneyInputProps {
    name: string
    placeholder?: string
    defaultValue?: string
    required?: boolean
    className?: string
    onChange?: (value: string) => void
}

export function MoneyInput({ name, placeholder, defaultValue = "", required, className, onChange }: MoneyInputProps) {
    const [displayValue, setDisplayValue] = React.useState("")
    const [rawValue, setRawValue] = React.useState(defaultValue)

    // Formatear el valor inicial si existe
    React.useEffect(() => {
        if (defaultValue) {
            formatAndSetValues(defaultValue)
        }
    }, [defaultValue])

    const formatAndSetValues = (input: string) => {
        // Eliminar todo lo que no sea dígito
        const digits = input.replace(/\D/g, "")
        
        if (!digits) {
            setDisplayValue("")
            setRawValue("")
            return
        }

        // Convertir a número (asumiendo que los últimos 2 dígitos son decimales)
        const numberValue = parseFloat(digits) / 100
        
        // Formatear para mostrar (estilo local con puntos de mil y coma decimal)
        const formatted = new Intl.NumberFormat("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numberValue)

        setDisplayValue(formatted)
        setRawValue(numberValue.toString())
        onChange?.(numberValue.toString())
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        formatAndSetValues(e.target.value)
    }

    return (
        <div className="relative">
            <Input
                type="text"
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder || "0,00"}
                required={required}
                className={className}
                autoComplete="off"
            />
            {/* Campo oculto que realmente se envía en el FormData */}
            <input type="hidden" name={name} value={rawValue} />
        </div>
    )
}
