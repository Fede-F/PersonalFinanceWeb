"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { createSupportedCurrency } from "@/app/actions/currencies"
import { toast } from "sonner"

interface CurrencySelectorProps {
    currencies: any[]
    defaultValue?: string
    name?: string
    onChange?: (value: string) => void
    className?: string
}

export function CurrencySelector({ currencies: initialCurrencies, defaultValue, name = "currency", onChange, className }: CurrencySelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState(defaultValue || "")
    const [currencies, setCurrencies] = React.useState(initialCurrencies)
    const [search, setSearch] = React.useState("")
    const [isCreating, setIsCreating] = React.useState(false)

    React.useEffect(() => {
        if (defaultValue !== undefined) {
            setValue(defaultValue || "")
        }
    }, [defaultValue])

    const handleCreateCurrency = async (code: string) => {
        const upperCode = code.toUpperCase().trim()
        if (upperCode.length < 2 || upperCode.length > 5) {
            toast.error("El código de moneda debe tener entre 2 y 5 caracteres")
            return
        }

        setIsCreating(true)
        try {
            const newCurrency = await createSupportedCurrency(upperCode)
            if (newCurrency) {
                // Check if it's already in the list
                if (!currencies.find(c => c.code === newCurrency.code)) {
                    setCurrencies([...currencies, newCurrency].sort((a, b) => a.code.localeCompare(b.code)))
                }
                setValue(newCurrency.code)
                setOpen(false)
                toast.success(`Moneda ${upperCode} habilitada`)
            }
        } catch (error) {
            console.error(error)
            toast.error("Error al crear la moneda")
        } finally {
            setIsCreating(false)
        }
    }

    const selectedCurrency = currencies.find((c) => c.code === value)

    return (
        <div className="flex flex-col gap-2">
            <input type="hidden" name={name} value={value} />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn("w-full justify-between font-normal pr-8 relative", className)}
                    >
                        <span className="truncate">
                            {selectedCurrency ? (
                                `${selectedCurrency.code} - ${selectedCurrency.name}`
                            ) : (
                                "Moneda..."
                            )}
                        </span>
                        <ChevronsUpDown className="absolute right-3 h-4 w-4 shrink-0 opacity-50" />
                    </Button>

                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Buscar moneda..."
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList>
                            <CommandEmpty className="py-2 px-4 text-sm">
                                <p className="text-zinc-500 mb-2">No se encontró la moneda.</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full gap-2"
                                    onClick={() => handleCreateCurrency(search)}
                                    disabled={isCreating || !search}
                                >
                                    <Plus size={14} /> Crear "{search.toUpperCase()}"
                                </Button>
                            </CommandEmpty>
                            <CommandGroup>
                                {currencies.map((c) => (
                                    <CommandItem
                                        key={c.code}
                                        value={c.code + " " + c.name}
                                        onSelect={() => {
                                            setValue(c.code)
                                            onChange?.(c.code)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === c.code ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span className="font-medium mr-2">{c.code}</span>
                                        <span className="text-zinc-500 text-xs truncate">{c.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
