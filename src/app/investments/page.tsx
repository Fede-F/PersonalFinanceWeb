import { auth } from "@/auth"
import { db } from "@/db"
import { workspaces, workspaceMembers, supportedCurrencies, users } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { redirect } from "next/navigation"
import { getInvestmentsDashboardData } from "@/app/actions/investments"
import { InvestmentsClientView } from "./investments-client-view"
import { LayoutDashboard } from "lucide-react"
import { Card } from "@/components/ui/card"
import { CreateWorkspaceForm } from "@/components/create-workspace-form"

export default async function InvestmentsPage(props: {
    searchParams: Promise<{ workspaceId?: string; range?: string }>
}) {
    const searchParams = await props.searchParams
    const timeRange = searchParams.range || "1M"

    const session = await auth()
    if (!session?.user?.id) redirect("/")

    // Fetch user details for profile / theme
    const [userData] = await db.select().from(users).where(eq(users.id, session.user.id))

    // Fetch user memberships
    const userMemberships = await db
        .select({
            id: workspaces.id,
            name: workspaces.name,
            baseCurrency: workspaces.baseCurrency,
            ownerId: workspaces.ownerId,
            memberCount: sql<number>`(SELECT count(*)::int FROM workspace_members WHERE workspace_members.workspace_id = workspaces.id)`,
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
                    <p className="text-zinc-500">Crea tu primer Workspace para comenzar.</p>
                    <Card className="p-6 border-none shadow-xl bg-white/50 backdrop-blur-sm">
                        <CreateWorkspaceForm currencies={allCurrencies} />
                    </Card>
                </div>
            </div>
        )
    }

    let selectedWorkspaceId = searchParams.workspaceId
    if (!selectedWorkspaceId && userData.lastActiveWorkspaceId) {
        const stillMember = userMemberships.some((w) => w.id === userData.lastActiveWorkspaceId)
        if (stillMember) {
            selectedWorkspaceId = userData.lastActiveWorkspaceId
        }
    }
    if (!selectedWorkspaceId) {
        selectedWorkspaceId = userMemberships[0].id
    }

    const { data: dashboardData, error } = await getInvestmentsDashboardData(
        selectedWorkspaceId,
        timeRange
    )

    if (!dashboardData) {
        return (
            <div className="p-8 text-center text-rose-500">
                {error || "Error al cargar datos del módulo de inversiones"}
            </div>
        )
    }

    return (
        <InvestmentsClientView
            initialData={dashboardData}
            userWorkspaces={userMemberships}
            allCurrencies={allCurrencies}
            userData={userData}
            currentWorkspaceId={selectedWorkspaceId}
            timeRange={timeRange}
        />
    )
}
