"use client"

import * as React from "react"
import TomSelect from "tom-select"
import "tom-select/dist/css/tom-select.css"

interface ConceptSelectorProps {
    quickConcepts: string[]
    defaultValue?: string
    onChange?: (value: string) => void
}

export function ConceptSelector({ quickConcepts, defaultValue, onChange }: ConceptSelectorProps) {
    const selectRef = React.useRef<HTMLSelectElement>(null)
    const [value, setValue] = React.useState(defaultValue || "")
    const [tsInstance, setTsInstance] = React.useState<any>(null)

    React.useEffect(() => {
        if (!selectRef.current) return

        const ts = new TomSelect(selectRef.current, {
            create: true,
            maxItems: 1,
            placeholder: "Ej. Almuerzo, Nafta, Starbucks...",
            options: quickConcepts.map(c => ({ value: c, text: c })),
            items: defaultValue ? [defaultValue] : [],
            onInitialize: function() {
                if (defaultValue) {
                    this.setValue(defaultValue)
                }
            },
            onChange: function(val: string) {
                setValue(val)
                onChange?.(val)
            },
            render: {
                option_create: (data: any, escape: (str: string) => string) => {
                    return '<div class="create">Agregar <strong>' + escape(data.input) + '</strong>&hellip;</div>';
                },
            },
        })

        setTsInstance(ts)

        return () => {
            ts.destroy()
        }
    }, [quickConcepts, defaultValue])

    const handleChipClick = (concept: string) => {
        if (tsInstance) {
            tsInstance.addOption({ value: concept, text: concept })
            tsInstance.addItem(concept, true)
            setValue(concept)
        }
    }

    return (
        <div className="space-y-3">
            <input type="hidden" name="concept" value={value} />
            <div className="tom-select-wrapper">
                <select
                    ref={selectRef}
                    className="w-full"
                    autoComplete="off"
                />
            </div>

            {quickConcepts.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Sugerencias rápidas</p>
                    <div className="flex flex-wrap gap-1.5">
                        {quickConcepts.map((concept) => (
                            <button
                                key={concept}
                                type="button"
                                onClick={() => handleChipClick(concept)}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 hover:bg-emerald-100 hover:text-emerald-800 transition-colors border border-transparent hover:border-emerald-200 active:scale-95 touch-manipulation"
                            >
                                {concept}
                            </button>
                        ))}
                    </div>
                </div>
            )}

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
