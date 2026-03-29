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
import { createCategory } from "@/app/actions/categories"
import { toast } from "sonner"

interface CategorySelectorProps {
    workspaceId: string
    categories: any[]
    onChange?: (value: string) => void
}

export function CategorySelector({ workspaceId, categories: initialCategories, onChange }: CategorySelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const [categories, setCategories] = React.useState(initialCategories)
    const [search, setSearch] = React.useState("")
    const [isCreating, setIsCreating] = React.useState(false)

    const handleCreateCategory = async (name: string) => {
        setIsCreating(true)
        try {
            const formData = new FormData()
            formData.append("workspaceId", workspaceId)
            formData.append("name", name)
            formData.append("icon", "Tag") // Default icon
            formData.append("color", "#10b981") // Default emerald color
            formData.append("type", "EXPENSE")

            const newCategory = await createCategory(formData)
            if (newCategory) {
                setCategories([...categories, newCategory])
                setValue(newCategory.id)
                setOpen(false)
                toast.success(`Categoría "${name}" creada`)
            }
        } catch (error) {
            console.error(error)
            toast.error("Error al crear la categoría")
        } finally {
            setIsCreating(false)
        }
    }

    const selectedCategory = categories.find((category) => category.id === value)

    return (
        <div className="flex flex-col gap-2">
            <input type="hidden" name="categoryId" value={value} />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between font-normal"
                    >
                        {selectedCategory ? (
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: selectedCategory.color || "#ccc" }}
                                />
                                {selectedCategory.name}
                            </div>
                        ) : (
                            "Selecciona una categoría..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Buscar categoría..."
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList>
                            <CommandEmpty className="py-2 px-4 text-sm">
                                <p className="text-zinc-500 mb-2">No se encontró la categoría.</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full gap-2"
                                    onClick={() => handleCreateCategory(search)}
                                    disabled={isCreating || !search}
                                >
                                    <Plus size={14} /> Crear "{search}"
                                </Button>
                            </CommandEmpty>
                            <CommandGroup>
                                {categories.map((category) => (
                                    <CommandItem
                                        key={category.id}
                                        value={category.name}
                                        onSelect={() => {
                                            const newVal = category.id === value ? "" : category.id
                                            setValue(newVal)
                                            onChange?.(newVal)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === category.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: category.color || "#ccc" }}
                                            />
                                            {category.name}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup>
                                <CommandItem
                                    onSelect={() => {
                                        if (search.trim()) {
                                            handleCreateCategory(search)
                                        } else {
                                            // Si está vacío, ponemos un nombre por defecto
                                            // e incentivamos al usuario a editarlo
                                            setSearch("Nueva Categoría")
                                            const input = document.querySelector('[cmdk-input]') as HTMLInputElement
                                            if (input) {
                                                input.focus()
                                                setTimeout(() => input.select(), 10)
                                            }
                                        }
                                    }}
                                    className="text-emerald-600 font-medium cursor-pointer"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {search.trim() ? `Crear "${search}"` : "Nueva categoría..."}
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
