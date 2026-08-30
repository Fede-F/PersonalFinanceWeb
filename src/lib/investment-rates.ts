import { db } from "@/db"
import { assetMarketPrices, assetPriceHistory } from "@/db/schema"
import { eq, inArray, sql, and, gte, desc } from "drizzle-orm"

const COINGECKO_MAP: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    USDT: "tether",
    BNB: "binancecoin",
    XRP: "ripple",
    ADA: "cardano",
}

const REVERSE_COINGECKO_MAP: Record<string, string> = Object.entries(COINGECKO_MAP).reduce(
    (acc, [sym, id]) => {
        acc[id] = sym
        return acc
    },
    {} as Record<string, string>
)

interface AssetPriceInfo {
    symbol: string
    price: number
    currency: string
    change24hPct?: number
    name?: string
}

/**
 * Fetches live prices for cryptocurrencies from CoinGecko
 */
async function fetchCryptoPrices(symbols: string[]): Promise<AssetPriceInfo[]> {
    const cryptoSymbols = symbols.filter((s) => COINGECKO_MAP[s.toUpperCase()])
    if (cryptoSymbols.length === 0) return []

    const ids = cryptoSymbols.map((s) => COINGECKO_MAP[s.toUpperCase()]).join(",")
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`

    try {
        const res = await fetch(url, {
            headers: { Accept: "application/json" },
            next: { revalidate: 300 }, // 5 min cache
        })
        if (!res.ok) {
            console.warn(`CoinGecko fetch failed with status: ${res.status}`)
            return []
        }

        const data = await res.json()
        const results: AssetPriceInfo[] = []

        for (const [id, val] of Object.entries(data as Record<string, { usd?: number; usd_24h_change?: number }>)) {
            const sym = REVERSE_COINGECKO_MAP[id]
            if (sym && typeof val.usd === "number") {
                results.push({
                    symbol: sym,
                    price: val.usd,
                    currency: "USD",
                    change24hPct: val.usd_24h_change,
                })
            }
        }

        return results
    } catch (err) {
        console.error("Error fetching crypto prices from CoinGecko:", err)
        return []
    }
}

/**
 * Fetches quote data from Yahoo Finance for Stocks, ETFs and CEDEARs
 */
async function fetchStockPrices(symbols: string[]): Promise<AssetPriceInfo[]> {
    const nonCryptoSymbols = symbols.filter((s) => !COINGECKO_MAP[s.toUpperCase()])
    if (nonCryptoSymbols.length === 0) return []

    const results: AssetPriceInfo[] = []

    // Fetch in parallel for symbols
    await Promise.allSettled(
        nonCryptoSymbols.map(async (symbol) => {
            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`
                const res = await fetch(url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        Accept: "application/json",
                    },
                    next: { revalidate: 300 },
                })

                if (!res.ok) {
                    console.warn(`Yahoo Finance chart fetch failed for ${symbol}: ${res.status}`)
                    return
                }

                const data = await res.json()
                const result = data?.chart?.result?.[0]
                if (!result) return

                const meta = result.meta
                const currentPrice = meta.regularMarketPrice ?? meta.previousClose
                const previousClose = meta.chartPreviousClose ?? meta.previousClose

                let change24hPct: number | undefined
                if (currentPrice && previousClose && previousClose > 0) {
                    change24hPct = ((currentPrice - previousClose) / previousClose) * 100
                }

                const currency = meta.currency || (symbol.endsWith(".BA") ? "ARS" : "USD")

                if (typeof currentPrice === "number" && !isNaN(currentPrice)) {
                    results.push({
                        symbol,
                        price: currentPrice,
                        currency: currency.toUpperCase(),
                        change24hPct,
                        name: meta.shortName || meta.symbol,
                    })
                }
            } catch (err) {
                console.error(`Error fetching Yahoo quote for ${symbol}:`, err)
            }
        })
    )

    return results
}

/**
 * Fetches historical daily prices for a given symbol from Yahoo Finance or CoinGecko
 */
