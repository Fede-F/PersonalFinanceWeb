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
    const [rawValue, setRawValue] = React.useState("")

    // Sincronizar valor inicial o externo (ej. al abrir el modal o resetear formulario)
    React.useEffect(() => {
        if (defaultValue !== undefined && defaultValue !== "") {
            const parsed = parseFloat(defaultValue)
            if (!isNaN(parsed)) {
                setRawValue(defaultValue)
                // Formatear para mostrar estilo local (ej: 1.250,75)
                const formatted = new Intl.NumberFormat("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(parsed)
                setDisplayValue(formatted)
            } else {
                setRawValue("")
                setDisplayValue("")
            }
        } else {
            setRawValue("")
            setDisplayValue("")
        }
    }, [defaultValue])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value

        // Reemplazar puntos por comas (para tratar ambos como separador decimal)
        val = val.replace(/\./g, ",")

        // Filtrar caracteres no permitidos (solo números y una coma)
        val = val.replace(/[^0-9,]/g, "")

        // Si empieza con coma, autocompletar con "0,"
        if (val.startsWith(",")) {
            val = "0" + val
        }

        // Evitar ceros a la izquierda innecesarios (ej: "05" -> "5")
        if (val.length > 1 && val.startsWith("0") && val[1] !== ",") {
            val = val.substring(1)
        }

        // Asegurar que solo haya una coma en total
        const commaIndex = val.indexOf(",")
        if (commaIndex !== -1) {
            val = val.substring(0, commaIndex + 1) + val.substring(commaIndex + 1).replace(/,/g, "")
            
            // Limitar decimales a un máximo de 2 dígitos
            const parts = val.split(",")
            if (parts[1].length > 2) {
                val = parts[0] + "," + parts[1].substring(0, 2)
            }
        }

        setDisplayValue(val)

        // El valor crudo para enviar al backend usa el formato estándar de punto decimal
        const raw = val.replace(/,/g, ".")
        setRawValue(raw)
        onChange?.(raw)
    }

    const handleFocus = () => {
        if (rawValue) {
            const parsed = parseFloat(rawValue)
            if (!isNaN(parsed)) {
                const hasDecimals = rawValue.includes(".")
                const decimalPart = hasDecimals ? rawValue.split(".")[1] : ""
                
                // Si hay decimales cargados y significativos, los mantenemos en el campo
                if (hasDecimals && decimalPart !== "00" && decimalPart !== "") {
                    setDisplayValue(rawValue.replace(/\./g, ","))
                } else {
                    // Si los decimales son nulos o vacíos, mostramos solo la parte entera para facilitar edición
                    setDisplayValue(rawValue.split(".")[0])
                }
            }
        }
    }

    const handleBlur = () => {
        if (rawValue) {
            const parsed = parseFloat(rawValue)
            if (!isNaN(parsed)) {
                const formatted = new Intl.NumberFormat("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(parsed)
                setDisplayValue(formatted)
            } else {
                setDisplayValue("")
            }
        } else {
            setDisplayValue("")
        }
    }

    return (
        <div className="relative">
            <Input
                type="text"
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder || "0,00"}
                required={required}
                className={className}
                autoComplete="off"
                inputMode="decimal"
            />
            {/* Campo oculto que realmente se envía en el FormData */}
            <input type="hidden" name={name} value={rawValue} />
        </div>
    )
}
