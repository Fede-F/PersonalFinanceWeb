import { auth } from "@/auth"
import { db } from "@/db"
import { workspaces, workspaceMembers, supportedCurrencies, users, transactions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Card, CardHeader, CardContent, CardDescription } from "@/components/ui/card"
import { getDashboardData } from "@/app/actions/dashboard"
import { redirect } from "next/navigation"
import {
    ArrowUpRight,
    ArrowDownLeft,
    Plus,
    ArrowRightLeft,
    Calendar as CalendarIcon,
    LayoutDashboard,
    Wallet,
    TrendingUp,
    TrendingDown,
    MapPin
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { TransactionModal } from "@/components/transaction-modal"
import { CreateWorkspaceForm } from "@/components/create-workspace-form"

import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import { UserNav } from "@/components/user-nav"
import { PeriodSelector } from "@/components/period-selector"
import { AnimatedNumber } from "@/components/animated-number"
import { cn } from "@/lib/utils"

export default async function DashboardPage(props: {
    searchParams: Promise<{ workspaceId?: string; month?: string; year?: string }>
}) {
    const searchParams = await props.searchParams
    const month = searchParams.month ? parseInt(searchParams.month) : undefined
    const year = searchParams.year ? parseInt(searchParams.year) : undefined
    
    const session = await auth()
    if (!session?.user?.id) redirect("/")

    // Fetch user details for the profile menu
    const [userData] = await db.select().from(users).where(eq(users.id, session.user.id))

    const userMemberships = await db
        .select({
            id: workspaces.id,
            name: workspaces.name,
            baseCurrency: workspaces.baseCurrency,
        })
        .from(workspaces)
        .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
        .where(eq(workspaceMembers.userId, session.user.id))

    const allCurrencies = await db.select().from(supportedCurrencies).orderBy(supportedCurrencies.code)

    if (userMemberships.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
                <div className="max-w-md w-full text-center space-y-6">
                    <LayoutDashboard className="w-16 h-16 mx-auto text-emerald-500" />
                    <h1 className="text-3xl font-bold">Bienvenido a FinanceApp</h1>
                    <p className="text-zinc-500">Para empezar, necesitas crear tu primer Workspace (ej. Gastos Personales, Hogar).</p>
                    <Card className="p-6 border-none shadow-xl bg-white/50 backdrop-blur-sm">
                        <CreateWorkspaceForm currencies={allCurrencies} />
                    </Card>
                </div>
            </div>
        )
    }

    const selectedWorkspaceId = searchParams.workspaceId || userMemberships[0].id
    const currentWorkspace = userMemberships.find(w => w.id === selectedWorkspaceId) || userMemberships[0]

    const { accounts, recentTransactions, categories, currencies, quickConcepts } = await getDashboardData(currentWorkspace.id, month, year)

    const preferredCurrency = userData.defaultCurrency || currentWorkspace.baseCurrency

    // Sumamos usando normalización: amount * exchangeRate
    const totalIncome = recentTransactions
        .filter(tx => tx.type === 'INCOME')
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) * parseFloat(curr.exchangeRate)), 0)

    const totalExpense = recentTransactions
        .filter(tx => tx.type === 'EXPENSE')
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) * parseFloat(curr.exchangeRate)), 0)

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
            {/* Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/80 backdrop-blur-md px-6 dark:bg-zinc-900/80">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold tracking-tight bg-emerald-500 text-white px-2 py-1 rounded shadow-sm">FA</h2>
                    <WorkspaceSwitcher
                        workspaces={userMemberships}
                        currentWorkspaceId={currentWorkspace.id}
                        currencies={currencies}
                    />
                </div>

                <div className="hidden md:flex ml-4">
                    <PeriodSelector initialMonth={month} initialYear={year} />
                </div>

                <div className="ml-auto flex items-center gap-4">
                    <UserNav user={userData} currencies={currencies} />
                </div>
            </header>

            {/* Mobile Period Selector */}
            <div className="flex justify-center mt-4 md:hidden px-6">
                <PeriodSelector initialMonth={month} initialYear={year} />
            </div>

            <main className="flex-1 p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full animate-in fade-in duration-1000">
                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Income Card */}
                    <Card className="relative overflow-hidden group border-none shadow-sm transition-all hover:shadow-md animate-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <TrendingUp size={80} className="text-emerald-500" />
                        </div>
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardDescription className="font-medium">Ingresos del Mes</CardDescription>
                            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-full dark:bg-emerald-500/10">
                                <ArrowUpRight size={18} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold flex items-center gap-1.5">
                                <span className="text-xl text-emerald-600 opacity-70">+ {preferredCurrency}</span>
                                <AnimatedNumber value={totalIncome} />
                            </div>
                            {preferredCurrency !== "USD" && (
                                <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1 font-medium bg-zinc-100 dark:bg-zinc-800 w-fit px-2 py-0.5 rounded-full">
                                    <span>≈ USD</span>
                                    <AnimatedNumber value={totalIncome / 1.0} duration={1200} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Expense Card */}
                    <Card className="relative overflow-hidden group border-none shadow-sm transition-all hover:shadow-md animate-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <TrendingDown size={80} className="text-rose-500" />
                        </div>
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardDescription className="font-medium">Gastos del Mes</CardDescription>
                            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-full dark:bg-rose-500/10">
                                <ArrowDownLeft size={18} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-rose-600 flex items-center gap-1.5">
                                <span className="text-xl opacity-70">- {preferredCurrency}</span>
                                <AnimatedNumber value={totalExpense} />
                            </div>
                            {preferredCurrency !== "USD" && (
                                <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1 font-medium bg-zinc-100 dark:bg-zinc-800 w-fit px-2 py-0.5 rounded-full">
                                    <span>≈ USD</span>
                                    <AnimatedNumber value={totalExpense / 1.0} duration={1200} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Activity List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-bold tracking-tight">Actividad</h3>
                            <p className="text-zinc-500 text-sm">Transacciones registradas en este período</p>
                        </div>
                        <TransactionModal
                            workspaceId={currentWorkspace.id}
                            accounts={accounts}
                            categories={categories}
                            currencies={currencies}
                            quickConcepts={quickConcepts}
                            defaultCurrency={currentWorkspace.baseCurrency}
                            userDefaultCurrency={userData.defaultCurrency}
                        />
                    </div>

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
                                            <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{tx.concept}</p>
                                            <div className="flex items-center gap-2 text-zinc-500 text-sm">
                                                <span className="flex items-center gap-1"><CalendarIcon size={12} /> {format(new Date(tx.date), "dd MMM", { locale: es })}</span>
                                                <span className="opacity-30">•</span>
                                                <span className="flex items-center gap-1 font-medium">{tx.categoryName || "Gral."}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "font-black text-lg tabular-nums",
                                                tx.type === 'INCOME' ? "text-emerald-600" :
                                                tx.type === 'EXPENSE' ? "text-rose-600" :
                                                "text-zinc-900 dark:text-zinc-100"
                                            )}>
                                                {tx.type === 'INCOME' ? '+' : '-'}{tx.currency} {parseFloat(tx.amount).toLocaleString()}
                                            </p>
                                            {tx.currency !== preferredCurrency && (
                                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                                                    ≈ {preferredCurrency} {(parseFloat(tx.amount) * parseFloat(tx.exchangeRate)).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    )
}