export async function fetchHistoricalDailyPrices(symbol: string, days = 90): Promise<{ date: string; closePrice: number; currency: string }[]> {
    const isCrypto = !!COINGECKO_MAP[symbol.toUpperCase()]
    const results: { date: string; closePrice: number; currency: string }[] = []

    if (isCrypto) {
        const id = COINGECKO_MAP[symbol.toUpperCase()]
        try {
            const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=daily`
            const res = await fetch(url, {
                headers: { Accept: "application/json" },
                next: { revalidate: 3600 },
            })
            if (res.ok) {
                const data = await res.json()
                const prices: [number, number][] = data.prices || []
                for (const [timestampMs, price] of prices) {
                    const d = new Date(timestampMs)
                    const dateStr = d.toISOString().split("T")[0]
                    results.push({
                        date: dateStr,
                        closePrice: price,
                        currency: "USD",
                    })
                }
            }
        } catch (err) {
            console.error(`Error fetching crypto history for ${symbol}:`, err)
        }
    } else {
        try {
            const range = days <= 30 ? "1mo" : days <= 90 ? "3mo" : days <= 180 ? "6mo" : "1y"
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`
            const res = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    Accept: "application/json",
                },
                next: { revalidate: 3600 },
            })

            if (res.ok) {
                const data = await res.json()
                const result = data?.chart?.result?.[0]
                if (result) {
                    const timestamps: number[] = result.timestamp || []
                    const quotes = result.indicators?.quote?.[0]?.close || []
                    const currency = (result.meta?.currency || (symbol.endsWith(".BA") ? "ARS" : "USD")).toUpperCase()

                    for (let i = 0; i < timestamps.length; i++) {
                        const ts = timestamps[i]
                        const close = quotes[i]
                        if (ts && typeof close === "number" && !isNaN(close)) {
                            const dateStr = new Date(ts * 1000).toISOString().split("T")[0]
                            results.push({
                                date: dateStr,
                                closePrice: close,
                                currency,
                            })
                        }
                    }
                }
            }
        } catch (err) {
            console.error(`Error fetching stock history for ${symbol}:`, err)
        }
    }

    // Save fetched historical daily points to DB
    if (results.length > 0) {
        try {
            const valuesToInsert = results.map((r) => ({
                symbol,
                date: r.date,
                closePrice: r.closePrice.toFixed(6),
                currency: r.currency,
            }))

            await db
                .insert(assetPriceHistory)
                .values(valuesToInsert)
                .onConflictDoUpdate({
                    target: [assetPriceHistory.symbol, assetPriceHistory.date],
                    set: {
                        closePrice: sql`excluded.close_price`,
                        currency: sql`excluded.currency`,
                    },
                })
        } catch (err) {
            console.error(`Error persisting price history for ${symbol}:`, err)
        }
    }

    return results
}

/**
 * Gets live prices for symbols, using DB cache (15min TTL) and background refresh
 */
export async function getOrUpdateAssetPrices(
    symbols: string[]
): Promise<Record<string, { price: number; currency: string; change24hPct?: number; name?: string }>> {
    if (symbols.length === 0) return {}

    const uniqueSymbols = Array.from(new Set(symbols.map((s) => s.toUpperCase())))

    // 1. Fetch current cached prices from DB
    const cachedRows = await db
        .select()
        .from(assetMarketPrices)
        .where(inArray(assetMarketPrices.symbol, uniqueSymbols))

    const resultMap: Record<string, { price: number; currency: string; change24hPct?: number; name?: string }> = {}
    const expiredSymbols: string[] = []
    const now = Date.now()
    const fifteenMinutes = 15 * 60 * 1000

    const cachedMap = new Map<string, typeof cachedRows[0]>()
    for (const row of cachedRows) {
        cachedMap.set(row.symbol.toUpperCase(), row)
        resultMap[row.symbol.toUpperCase()] = {
            price: parseFloat(row.price),
            currency: row.currency,
            change24hPct: row.change24hPct ? parseFloat(row.change24hPct) : undefined,
            name: row.name || undefined,
        }
    }

    for (const sym of uniqueSymbols) {
        const cached = cachedMap.get(sym)
        if (!cached || now - new Date(cached.lastUpdated).getTime() > fifteenMinutes) {
            expiredSymbols.push(sym)
        }
    }

    // 2. If there are expired/missing symbols, fetch and update in DB
    if (expiredSymbols.length > 0) {
        // Run update asynchronously
        const updatePromise = (async () => {
            try {
                const [cryptoResults, stockResults] = await Promise.all([
                    fetchCryptoPrices(expiredSymbols),
                    fetchStockPrices(expiredSymbols),
                ])

                const allFetched = [...cryptoResults, ...stockResults]
                const todayStr = new Date().toISOString().split("T")[0]

                if (allFetched.length > 0) {
                    const priceInserts = allFetched.map((p) => ({
                        symbol: p.symbol,
                        name: p.name,
                        price: p.price.toFixed(6),
                        currency: p.currency,
                        change24hPct: p.change24hPct ? p.change24hPct.toFixed(4) : null,
                        lastUpdated: new Date(),
                    }))

                    await db
                        .insert(assetMarketPrices)
                        .values(priceInserts)
                        .onConflictDoUpdate({
                            target: [assetMarketPrices.symbol],
                            set: {
                                price: sql`excluded.price`,
                                currency: sql`excluded.currency`,
                                change24hPct: sql`excluded.change_24h_pct`,
                                lastUpdated: sql`excluded.last_updated`,
                            },
                        })

                    // Also record today's closing snapshot in history
                    const historyInserts = allFetched.map((p) => ({
                        symbol: p.symbol,
                        date: todayStr,
                        closePrice: p.price.toFixed(6),
                        currency: p.currency,
                    }))

                    await db
                        .insert(assetPriceHistory)
                        .values(historyInserts)
                        .onConflictDoUpdate({
                            target: [assetPriceHistory.symbol, assetPriceHistory.date],
                            set: {
                                closePrice: sql`excluded.close_price`,
                                currency: sql`excluded.currency`,
                            },
                        })
                }
            } catch (err) {
                console.error("Error during background asset prices update:", err)
            }
        })()

        // If some symbols had never been fetched, await the promise so we have initial data
        const hasUncachedSymbols = expiredSymbols.some((s) => !cachedMap.has(s))
        if (hasUncachedSymbols) {
            await updatePromise
            // Refresh results map after update
            const freshRows = await db
                .select()
                .from(assetMarketPrices)
                .where(inArray(assetMarketPrices.symbol, uniqueSymbols))

            for (const row of freshRows) {
                resultMap[row.symbol.toUpperCase()] = {
                    price: parseFloat(row.price),
                    currency: row.currency,
                    change24hPct: row.change24hPct ? parseFloat(row.change24hPct) : undefined,
                    name: row.name || undefined,
                }
            }
        }
    }

    return resultMap
}

