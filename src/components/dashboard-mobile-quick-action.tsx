"use client"

import * as React from "react"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { TransactionModal } from "@/components/transaction-modal"

interface DashboardMobileQuickActionProps {
    workspaceId: string
    accounts: any[]
    categories: any[]
    currencies: any[]
    quickConcepts: string[]
    defaultCurrency?: string
    userDefaultCurrency?: string
}

export function DashboardMobileQuickAction({
    workspaceId,
    accounts,
    categories,
    currencies,
    quickConcepts,
    defaultCurrency,
    userDefaultCurrency,
}: DashboardMobileQuickActionProps) {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <>
            {/* Modal triggered by mobile bottom navigation */}
            <TransactionModal
                workspaceId={workspaceId}
                accounts={accounts}
                categories={categories}
                currencies={currencies}
                quickConcepts={quickConcepts}
                defaultCurrency={defaultCurrency}
                userDefaultCurrency={userDefaultCurrency}
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                hideTrigger={true}
            />

            {/* Mobile Bottom Navigation Bar with '+' click handler */}
            <MobileBottomNav
                currentWorkspaceId={workspaceId}
                onQuickActionClick={() => setIsOpen(true)}
            />
        </>
    )
}
