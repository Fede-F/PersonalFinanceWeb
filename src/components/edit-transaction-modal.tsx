"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { transactionSchema } from "@/lib/validations"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AlertCircle, CalendarIcon, HelpCircle, Pencil } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { updateTransaction } from "@/app/actions/transactions"
import { toast } from "sonner"
import { CategorySelector } from "./category-selector"
import { MoneyInput } from "./money-input"
import { CurrencySelector } from "./currency-selector"
import { ConceptSelector } from "./concept-selector"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

interface EditTransactionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: any
    workspaceId: string
    accounts: any[]
    categories: any[]
    currencies: any[]
    quickConcepts: string[]
}

export function EditTransactionModal({
    open,
    onOpenChange,
    transaction,
    workspaceId,
    accounts,
    categories,
    currencies,
    quickConcepts,
}: EditTransactionModalProps) {
    const [loading, setLoading] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false)
    const [updateMode, setUpdateMode] = useState<'single' | 'subsequent'>('single')

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<any>({
        resolver: zodResolver(transactionSchema) as any,
    })

    // Sincronizar campos personalizados manualmente
    const onConceptChange = (val: string) => setValue("concept", val, { shouldValidate: true })
    const onCategoryChange = (val: string) => setValue("categoryId", val, { shouldValidate: true })
    const onCurrencyChange = (val: string) => setValue("currency", val, { shouldValidate: true })
    const onAmountChange = (val: string) => setValue("amount", val, { shouldValidate: true })

    // Reset parameters when opening edit modal with target transaction
    useEffect(() => {
        if (transaction && open) {
            reset({
                workspaceId: transaction.workspaceId,
                accountId: transaction.accountId || undefined,
                categoryId: transaction.categoryId || undefined,
                type: transaction.type,
                concept: transaction.concept,
                amount: transaction.amount,
                currency: transaction.currency,
                description: transaction.description || "",
                date: new Date(transaction.date),
                isFixed: transaction.isFixed,
                isInstallments: transaction.isInstallments,
                installmentsCount: transaction.installmentsCount || 1,
            })
            // If editing a recurring transaction, default update mode to subsequent
            if (transaction.parentId) {
                setUpdateMode('subsequent')
            } else {
                setUpdateMode('single')
            }
        }
    }, [transaction, open, reset])

    // Log errors for debugging
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.log("Edit form validation errors:", errors)
        }
    }, [errors])

    async function onSubmit(data: any) {
        console.log("Submitting edit transaction data:", data)
        if (!transaction) return
        setLoading(true)
        try {
            const formData = new FormData()
            Object.entries(data).forEach(([key, value]) => {
                if (value instanceof Date) {
                    formData.append(key, value.toISOString())
                } else if (value !== null && value !== undefined) {
                    formData.append(key, value.toString())
                }
            })

            const result = await updateTransaction(transaction.id, formData, updateMode)

            if (result.success) {
                toast.success("Transacción modificada correctamente")
                onOpenChange(false)
            } else {
                toast.error(result.error || "Ocurrió un error inesperado")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error al procesar la modificación")
        } finally {
            setLoading(false)
        }
    }

    if (!transaction) return null

    const hasParent = !!transaction.parentId

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-emerald-600" />
                        Modificar Transacción
                    </DialogTitle>
                    <DialogDescription>
                        Actualiza la información de la transacción seleccionada.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-3">
                    <input type="hidden" {...register("workspaceId")} />

                    {hasParent && (
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">¿A qué transacciones aplicar los cambios?</p>
                            
                            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-zinc-800 dark:text-zinc-200 select-none">
                                <input
                                    type="radio"
                                    name="updateMode"
                                    checked={updateMode === 'single'}
                                    onChange={() => setUpdateMode('single')}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-zinc-300 dark:border-zinc-700 accent-emerald-600 cursor-pointer"
                                />
                                <span>Solo a esta transacción</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-zinc-800 dark:text-zinc-200 select-none">
                                <input
                                    type="radio"
                                    name="updateMode"
                                    checked={updateMode === 'subsequent'}
                                    onChange={() => setUpdateMode('subsequent')}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-zinc-300 dark:border-zinc-700 accent-emerald-600 cursor-pointer"
                                />
                                <span>A esta cuota/fecha y las siguientes</span>
                            </label>
                        </div>
                    )}

                    <div className="flex gap-4 items-end">
                        <div className="flex-[2] space-y-2">
                            <Label htmlFor="type" className={errors.type ? "text-rose-500" : ""}>Tipo de Operación</Label>
                            <Select 
                                onValueChange={(v) => setValue("type", v as any, { shouldValidate: true })} 
                                value={watch("type")}
                            >
                                <SelectTrigger className={errors.type ? "border-rose-500 ring-rose-500/20" : ""}>
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EXPENSE">Gasto</SelectItem>
                                    <SelectItem value="INCOME">Ingreso</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type && <p className="text-[10px] text-rose-500 font-medium">{errors.type.message as string}</p>}
                        </div>

                        <div className="flex-1 flex items-center gap-2 h-9 pb-1">
                            <input
                                type="checkbox"
                                id="isFixed"
                                {...register("isFixed")}
                                className="h-4.5 w-4.5 rounded-md border-zinc-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer accent-emerald-600 dark:border-zinc-700 dark:bg-zinc-800"
                            />
                            <Label htmlFor="isFixed" className="text-sm font-medium cursor-pointer select-none">
                                Fijo
                            </Label>
                            <div className="relative flex items-center">
                                <button
                                    type="button"
                                    className="text-zinc-400 hover:text-zinc-600 focus:outline-none transition-colors"
                                    onMouseEnter={() => setShowTooltip(true)}
                                    onMouseLeave={() => setShowTooltip(false)}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowTooltip(!showTooltip);
                                    }}
                                >
                                    <HelpCircle size={16} />
                                </button>
                                {showTooltip && (
                                    <div className="absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-lg bg-zinc-950 p-2.5 text-[11px] leading-relaxed text-zinc-100 shadow-xl border border-zinc-800 transition-all duration-200">
                                        Indica si es un gasto o ingreso fijo/recurrente (ej: Expensas, alquiler, abonos, sueldo).
                                        <div className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 bg-zinc-950 border-r border-b border-zinc-800 rotate-45" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className={errors.concept ? "text-rose-500" : ""}>Concepto</Label>
                        <ConceptSelector
                            quickConcepts={quickConcepts}
                            onChange={onConceptChange}
                            defaultValue={watch("concept")}
                        />
                        {errors.concept?.message && <p className="text-[10px] text-rose-500 font-medium">{errors.concept.message as string}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className={errors.categoryId ? "text-rose-500" : ""}>Categoría</Label>
                        <CategorySelector
                            workspaceId={workspaceId}
                            categories={categories}
                            onChange={onCategoryChange}
                            defaultValue={watch("categoryId")}
                        />
                        {errors.categoryId && <p className="text-[10px] text-rose-500 font-medium">{errors.categoryId.message as string}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount" className={errors.amount ? "text-rose-500" : ""}>Monto</Label>
                            <MoneyInput
                                name="amount"
                                placeholder="0,00"
                                onChange={onAmountChange}
                                className={errors.amount ? "border-rose-500 ring-rose-500/20" : ""}
                                defaultValue={watch("amount")}
                            />
                            {errors.amount?.message && <p className="text-[10px] text-rose-500 font-medium">{errors.amount.message as string}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className={errors.currency ? "text-rose-500" : ""}>Moneda</Label>
                            <CurrencySelector
                                currencies={currencies}
                                defaultValue={watch("currency")}
                                onChange={onCurrencyChange}
                                className={errors.currency ? "border-rose-500 ring-rose-500/20" : ""}
                            />
                            {errors.currency?.message && <p className="text-[10px] text-rose-500 font-medium">{errors.currency.message as string}</p>}
                        </div>
                    </div>

                    <div className="flex gap-4 items-center h-11">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isInstallments"
                                {...register("isInstallments")}
                                className="h-4.5 w-4.5 rounded-md border-zinc-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer accent-emerald-600 dark:border-zinc-700 dark:bg-zinc-800"
                            />
                            <Label htmlFor="isInstallments" className="text-sm font-medium cursor-pointer select-none">
                                En cuotas
                            </Label>
                        </div>

                        {watch("isInstallments") && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 h-9 overflow-hidden w-28">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const current = parseInt(watch("installmentsCount") || "1", 10);
                                            if (current > 1) {
                                                setValue("installmentsCount", current - 1, { shouldValidate: true });
                                            }
                                        }}
                                        className="h-full px-2.5 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors border-r border-zinc-200 dark:border-zinc-800 font-medium text-lg focus:outline-none"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        id="installmentsCount"
                                        {...register("installmentsCount")}
                                        className="w-full text-center border-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-sm dark:bg-zinc-900 font-medium"
                                        min="1"
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            setValue("installmentsCount", isNaN(val) || val < 1 ? 1 : val, { shouldValidate: true });
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const current = parseInt(watch("installmentsCount") || "1", 10);
                                            setValue("installmentsCount", current + 1, { shouldValidate: true });
                                        }}
                                        className="h-full px-2.5 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors border-l border-zinc-200 dark:border-zinc-800 font-medium text-lg focus:outline-none"
                                    >
                                        +
                                    </button>
                                </div>
                                <span className="text-xs text-zinc-500 font-medium">cuotas</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className={errors.date ? "text-rose-500" : ""}>Fecha de la Operación</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full h-9 justify-start text-left font-normal",
                                        !watch("date") && "text-muted-foreground",
                                        errors.date && "border-rose-500 ring-rose-500/20"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {watch("date") ? format(watch("date"), "PPP", { locale: es }) : <span>Elegir fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={watch("date")}
                                    onSelect={(date) => setValue("date", date as any, { shouldValidate: true })}
                                    initialFocus
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                        {errors.date?.message && <p className="text-[10px] text-rose-500 font-medium">{errors.date.message as string}</p>}
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="detalle" className="border-none">
                            <AccordionTrigger className="py-2 text-xs text-zinc-500 hover:no-underline font-normal">
                                + Agregar detalles opcionales
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-0">
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-xs text-zinc-500">Detalle / Notas</Label>
                                    <Input
                                        {...register("description")}
                                        placeholder="Ej. Almuerzo de negocios, Ref. 123..."
                                        className="h-9 text-sm"
                                    />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <div className="pt-2 flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 py-6"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold py-6"
                            disabled={loading}
                        >
                            {loading ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