/**
 * Gets daily price history for an asset from DB or API
 */
export async function getAssetHistory(symbol: string, days = 30): Promise<{ date: string; closePrice: number; currency: string }[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split("T")[0]

    // Query DB for existing daily points
    const historyRows = await db
        .select()
        .from(assetPriceHistory)
        .where(and(eq(assetPriceHistory.symbol, symbol.toUpperCase()), gte(assetPriceHistory.date, startDateStr)))
        .orderBy(assetPriceHistory.date)

    if (historyRows.length >= Math.min(days * 0.5, 10)) {
        return historyRows.map((r) => ({
            date: r.date,
            closePrice: parseFloat(r.closePrice),
            currency: r.currency,
        }))
    }

    // Otherwise fetch from API and cache
    return await fetchHistoricalDailyPrices(symbol, days)
}

export interface MarketSearchResult {
    id?: string
    symbol: string
    name: string
    assetType: "CRYPTO" | "STOCK" | "ETF" | "CEDEAR" | "BOND" | "OTHER"
    defaultCurrency: string
    currentPrice?: number
    change24hPct?: number
    isRecent?: boolean
    isLocal?: boolean
}

/**
 * Searches online market assets via Yahoo Finance and CoinGecko
 */
export async function searchOnlineMarketAssets(query: string): Promise<MarketSearchResult[]> {
    const q = query.trim()
    if (!q) return []

    const results: MarketSearchResult[] = []
    const seenSymbols = new Set<string>()

    // 1. Yahoo Finance Search (Stocks, ETFs, CEDEARs)
    const yahooPromise = (async () => {
        try {
            const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`
            const res = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    Accept: "application/json",
                },
                next: { revalidate: 300 },
            })

            if (res.ok) {
                const data = await res.json()
                const quotes: any[] = data.quotes || []
                for (const item of quotes) {
                    const sym = item.symbol?.toUpperCase()
                    if (!sym || seenSymbols.has(sym)) continue
                    seenSymbols.add(sym)

                    let assetType: "CRYPTO" | "STOCK" | "ETF" | "CEDEAR" | "BOND" | "OTHER" = "STOCK"
                    let currency = "USD"

                    if (sym.endsWith(".BA") || item.exchange === "BUE") {
                        assetType = sym.includes("SPY") || sym.includes("QQQ") || sym.includes("AAPL") || sym.includes("NVDA") || sym.includes("MELI") || sym.includes("KO")
                            ? "CEDEAR"
                            : "STOCK"
                        currency = "ARS"
                    } else if (item.quoteType === "ETF") {
                        assetType = "ETF"
                        currency = "USD"
                    } else if (item.quoteType === "CRYPTOCURRENCY") {
                        assetType = "CRYPTO"
                        currency = "USD"
                    }

                    results.push({
                        symbol: sym,
                        name: item.shortname || item.longname || sym,
                        assetType,
                        defaultCurrency: currency,
                    })
                }
            }
        } catch (err) {
            console.error("Error searching Yahoo Finance:", err)
        }
    })()

    // 2. CoinGecko Search (Crypto)
    const coinGeckoPromise = (async () => {
        try {
            const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`
            const res = await fetch(url, {
                headers: { Accept: "application/json" },
                next: { revalidate: 300 },
            })

            if (res.ok) {
                const data = await res.json()
                const coins: any[] = (data.coins || []).slice(0, 5)
                for (const coin of coins) {
                    const sym = coin.symbol?.toUpperCase()
                    if (!sym || seenSymbols.has(sym)) continue
                    seenSymbols.add(sym)

                    results.push({
                        symbol: sym,
                        name: coin.name || sym,
                        assetType: "CRYPTO",
                        defaultCurrency: "USD",
                    })
                }
            }
        } catch (err) {
            console.error("Error searching CoinGecko:", err)
        }
    })()

    await Promise.allSettled([yahooPromise, coinGeckoPromise])

    // 3. Populate live prices from cache/online for top candidates
    const symbolsToPrice = results.slice(0, 8).map((r) => r.symbol)
    if (symbolsToPrice.length > 0) {
        const prices = await getOrUpdateAssetPrices(symbolsToPrice)
        for (const item of results) {
            const priceData = prices[item.symbol.toUpperCase()]
            if (priceData) {
                item.currentPrice = priceData.price
                item.defaultCurrency = priceData.currency || item.defaultCurrency
                item.change24hPct = priceData.change24hPct
            }
        }
    }

    return results
}
