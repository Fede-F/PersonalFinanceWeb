"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle, LayoutDashboard, Settings } from "lucide-react"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useRouter, useSearchParams } from "next/navigation"
import { CreateWorkspaceForm } from "./create-workspace-form"
import { WorkspaceSettingsDialog } from "./workspace-settings-dialog"

interface WorkspaceSwitcherProps {
    workspaces: {
        id: string
        name: string
        baseCurrency: string
        ownerId: string
    }[]
    currentWorkspaceId: string
    currencies: any[]
    userId: string
}

export function WorkspaceSwitcher({ workspaces, currentWorkspaceId, currencies, userId }: WorkspaceSwitcherProps) {
    const [open, setOpen] = React.useState(false)
    const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = React.useState(false)
    const [showSettingsDialog, setShowSettingsDialog] = React.useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    const selectedWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0]

    const onWorkspaceSelect = (workspaceId: string) => {
        setOpen(false)
        const params = new URLSearchParams(searchParams.toString())
        params.set("workspaceId", workspaceId)
        router.push(`/dashboard?${params.toString()}`)
    }

    return (
        <>
            <Dialog open={showNewWorkspaceDialog} onOpenChange={setShowNewWorkspaceDialog}>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            aria-label="Seleccionar workspace"
                            className="w-auto min-w-[200px] max-w-[300px] justify-between px-3"
                        >
                            <div className="flex items-center gap-2 truncate mr-2">
                                <LayoutDashboard className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span className="truncate font-medium">{selectedWorkspace?.name}</span>
                            </div>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandList>
                                <CommandInput placeholder="Buscar workspace..." />
                                <CommandEmpty>No se encontró el workspace.</CommandEmpty>
                                <CommandGroup heading="Mis Workspaces">
                                    {workspaces.map((w) => (
                                        <CommandItem
                                            key={w.id}
                                            onSelect={() => onWorkspaceSelect(w.id)}
                                            className="text-sm cursor-pointer"
                                        >
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            {w.name}
                                            <Check
                                                className={cn(
                                                    "ml-auto h-4 w-4",
                                                    currentWorkspaceId === w.id
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                            <CommandSeparator />
                            <CommandList>
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() => {
                                            setOpen(false)
                                            setShowSettingsDialog(true)
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Settings className="mr-2 h-4 w-4 text-zinc-500" />
                                        Configurar Workspaces
                                    </CommandItem>
                                    <DialogTrigger asChild>
                                        <CommandItem
                                            onSelect={() => {
                                                setOpen(false)
                                                setShowNewWorkspaceDialog(true)
                                            }}
                                            className="cursor-pointer"
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Crear Workspace
                                        </CommandItem>
                                    </DialogTrigger>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Workspace</DialogTitle>
                        <DialogDescription>
                            Crea un nuevo espacio para organizar tus finanzas.
                        </DialogDescription>
                    </DialogHeader>
                    <CreateWorkspaceForm
                        currencies={currencies}
                        defaultCurrency={selectedWorkspace?.baseCurrency}
                        onSuccess={() => setShowNewWorkspaceDialog(false)}
                    />
                </DialogContent>
            </Dialog>

            <WorkspaceSettingsDialog
                open={showSettingsDialog}
                onOpenChange={setShowSettingsDialog}
                workspaces={workspaces}
                currentWorkspaceId={currentWorkspaceId}
                userId={userId}
            />
        </>
    )
}
