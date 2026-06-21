import { db } from "@/db"
import { marketRates } from "@/db/schema"
import { desc } from "drizzle-orm"

export async function updateMarketRates() {
    try {
        console.log("Fetching live exchange rates from ExchangeRate-API...")
        const res = await fetch("https://open.er-api.com/v6/latest/USD")
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        
        const data = await res.json()
        if (data.result !== "success" || !data.rates) {
            throw new Error("Invalid response from exchange rates API")
        }

        const currencies = ["USD", "ARS", "BRL", "EUR"]
        const rates = data.rates
        const now = new Date()
        const valuesToInsert = []

        for (const base of currencies) {
            for (const target of currencies) {
                if (base === target) continue
                const baseRate = rates[base]
                const targetRate = rates[target]
                if (baseRate && targetRate) {
                    const calculatedRate = targetRate / baseRate
                    valuesToInsert.push({
                        baseCurrency: base,
                        targetCurrency: target,
                        rate: calculatedRate.toFixed(10),
                        date: now
                    })
                }
            }
        }

        if (valuesToInsert.length > 0) {
            await db.insert(marketRates).values(valuesToInsert)
            console.log(`Successfully updated ${valuesToInsert.length} global market rates.`)
        }
        return { success: true }
    } catch (err: any) {
        console.error("Error updating market rates:", err)
        return { success: false, error: err.message || err }
    }
}

export async function checkAndUpdateRates() {
    try {
        // Query the latest rate recorded globally
        const [latestRate] = await db
            .select()
            .from(marketRates)
            .orderBy(desc(marketRates.date))
            .limit(1)

        const twelveHours = 12 * 60 * 60 * 1000 // 12 hours in ms
        const now = Date.now()

        // If no rates exist or the latest rate is older than 12 hours, trigger update
        if (!latestRate || (now - new Date(latestRate.date).getTime()) > twelveHours) {
            // Update asynchronously in the background so it doesn't block the user's request
            updateMarketRates().catch(err => {
                console.error("Background market rates update failed:", err)
            })
        }
    } catch (err) {
        console.error("Error checking exchange rates status:", err)
    }
}
