"use client"

import * as React from "react"
import TomSelect from "tom-select"
import "tom-select/dist/css/tom-select.css"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { blacklistConcept } from "@/app/actions/concepts"

interface ConceptSelectorProps {
  workspaceId: string
  quickConcepts: string[]
  defaultValue?: string
  onChange?: (value: string) => void
}

// Hook for managing mutable concepts list
function useQuickConcepts(initial: string[]) {
  const [items, setItems] = React.useState(initial)
  const remove = (item: string) => setItems(items.filter(i => i !== item))
  const add = (item: string) => setItems([...items, item])
  return { items, remove, add, setItems }
}

export function ConceptSelector({ workspaceId, quickConcepts, defaultValue, onChange }: ConceptSelectorProps) {
  const { items: concepts, remove: removeConcept, setItems: setConcepts } = useQuickConcepts(quickConcepts)

  const selectRef = React.useRef<HTMLSelectElement>(null)
  const [value, setValue] = React.useState(defaultValue || "")
  const [tsInstance, setTsInstance] = React.useState<any>(null)

  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const handleDeleteConcept = async () => {
    if (deleteTarget) {
      try {
        removeConcept(deleteTarget)
        await blacklistConcept(workspaceId, deleteTarget)
        toast.success(`Concepto "${deleteTarget}" eliminado y excluido`)
      } catch (error) {
        console.error(error)
        toast.error("Error al excluir el concepto")
      }
    }
    setDeleteDialogOpen(false)
    setDeleteTarget(null)
  }

  React.useEffect(() => {
    if (!selectRef.current) return

    const uniqueOptions = Array.from(new Set(defaultValue ? [defaultValue, ...concepts] : concepts))

    const ts = new TomSelect(selectRef.current, {
      create: true,
      createOnBlur: true,
      maxItems: 1,
      placeholder: "Ej. Almuerzo, Nafta, Starbucks...",
      options: uniqueOptions.map(c => ({ value: c, text: c })),
      items: defaultValue ? [defaultValue] : [],
      onInitialize: function () {
        if (defaultValue) {
          ;(this as any).setValue(defaultValue)
        }
      },
      onChange: function (val: string) {
        setValue(val)
        onChange?.(val)
      },
      render: {
        option_create: (data: any, escape: (str: string) => string) => {
          return `<div class="create">Agregar <strong>${escape(data.input)}</strong>…</div>`
        },
      },
    })

    setTsInstance(ts)
    return () => {
      ts.destroy()
    }
  }, [concepts, defaultValue])

  const handleChipClick = (concept: string) => {
    if (tsInstance) {
      tsInstance.addOption({ value: concept, text: concept })
      tsInstance.addItem(concept, false)
      setValue(concept)
      onChange?.(concept)
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="concept" value={value} />
      <div className="tom-select-wrapper">
        <select ref={selectRef} className="w-full" autoComplete="off" />
      </div>

      {concepts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Sugerencias rápidas
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-[64px] overflow-hidden">
            {concepts.map((concept) => (
              <div key={concept} className="inline-flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 hover:bg-emerald-100 hover:text-emerald-800 transition-colors border border-transparent hover:border-emerald-200 active:scale-95 touch-manipulation"
                  onClick={() => handleChipClick(concept)}
                >
                  {concept}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget(concept)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <X className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar el concepto "{deleteTarget}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteConcept}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .tom-select-wrapper .ts-control {
          @apply border-zinc-200 rounded-md shadow-none !important;
          padding: 8px 12px !important;
          font-size: 14px !important;
          min-height: 40px !important;
          background-image: none !important;
        }
        .tom-select-wrapper .ts-wrapper.focus .ts-control {
          @apply ring-2 ring-emerald-500/20 border-emerald-500 !important;
        }
        .tom-select-wrapper .ts-dropdown {
          @apply rounded-md border-zinc-200 shadow-lg mt-1 !important;
        }
        .tom-select-wrapper .ts-dropdown .active {
          @apply bg-emerald-50 text-emerald-900 !important;
        }
        .tom-select-wrapper .create {
          @apply text-emerald-600 font-medium !important;
        }
      `}</style>
    </div>
  )
}
