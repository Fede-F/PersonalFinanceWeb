import 'dotenv/config';
import { db } from "./index";
import { users, workspaces, workspaceMembers, supportedCurrencies, marketRates } from "./schema";

async function main() {
    console.log("🌱 Seeding database...");

    // 1. Seed Currencies
    console.log("Inserting supported currencies...");
    await db.insert(supportedCurrencies).values([
        { code: "USD", name: "US Dollar", type: "FIAT" },
        { code: "ARS", name: "Argentine Peso", type: "FIAT" },
        { code: "BRL", name: "Brazilian Real", type: "FIAT" },
        { code: "EUR", name: "Euro", type: "FIAT" },
    ]).onConflictDoNothing();

    // 2. Seed Mock Market Rates (for currency conversion)
    console.log("Inserting mock market rates...");
    const now = new Date()
    await db.insert(marketRates).values([
        { baseCurrency: "USD", targetCurrency: "ARS", rate: "950.00", date: now },
        { baseCurrency: "EUR", targetCurrency: "ARS", rate: "1020.00", date: now },
        { baseCurrency: "BRL", targetCurrency: "ARS", rate: "175.00", date: now },
        
        // Reverse rates
        { baseCurrency: "ARS", targetCurrency: "USD", rate: (1 / 950).toFixed(10), date: now },
        { baseCurrency: "ARS", targetCurrency: "EUR", rate: (1 / 1020).toFixed(10), date: now },
        { baseCurrency: "ARS", targetCurrency: "BRL", rate: (1 / 175).toFixed(10), date: now },
    ]).onConflictDoNothing();

    // 3. Seed Test User
    console.log("Inserting test user...");
    const [testUser] = await db.insert(users).values({
        email: "test@example.com",
        name: "Test User",
    }).onConflictDoNothing().returning();

    if (testUser) {
        // 4. Seed Personal Workspace
        console.log("Inserting personal workspace...");
        const [testWorkspace] = await db.insert(workspaces).values({
            name: "Mi Hogar",
            ownerId: testUser.id,
            baseCurrency: "ARS",
        }).returning();

        // 5. Join user to workspace as OWNER
        console.log("Joining user to workspace...");
        await db.insert(workspaceMembers).values({
            workspaceId: testWorkspace.id,
            userId: testUser.id,
            role: "OWNER",
        });
    }

    console.log("✅ Seeding finished!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed!");
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        process.exit(0);
    });
