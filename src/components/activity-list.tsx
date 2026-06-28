"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Plus, ArrowDownLeft, ArrowRightLeft, Calendar as CalendarIcon, Pencil, Trash2, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { EditTransactionModal } from "./edit-transaction-modal"
import { DeleteTransactionDialog } from "./delete-transaction-dialog"
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
                            <div key={tx.id} className="p-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm",
                                    tx.type === 'INCOME' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" :
                                    tx.type === 'EXPENSE' ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" :
                                    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800"
                                )}>
                                    {tx.type === 'INCOME' ? <Plus size={20} /> :
                                     tx.type === 'EXPENSE' ? <ArrowDownLeft size={20} /> :
                                     <ArrowRightLeft size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{tx.concept}</p>
                                        {tx.isFixed && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                                Fijo
                                            </span>
                                        )}
                                        {tx.isInstallments && tx.installmentNumber && tx.installmentsCount && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                                                Cuota {tx.installmentNumber}/{tx.installmentsCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-500 text-sm flex-wrap">
                                        <span suppressHydrationWarning className="flex items-center gap-1"><CalendarIcon size={12} /> {format(new Date(tx.date), "dd MMM", { locale: es })}</span>
                                        <span className="opacity-30">•</span>
                                        <span className="flex items-center gap-1 font-medium">{tx.categoryName || "Gral."}</span>
                                        {isShared && tx.creatorName && (
                                            <>
                                                <span className="opacity-30">•</span>
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 max-w-[125px] truncate select-none">
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
                                <div className="flex items-center gap-3">
                                    <div className="text-right" suppressHydrationWarning>
                                        <p className={cn(
                                            "font-black text-lg tabular-nums",
                                            tx.type === 'INCOME' ? "text-emerald-600" :
                                            tx.type === 'EXPENSE' ? "text-rose-600" :
                                            "text-zinc-900 dark:text-zinc-100"
                                        )}>
                                            {tx.type === 'INCOME' ? '+' : '-'}{tx.currency} {parseFloat(tx.amount).toLocaleString("es-AR")}
                                        </p>
                                        {tx.currency !== preferredCurrency && (
                                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                                                ≈ {preferredCurrency} {(parseFloat(tx.amount) * parseFloat(tx.exchangeRate)).toLocaleString("es-AR")}
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
