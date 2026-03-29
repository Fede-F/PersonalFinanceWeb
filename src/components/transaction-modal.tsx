"use client"

import { useState } from "react"
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
    DialogTrigger,
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
import { Plus, AlertCircle, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { createTransaction } from "@/app/actions/transactions"
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

type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionModalProps {
    workspaceId: string
    accounts: any[]
    categories: any[]
    currencies: any[]
    quickConcepts: string[]
    defaultCurrency?: string
    userDefaultCurrency?: string
}

export function TransactionModal({
    workspaceId,
    accounts,
    categories,
    currencies,
    quickConcepts,
    defaultCurrency,
    userDefaultCurrency
}: TransactionModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Configuración de React Hook Form
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<any>({
        resolver: zodResolver(transactionSchema) as any,
        defaultValues: {
            workspaceId,
            type: "EXPENSE",
            currency: userDefaultCurrency || defaultCurrency || "USD",
            amount: "",
            concept: "",
            date: new Date(),
        }
    })

    // Sincronizar campos personalizados manualmente (ya que no usan register directo)
    const onConceptChange = (val: string) => setValue("concept", val, { shouldValidate: true })
    const onCategoryChange = (val: string) => setValue("categoryId", val, { shouldValidate: true })
    const onCurrencyChange = (val: string) => setValue("currency", val, { shouldValidate: true })
    const onAmountChange = (val: string) => setValue("amount", val, { shouldValidate: true })

    async function onSubmit(data: any) {
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

            const result = await createTransaction(formData)

            if (result.success) {
                toast.success("Transacción registrada correctamente")
                reset()
                setOpen(false)
            } else {
                toast.error(result.error || "Ocurrió un error inesperado")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error al procesar la transacción")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v)
            if (!v) reset()
        }}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Plus size={16} /> Nueva Transacción
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nueva Transacción</DialogTitle>
                    <DialogDescription>
                        Registra un nuevo ingreso o gasto en tu cuenta.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <input type="hidden" {...register("workspaceId")} />

                    <div className="space-y-2">
                        <Label htmlFor="type" className={errors.type ? "text-rose-500" : ""}>Tipo de Operación</Label>
                        <Select 
                            onValueChange={(v) => setValue("type", v as any, { shouldValidate: true })} 
                            defaultValue="EXPENSE"
                        >
                            <SelectTrigger className={errors.type ? "border-rose-500 ring-rose-500/20" : ""}>
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EXPENSE">Gasto</SelectItem>
                                <SelectItem value="INCOME">Ingreso</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.type && <p className="text-[10px] text-rose-500 font-medium">{errors.type.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className={errors.concept ? "text-rose-500" : ""}>Concepto</Label>
                        <ConceptSelector
                            quickConcepts={quickConcepts}
                            onChange={onConceptChange}
                        />
                        {errors.concept?.message && <p className="text-[10px] text-rose-500 font-medium">{errors.concept.message as string}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className={errors.categoryId ? "text-rose-500" : ""}>Categoría</Label>
                        <CategorySelector
                            workspaceId={workspaceId}
                            categories={categories}
                            onChange={onCategoryChange}
                        />
                        {errors.categoryId && <p className="text-[10px] text-rose-500 font-medium">{errors.categoryId.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount" className={errors.amount ? "text-rose-500" : ""}>Monto</Label>
                            <MoneyInput
                                name="amount"
                                placeholder="0,00"
                                onChange={onAmountChange}
                                className={errors.amount ? "border-rose-500 ring-rose-500/20" : ""}
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

                    <div className="pt-2">
                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold py-6" disabled={loading}>
                            {loading ? "Registrando..." : "Guardar Transacción"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}


