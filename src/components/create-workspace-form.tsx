"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createWorkspace } from "@/app/actions/workspace"
import { toast } from "sonner"
import { CurrencySelector } from "./currency-selector"
import { Label } from "./ui/label"

interface CreateWorkspaceFormProps {
    currencies: any[]
    defaultCurrency?: string
    onSuccess?: () => void
}

export function CreateWorkspaceForm({ currencies, defaultCurrency = "USD", onSuccess }: CreateWorkspaceFormProps) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            const result = await createWorkspace(formData)
            if (result.success) {
                toast.success("Workspace creado correctamente")
                onSuccess?.()
            } else {
                toast.error(result.error || "Error al crear el workspace")
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-2">
                <Label htmlFor="name">Nombre del Workspace</Label>
                <Input name="name" placeholder="Ej. Finanzas Personales" required disabled={loading} />
            </div>
            <div className="space-y-2">
                <Label>Moneda por Defecto</Label>
                <CurrencySelector
                    currencies={currencies}
                    defaultValue={defaultCurrency}
                    name="baseCurrency"
                />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold py-6" disabled={loading}>
                {loading ? "Creando..." : "Crear Workspace"}
            </Button>
        </form>
    )
}
