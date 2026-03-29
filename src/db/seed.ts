import 'dotenv/config';
import { db } from "./index";
import { users, workspaces, workspaceMembers, supportedCurrencies } from "./schema";

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

    // 2. Seed Test User
    console.log("Inserting test user...");
    const [testUser] = await db.insert(users).values({
        email: "test@example.com",
        name: "Test User",
    }).returning();

    // 3. Seed Personal Workspace
    console.log("Inserting personal workspace...");
    const [testWorkspace] = await db.insert(workspaces).values({
        name: "Mi Hogar",
        ownerId: testUser.id,
        baseCurrency: "ARS",
    }).returning();

    // 4. Join user to workspace as OWNER
    console.log("Joining user to workspace...");
    await db.insert(workspaceMembers).values({
        workspaceId: testWorkspace.id,
        userId: testUser.id,
        role: "OWNER",
    });

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
