"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { InvestmentDashboardData } from "@/app/actions/investments"
import { InvestmentKPIs } from "@/components/investments/investment-kpis"
import { CategoryPerformanceSummary } from "@/components/investments/category-performance-summary"
import { HoldingsList } from "@/components/investments/holdings-list"
import { InvestmentHistory } from "@/components/investments/investment-history"
import { InvestmentModal } from "@/components/investments/investment-modal"
import { ManageCategoriesModal } from "@/components/investments/manage-categories-modal"
import { UpdateAssetPriceModal, UpdatePriceAssetData } from "@/components/investments/update-asset-price-modal"
import { PullToRefresh } from "@/components/investments/pull-to-refresh"
import { Button } from "@/components/ui/button"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import { UserNav } from "@/components/user-nav"
import { ThemeSync } from "@/components/theme-sync"
import { NotificationBell } from "@/components/notification-bell"
import { ActiveWorkspaceTracker } from "@/components/active-workspace-tracker"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { PrivacyToggle } from "@/components/privacy-provider"
import { InvestmentCurrencyProvider } from "@/components/investments/investment-currency-provider"
import { InvestmentCurrencyToggle } from "@/components/investments/investment-currency-toggle"
import { Skeleton } from "@/components/ui/skeleton"
import { triggerHaptic } from "@/lib/haptics"
import { Plus, TrendingUp, LayoutDashboard, Layers } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Dynamic lazy imports for heavy Recharts modules to minimize initial JS bundle size
const PortfolioChart = dynamic(
    () => import("@/components/investments/portfolio-chart").then((mod) => mod.PortfolioChart),
    {
        ssr: false,
        loading: () => <Skeleton className="h-80 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-850" />,
    }
)

const AssetAllocationDonut = dynamic(
    () => import("@/components/investments/asset-allocation-donut").then((mod) => mod.AssetAllocationDonut),
    {
        ssr: false,
        loading: () => <Skeleton className="h-80 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-850" />,
    }
)

interface InvestmentsClientViewProps {
    initialData: InvestmentDashboardData
    userWorkspaces: { id: string; name: string; baseCurrency: string; ownerId: string; memberCount: number }[]
    allCurrencies: any[]
    userData: any
    currentWorkspaceId: string
    timeRange: string
}

