import { auth } from "@/auth"
import { db } from "@/db"
import { workspaces, workspaceMembers, supportedCurrencies, users, marketRates } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { Card, CardHeader, CardContent, CardDescription } from "@/components/ui/card"
import { getDashboardData } from "@/app/actions/dashboard"
import { redirect } from "next/navigation"
import {
    LayoutDashboard,
    TrendingUp,
    TrendingDown
} from "lucide-react"
import { TransactionModal } from "@/components/transaction-modal"
import { CreateWorkspaceForm } from "@/components/create-workspace-form"
import { ActivityList } from "@/components/activity-list"
import { ExpensesDistribution, SavingsRate } from "@/components/financial-stats"
import { MobileStatsCarousel } from "@/components/mobile-stats-carousel"

import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import { UserNav } from "@/components/user-nav"
import { PeriodSelector } from "@/components/period-selector"
import { AnimatedNumber } from "@/components/animated-number"
import { ThemeToggle } from "@/components/theme-toggle"
import { ThemeSync } from "@/components/theme-sync"
import { NotificationBell } from "@/components/notification-bell"
import { ActiveWorkspaceTracker } from "@/components/active-workspace-tracker"

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
            ownerId: workspaces.ownerId,
            memberCount: sql<number>`(SELECT count(*)::int FROM workspace_members WHERE workspace_members.workspace_id = workspaces.id)`
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

    let selectedWorkspaceId = searchParams.workspaceId
    if (!selectedWorkspaceId && userData.lastActiveWorkspaceId) {
        const stillMember = userMemberships.some(w => w.id === userData.lastActiveWorkspaceId)
        if (stillMember) {
            selectedWorkspaceId = userData.lastActiveWorkspaceId
        }
    }
    if (!selectedWorkspaceId) {
        selectedWorkspaceId = userMemberships[0].id
    }

    const currentWorkspace = userMemberships.find(w => w.id === selectedWorkspaceId) || userMemberships[0]

    const { accounts, recentTransactions, categories, currencies, quickConcepts } = await getDashboardData(currentWorkspace.id, month, year)

    const preferredCurrency = userData.defaultCurrency || currentWorkspace.baseCurrency

    // Fetch market rates and build dynamic latest rates map
    const allRates = await db.select().from(marketRates)
    const latestRatesMap: Record<string, Record<string, number>> = {}
    const latestDatesMap: Record<string, Record<string, string>> = {}

    for (const r of allRates) {
        const base = r.baseCurrency
        const target = r.targetCurrency
        const rateVal = parseFloat(r.rate)
        const dateStr = r.date.toISOString()

        if (!latestRatesMap[base]) {
            latestRatesMap[base] = {}
            latestDatesMap[base] = {}
        }

        const existingDate = latestDatesMap[base][target]
        if (!existingDate || dateStr > existingDate) {
            latestRatesMap[base][target] = rateVal
            latestDatesMap[base][target] = dateStr
        }
    }

    const convertAmount = (amount: number, from: string, to: string): number => {
        if (from === to) return amount
        const directRate = latestRatesMap[from]?.[to]
        if (directRate !== undefined) {
            return amount * directRate
        }
        const rateToUSD = latestRatesMap[from]?.["USD"]
        const rateFromUSD = latestRatesMap["USD"]?.[to]
        if (rateToUSD !== undefined && rateFromUSD !== undefined) {
            return amount * rateToUSD * rateFromUSD
        }
        return amount
    }

    // Normalize recent transactions with dynamic conversion rates
    const normalizedTransactions = recentTransactions.map(tx => {
        const amountFloat = parseFloat(tx.amount)
        return {
            ...tx,
            amountInPreferred: convertAmount(amountFloat, tx.currency, preferredCurrency),
            amountInUSD: convertAmount(amountFloat, tx.currency, "USD")
        }
    })

    // Sum using normalized preferred and USD amounts
    const totalIncome = normalizedTransactions
        .filter(tx => tx.type === 'INCOME')
        .reduce((acc, curr) => acc + curr.amountInPreferred, 0)

    const totalExpense = normalizedTransactions
        .filter(tx => tx.type === 'EXPENSE')
        .reduce((acc, curr) => acc + curr.amountInPreferred, 0)

    const totalIncomeInUSD = normalizedTransactions
        .filter(tx => tx.type === 'INCOME')
        .reduce((acc, curr) => acc + curr.amountInUSD, 0)

    const totalExpenseInUSD = normalizedTransactions
        .filter(tx => tx.type === 'EXPENSE')
        .reduce((acc, curr) => acc + curr.amountInUSD, 0)

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
            {/* Theme synchronizer */}
            <ThemeSync savedTheme={userData.theme} />
            <ActiveWorkspaceTracker workspaceId={currentWorkspace.id} />

            {/* Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center gap-2 px-3 sm:gap-4 sm:px-6 border-b bg-white/80 backdrop-blur-md dark:bg-zinc-900/80">
                <div className="flex items-center gap-1.5 sm:gap-3">
                    <h2 className="hidden min-[380px]:block text-base sm:text-lg font-bold tracking-tight bg-emerald-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded shadow-sm">FA</h2>
                    <WorkspaceSwitcher
                        workspaces={userMemberships}
                        currentWorkspaceId={currentWorkspace.id}
                        currencies={currencies}
                        userId={session.user.id}
                    />
                </div>

                <div className="hidden md:flex ml-4">
                    <PeriodSelector initialMonth={month} initialYear={year} />
                </div>

                <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
                    <ThemeToggle />
                    <NotificationBell />
                    <UserNav
                        user={userData}
                        currencies={currencies}
                        workspaces={userMemberships}
                        currentWorkspaceId={currentWorkspace.id}
                    />
                </div>
            </header>

            {/* Mobile Period Selector */}
            <div className="flex justify-center mt-4 md:hidden px-6">
                <PeriodSelector initialMonth={month} initialYear={year} />
            </div>

            <main className="flex-1 p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full animate-in fade-in duration-1000">

                {/* 1. PC Layout (3 Columns: SavingsRate | Cards + Activity | ExpensesDistribution) */}
                <div className="hidden lg:grid grid-cols-4 gap-6 items-start">

                    {/* PC Left Column: Savings Rate (1/4 width) */}
                    <div className="col-span-1">
                        <SavingsRate
                            transactions={normalizedTransactions}
                            preferredCurrency={preferredCurrency}
                        />
                    </div>

                    {/* PC Center Columns: Cards & Activity (2/4 width) */}
                    <div className="col-span-2 space-y-6">
                        {/* Monthly Income/Expense Cards */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Income Card */}
                            <Card className="relative overflow-hidden group border-none shadow-sm transition-all hover:shadow-md p-6">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-16 h-16 text-emerald-500" />
                                </div>
                                <CardHeader className="pb-2 p-0 flex flex-row items-center justify-between space-y-0">
                                    <CardDescription className="text-sm font-semibold">Ingresos del Mes</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 mt-1">
                                    <div className="text-2xl xl:text-3xl font-black flex items-baseline gap-1.5 flex-wrap">
                                        <span className="text-base xl:text-xl text-emerald-600 opacity-70 font-semibold">+ {preferredCurrency}</span>
                                        <AnimatedNumber value={totalIncome} />
                                    </div>
                                    {preferredCurrency !== "USD" && (
                                        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1 font-medium bg-zinc-100 dark:bg-zinc-800 w-fit px-2 py-0.5 rounded-full">
                                            <span>≈ USD</span>
                                            <AnimatedNumber value={totalIncomeInUSD} duration={1200} />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Expense Card */}
                            <Card className="relative overflow-hidden group border-none shadow-sm transition-all hover:shadow-md p-6">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <TrendingDown className="w-16 h-16 text-rose-500" />
                                </div>
                                <CardHeader className="pb-2 p-0 flex flex-row items-center justify-between space-y-0">
                                    <CardDescription className="text-sm font-semibold">Gastos del Mes</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 mt-1">
                                    <div className="text-2xl xl:text-3xl font-black text-rose-600 flex items-baseline gap-1.5 flex-wrap">
                                        <span className="text-base xl:text-xl opacity-70 font-semibold">- {preferredCurrency}</span>
                                        <AnimatedNumber value={totalExpense} />
                                    </div>
                                    {preferredCurrency !== "USD" && (
                                        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1 font-medium bg-zinc-100 dark:bg-zinc-800 w-fit px-2 py-0.5 rounded-full">
                                            <span>≈ USD</span>
                                            <AnimatedNumber value={totalExpenseInUSD} duration={1200} />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Activity Section */}
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

                            <ActivityList
                                recentTransactions={normalizedTransactions.slice(0, 10)}
                                workspaceId={currentWorkspace.id}
                                accounts={accounts}
                                categories={categories}
                                currencies={currencies}
                                quickConcepts={quickConcepts}
                                preferredCurrency={preferredCurrency}
                                isShared={(currentWorkspace as any).memberCount > 1}
                            />
                        </div>
                    </div>

                    {/* PC Right Column: Expenses Distribution (1/4 width) */}
                    <div className="col-span-1">
                        <ExpensesDistribution
                            transactions={normalizedTransactions}
                            preferredCurrency={preferredCurrency}
                        />
                    </div>
                </div>

                {/* 2. Mobile Layout (1 Column: Cards -> Carousel -> Activity) */}
                <div className="lg:hidden flex flex-col space-y-6">
                    {/* Tighter Sub-container to group cards and stats slider */}
                    <div className="flex flex-col space-y-2.5">
                        {/* Mobile Monthly Income/Expense Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Income Card */}
                            <Card className="relative overflow-hidden group border-none shadow-sm p-3 flex flex-col justify-center min-h-[70px] gap-0">
                                <div className="absolute top-1.5 right-1.5 p-1 opacity-5">
                                    <TrendingUp className="w-8 h-8 text-emerald-500" />
                                </div>
                                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-none">Ingresos</span>
                                <div className="text-xl xs:text-2xl font-black flex items-baseline gap-0.5 flex-wrap mt-0.5 leading-none">
                                    <span className="text-xs text-emerald-600 opacity-70 font-bold leading-none">+</span>
                                    <AnimatedNumber value={totalIncome} />
                                </div>
                                {preferredCurrency !== "USD" && (
                                    <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-0.5 font-bold leading-none">
                                        <span>≈ USD </span>
                                        <AnimatedNumber value={totalIncomeInUSD} duration={1200} />
                                    </div>
                                )}
                            </Card>

                            {/* Expense Card */}
                            <Card className="relative overflow-hidden group border-none shadow-sm p-3 flex flex-col justify-center min-h-[70px] gap-0">
                                <div className="absolute top-1.5 right-1.5 p-1 opacity-5">
                                    <TrendingDown className="w-8 h-8 text-rose-500" />
                                </div>
                                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-none">Gastos</span>
                                <div className="text-xl xs:text-2xl font-black text-rose-600 flex items-baseline gap-0.5 flex-wrap mt-0.5 leading-none">
                                    <span className="text-xs opacity-70 font-bold leading-none">-</span>
                                    <AnimatedNumber value={totalExpense} />
                                </div>
                                {preferredCurrency !== "USD" && (
                                    <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-0.5 font-bold leading-none">
                                        <span>≈ USD </span>
                                        <AnimatedNumber value={totalExpenseInUSD} duration={1200} />
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Mobile Stats Carousel (Capacidad de Ahorro / Distribución de Gastos) */}
                        <MobileStatsCarousel
                            transactions={normalizedTransactions}
                            preferredCurrency={preferredCurrency}
                        />
                    </div>

                    {/* Mobile Activity List */}
                    <div className="space-y-4">
                        <div className="flex flex-col gap-3">
                            <div className="space-y-0.5 text-center">
                                <h3 className="text-xl font-bold tracking-tight">Actividad</h3>
                                <p className="text-zinc-500 text-xs">Transacciones registradas en este período</p>
                            </div>
                            <div className="flex justify-center w-full">
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
                        </div>

                        <ActivityList
                            recentTransactions={normalizedTransactions.slice(0, 10)}
                            workspaceId={currentWorkspace.id}
                            accounts={accounts}
                            categories={categories}
                            currencies={currencies}
                            quickConcepts={quickConcepts}
                            preferredCurrency={preferredCurrency}
                            isShared={(currentWorkspace as any).memberCount > 1}
                        />
                    </div>
                </div>

            </main>
        </div>
    )
}
