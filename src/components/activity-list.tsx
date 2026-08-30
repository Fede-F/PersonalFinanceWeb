"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Plus, ArrowDownLeft, ArrowRightLeft, Calendar as CalendarIcon, Pencil, Trash2, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { EditTransactionModal } from "./edit-transaction-modal"
import { DeleteTransactionDialog } from "./delete-transaction-dialog"
import { MaskedValue } from "./privacy-provider"
import { formatCurrency } from "@/lib/formatters"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "./ui/dropdown-menu"

interface ActivityListProps {
    recentTransactions: any[]
    workspaceId: string
    accounts: any[]
    categories: any[]
    currencies: any[]
    quickConcepts: string[]
    preferredCurrency: string
    isShared?: boolean
}

const AVATAR_COLORS = [
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-sky-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-fuchsia-500",
    "bg-pink-500"
]

function getAvatarBgColor(name: string) {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const idx = Math.abs(hash) % AVATAR_COLORS.length
    return AVATAR_COLORS[idx]
}

export function ActivityList({
    recentTransactions,
    workspaceId,
    accounts,
    categories,
    currencies,
    quickConcepts,
    preferredCurrency,
    isShared = false
}: ActivityListProps) {
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [selectedTx, setSelectedTx] = useState<any>(null)

    function handleStartEdit(tx: any) {
        setSelectedTx(tx)
        setEditOpen(true)
    }

    function handleStartDelete(tx: any) {
        setSelectedTx(tx)
        setDeleteOpen(true)
    }

    return (
        <>
            <Card className="border-none shadow-xl overflow-hidden animate-in fade-in duration-1000 delay-300 fill-mode-both">
                <div className="divide-y">
                    {recentTransactions.length === 0 ? (
                        <div className="p-12 text-center text-zinc-500 flex flex-col items-center gap-3">
                            <CalendarIcon size={40} className="opacity-20 text-zinc-400" />
                            <p>No hay transacciones en este período.</p>
                        </div>
                    ) : (
                        recentTransactions.map((tx) => (                            
                            <div key={tx.id} className="p-4 flex items-start sm:items-center gap-3 sm:gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group">
                                <div className={cn(
                                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs shrink-0",
                                    tx.type === 'INCOME' ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                                    tx.type === 'EXPENSE' ? "bg-rose-500/10 text-rose-600 dark:text-rose-400/90" :
                                    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800"
                                )}>
                                    {tx.type === 'INCOME' ? <Plus className="w-5 h-5 sm:w-6 sm:h-6" /> :
                                     tx.type === 'EXPENSE' ? <ArrowDownLeft className="w-5 h-5 sm:w-6 sm:h-6" /> :
                                     <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
                                        <p className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">{tx.concept}</p>
                                        {tx.isFixed && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                                                Fijo
                                            </span>
                                        )}
                                        {tx.isInstallments && tx.installmentNumber && tx.installmentsCount && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shrink-0">
                                                Cuota {tx.installmentNumber}/{tx.installmentsCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-x-1.5 gap-y-0.5 text-zinc-500 text-[10px] sm:text-xs flex-wrap mt-0.5 leading-none">
                                        <span suppressHydrationWarning className="flex items-center gap-1 shrink-0"><CalendarIcon className="w-3 h-3 opacity-60" /> {format(new Date(tx.date), "dd MMM", { locale: es })}</span>
                                        <span className="opacity-30 shrink-0">•</span>
                                        <span className="flex items-center gap-1 shrink-0 font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: tx.categoryColor || "#a1a1aa" }} />
                                            {tx.categoryName || "Gral."}
                                        </span>
                                        {isShared && tx.creatorName && (
                                            <>
                                                <span className="opacity-30 shrink-0">•</span>
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 max-w-[125px] truncate select-none shrink-0">
                                                    <span className={cn(
                                                        "h-3.5 w-3.5 rounded-full text-[8px] font-extrabold flex items-center justify-center text-white shrink-0",
                                                        getAvatarBgColor(tx.creatorName)
                                                    )}>
                                                        {tx.creatorName.charAt(0).toUpperCase()}
                                                    </span>
                                                    <span className="truncate">{tx.creatorName}</span>
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 sm:gap-3 shrink-0">
                                    <div className="text-right" suppressHydrationWarning>
                                        <p className={cn(
                                            "font-bold text-sm sm:text-base font-mono tabular-nums leading-none",
                                            tx.type === 'INCOME' ? "text-emerald-700 dark:text-emerald-400 font-extrabold" :
                                            tx.type === 'EXPENSE' ? "text-zinc-800 dark:text-zinc-200" :
                                            "text-zinc-900 dark:text-zinc-100"
                                        )}>
                                            <MaskedValue value={`${tx.type === 'INCOME' ? '+' : '-'}${formatCurrency(parseFloat(tx.amount), tx.currency)}`} />
                                        </p>
                                        {tx.currency !== preferredCurrency && (
                                            <p className="text-[9px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-tighter mt-1 leading-none font-mono tabular-nums">
                                                ≈ <MaskedValue value={formatCurrency(tx.amountInPreferred, preferredCurrency)} />
                                            </p>
                                        )}
                                        {tx.currency !== "USD" && preferredCurrency !== "USD" && (
                                            <p className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-tighter mt-1 leading-none font-mono tabular-nums">
                                                ≈ <MaskedValue value={formatCurrency(tx.amountInUSD, "USD")} />
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {/* Desktop direct buttons (hidden on mobile, visible on hover on desktop) */}
                                        <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center gap-0.5 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-white dark:bg-zinc-950 shadow-sm">
                                            <button
                                                onClick={() => handleStartEdit(tx)}
                                                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 rounded-md transition-colors focus:outline-none"
                                                title="Modificar"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleStartDelete(tx)}
                                                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors focus:outline-none"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        {/* Mobile dropdown menu (visible on mobile, hidden on desktop) */}
                                        <div className="md:hidden">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 rounded-full transition-colors focus:outline-none">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-36">
                                                    <DropdownMenuItem onClick={() => handleStartEdit(tx)} className="gap-2 cursor-pointer">
                                                        <Pencil size={14} />
                                                        <span>Modificar</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        onClick={() => handleStartDelete(tx)} 
                                                        variant="destructive"
                                                        className="gap-2 cursor-pointer text-rose-600 focus:text-rose-700"
                                                    >
                                                        <Trash2 size={14} className="text-rose-600" />
                                                        <span>Eliminar</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            <EditTransactionModal
                open={editOpen}
                onOpenChange={setEditOpen}
                transaction={selectedTx}
                workspaceId={workspaceId}
                accounts={accounts}
                categories={categories}
                currencies={currencies}
                quickConcepts={quickConcepts}
            />

            <DeleteTransactionDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                transaction={selectedTx}
            />
        </>
    )
}