export function InvestmentsClientView({
    initialData,
    userWorkspaces,
    allCurrencies,
    userData,
    currentWorkspaceId,
    timeRange: initialTimeRange,
}: InvestmentsClientViewProps) {
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [isCategoriesModalOpen, setIsCategoriesModalOpen] = React.useState(false)
    const [updatePriceAsset, setUpdatePriceAsset] = React.useState<UpdatePriceAssetData | null>(null)
    const [timeRange, setTimeRange] = React.useState(initialTimeRange || "1M")

    const handleRangeChange = (newRange: string) => {
        setTimeRange(newRange)
        router.push(`/investments?workspaceId=${currentWorkspaceId}&range=${newRange}`)
    }

    const currentWorkspace = userWorkspaces.find((w) => w.id === currentWorkspaceId) || userWorkspaces[0]
    const baseCurrency = currentWorkspace?.baseCurrency || "USD"

    return (
        <InvestmentCurrencyProvider baseCurrency={baseCurrency}>
            <PullToRefresh>
                <div className="flex flex-col min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
                    {/* Syncers & Trackers */}
                    <ThemeSync savedTheme={userData.theme} />
                    <ActiveWorkspaceTracker workspaceId={currentWorkspace.id} />

                    {/* Main Area */}
                    <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
                        {/* Header */}
                        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 px-3 sm:gap-4 sm:px-6 border-b bg-white/80 backdrop-blur-md dark:bg-zinc-900/80">
                            <div className="flex items-center gap-1.5 sm:gap-3">
                                <WorkspaceSwitcher
                                    workspaces={userWorkspaces}
                                    currentWorkspaceId={currentWorkspace.id}
                                    currencies={allCurrencies}
                                    userId={userData.id}
                                />
                            </div>

                            {/* Desktop Navigation Tabs */}
                            <div className="hidden md:flex items-center gap-1 ml-4 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
                                <Link
                                    href={`/dashboard?workspaceId=${currentWorkspace.id}`}
                                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 active:scale-95 transition-all duration-100 touch-manipulation cursor-pointer"
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    Gastos & Flujo
                                </Link>
                                <Link
                                    href={`/investments?workspaceId=${currentWorkspace.id}`}
                                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-xs active:scale-95 transition-all duration-100 touch-manipulation cursor-pointer"
                                >
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                    Inversiones
                                </Link>
                            </div>

                            <div className="ml-auto flex items-center gap-1 sm:gap-2.5">
                                {/* Privacy Mode Toggle */}
                                <PrivacyToggle />

                                {/* Notifications */}
                                <NotificationBell />

                                {/* User Nav */}
                                <UserNav
                                    user={userData}
                                    currencies={allCurrencies}
                                    workspaces={userWorkspaces}
                                    currentWorkspaceId={currentWorkspace.id}
                                />
                            </div>
                        </header>

                        {/* Page Content */}
                        <main className="flex-1 p-3 sm:p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
                            {/* Top Action Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                                <div>
                                    <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                                        Portafolio de Inversiones
                                    </h1>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        Seguimiento en vivo de Cripto, Acciones de USA, CEDEARs y FCIs
                                    </p>
                                </div>

                                {/* Controls grouped together */}
                                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                                    <InvestmentCurrencyToggle showLabel={true} labelText="Moneda a mostrar:" />

                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            triggerHaptic("light")
                                            setIsCategoriesModalOpen(true)
                                        }}
                                        className="gap-1.5 text-xs h-9 px-3 font-semibold active:scale-95 transition-all duration-100 touch-manipulation cursor-pointer"
                                        title="Gestionar categorías del portafolio"
                                    >
                                        <Layers className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Categorías</span>
                                    </Button>

                                    <Button
                                        onClick={() => {
                                            triggerHaptic("light")
                                            setIsModalOpen(true)
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs h-9 px-3.5 font-semibold shadow-xs active:scale-95 transition-all duration-100 touch-manipulation cursor-pointer hidden sm:flex"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Nueva Inversión
                                    </Button>
                                </div>
                            </div>

                            {/* 1. KPIs */}
                            <InvestmentKPIs
                                totalValue={initialData.totalPortfolioValue}
                                totalInvested={initialData.totalInvestedCost}
                                totalPnLAmount={initialData.totalPnLAmount}
                                totalPnLPct={initialData.totalPnLPct}
                                totalValueUSD={initialData.totalPortfolioValueUSD}
                                totalInvestedUSD={initialData.totalInvestedCostUSD}
                                totalPnLAmountUSD={initialData.totalPnLAmountUSD}
                                totalPnLPctUSD={initialData.totalPnLPctUSD}
                                baseCurrency={baseCurrency}
                                activeHoldingsCount={initialData.holdings.length}
                            />

                            {/* 2. Category Performance Summary */}
                            <CategoryPerformanceSummary holdings={initialData.holdings} />

                            {/* 3. Charts Row (Evolution Chart & Donut Allocation) */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <PortfolioChart
                                        chartPoints={initialData.chartPoints}
                                        baseCurrency={baseCurrency}
                                        currentValue={initialData.totalPortfolioValue}
                                        investedCost={initialData.totalInvestedCost}
                                        totalPnLAmount={initialData.totalPnLAmount}
                                        totalPnLPct={initialData.totalPnLPct}
                                        currentValueUSD={initialData.totalPortfolioValueUSD}
                                        investedCostUSD={initialData.totalInvestedCostUSD}
                                        totalPnLAmountUSD={initialData.totalPnLAmountUSD}
                                        totalPnLPctUSD={initialData.totalPnLPctUSD}
                                        selectedRange={timeRange}
                                        onRangeChange={handleRangeChange}
                                    />
                                </div>

                                <div className="lg:col-span-1">
                                    <AssetAllocationDonut
                                        assetAllocation={initialData.assetAllocation}
                                        categoryAllocation={initialData.categoryAllocation}
                                        baseCurrency={baseCurrency}
                                        totalValue={initialData.totalPortfolioValue}
                                        totalValueUSD={initialData.totalPortfolioValueUSD}
                                    />
                                </div>
                            </div>

                            {/* 4. Active Holdings Table/Cards */}
                            <HoldingsList
                                holdings={initialData.holdings}
                                baseCurrency={baseCurrency}
                                onUpdatePrice={setUpdatePriceAsset}
                            />

                            {/* 5. History */}
                            <InvestmentHistory
                                transactions={initialData.recentTransactions}
                                workspaceId={currentWorkspace.id}
                                baseCurrency={baseCurrency}
                                categories={initialData.categories}
                            />
                        </main>
                    </div>

                    {/* Mobile Bottom Navigation with Quick Action Button */}
                    <MobileBottomNav
                        currentWorkspaceId={currentWorkspace.id}
                        onQuickActionClick={() => setIsModalOpen(true)}
                    />

                    {/* Investment Modal */}
                    <InvestmentModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        workspaceId={currentWorkspace.id}
                        availableAssets={initialData.availableAssets}
                        userWorkspaces={userWorkspaces}
                        baseCurrency={baseCurrency}
                        categories={initialData.categories}
                    />

                    {/* Manage Categories Modal */}
                    <ManageCategoriesModal
                        isOpen={isCategoriesModalOpen}
                        onClose={() => setIsCategoriesModalOpen(false)}
                        workspaceId={currentWorkspace.id}
                        categories={initialData.categories || []}
                    />

                    {/* Manual Price / Valuation Update Modal */}
                    <UpdateAssetPriceModal
                        isOpen={!!updatePriceAsset}
                        onClose={() => setUpdatePriceAsset(null)}
                        workspaceId={currentWorkspace.id}
                        asset={updatePriceAsset}
                    />
                </div>
            </PullToRefresh>
        </InvestmentCurrencyProvider>
    )
}
