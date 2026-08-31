import "dotenv/config"
import { db } from "./index"
import { investmentAssets } from "./schema"
import { eq } from "drizzle-orm"

async function main() {
    console.log("Checking and updating FCI asset symbols in database...")

    const allAssets = await db.select().from(investmentAssets)
    console.log(
        "Current assets in DB:",
        allAssets.map((a) => ({ id: a.id, symbol: a.symbol, name: a.name, type: a.assetType }))
    )

    for (const a of allAssets) {
        if (
            a.symbol === "DEL-MUL-I-A" ||
            a.symbol.includes("MUL") ||
            a.name.toLowerCase().includes("multimercado")
        ) {
            console.log(`Updating asset ${a.id} (${a.symbol} - ${a.name}) -> RJMULIA`)
            await db
                .update(investmentAssets)
                .set({
                    symbol: "RJMULIA",
                    name: "RJ Delta Multimercado - Clase A",
                    assetType: "FCI",
                    defaultCurrency: "ARS",
                })
                .where(eq(investmentAssets.id, a.id))
        }

        if (
            a.symbol === "CMAACCIONE" ||
            (a.assetType === "FCI" && a.name.toLowerCase().includes("cma acciones"))
        ) {
            console.log(`Updating asset ${a.id} (${a.symbol} - ${a.name}) -> DFSACCA`)
            await db
                .update(investmentAssets)
                .set({
                    symbol: "DFSACCA",
                    name: "CMA Acciones - Clase A",
                    assetType: "FCI",
                    defaultCurrency: "ARS",
                })
                .where(eq(investmentAssets.id, a.id))
        }
    }

    console.log("Migration completed successfully!")
    process.exit(0)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
