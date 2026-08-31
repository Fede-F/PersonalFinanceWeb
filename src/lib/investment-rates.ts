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
 * Fetches live prices for cryptocurrencies using Binance API with CoinGecko and Yahoo Finance fallback
 */
async function fetchCryptoPrices(symbols: string[]): Promise<AssetPriceInfo[]> {
    if (symbols.length === 0) return []

    const results: AssetPriceInfo[] = []
    const pendingSymbols = new Set(symbols.map((s) => s.toUpperCase()))

    // 1. Primary Source: Binance (Ultra-fast, real-time, no strict rate limits)
    await Promise.allSettled(
        Array.from(pendingSymbols).map(async (sym) => {
            try {
                let binancePair = ""
                let currency = "USD"

                if (sym.endsWith("-BTC")) {
                    binancePair = sym.replace("-BTC", "") + "BTC"
                    currency = "BTC"
                } else if (sym.endsWith("-ETH")) {
                    binancePair = sym.replace("-ETH", "") + "ETH"
                    currency = "ETH"
                } else {
                    const cleanSym = sym.replace("-USD", "").replace("USDT", "")
                    binancePair = `${cleanSym}USDT`
                    currency = "USD"
                }

                const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${binancePair}`
                const res = await fetch(url, { next: { revalidate: 60 } })
                if (res.ok) {
                    const data = await res.json()
                    const price = parseFloat(data.lastPrice)
                    if (!isNaN(price) && price > 0) {
                        results.push({
                            symbol: sym,
                            price,
                            currency,
                            change24hPct: parseFloat(data.priceChangePercent) || undefined,
                        })
                        pendingSymbols.delete(sym)
                    }
                }
            } catch (err) {
                // Ignore and fallback
            }
        })
    )

    // 2. Secondary Source: CoinGecko for remaining cryptos
    if (pendingSymbols.size > 0) {
        const cgSymbols = Array.from(pendingSymbols).filter((s) => COINGECKO_MAP[s] || COINGECKO_MAP[s.replace("-USD", "")])
        if (cgSymbols.length > 0) {
            const ids = cgSymbols.map((s) => COINGECKO_MAP[s] || COINGECKO_MAP[s.replace("-USD", "")]).join(",")
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
            try {
                const res = await fetch(url, {
                    headers: { Accept: "application/json" },
                    next: { revalidate: 300 },
                })
                if (res.ok) {
                    const data = await res.json()
                    for (const [id, val] of Object.entries(data as Record<string, { usd?: number; usd_24h_change?: number }>)) {
                        const sym = REVERSE_COINGECKO_MAP[id]
                        if (sym && typeof val.usd === "number") {
                            results.push({
                                symbol: sym,
                                price: val.usd,
                                currency: "USD",
                                change24hPct: val.usd_24h_change,
                            })
                            pendingSymbols.delete(sym)
                            pendingSymbols.delete(`${sym}-USD`)
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching crypto prices from CoinGecko fallback:", err)
            }
        }
    }

    // 3. Tertiary Source: Yahoo Finance (${sym}-USD)
    if (pendingSymbols.size > 0) {
        await Promise.allSettled(
            Array.from(pendingSymbols).map(async (sym) => {
                const yahooSym = sym.endsWith("-USD") || sym.includes("-") ? sym : `${sym}-USD`
                try {
                    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=5d`
                    const res = await fetch(url, {
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                            Accept: "application/json",
                        },
                        next: { revalidate: 300 },
                    })
                    if (res.ok) {
                        const data = await res.json()
                        const result = data?.chart?.result?.[0]
                        if (result) {
                            const meta = result.meta
                            const currentPrice = meta.regularMarketPrice ?? meta.previousClose
                            const previousClose = meta.chartPreviousClose ?? meta.previousClose
                            let change24hPct: number | undefined
                            if (currentPrice && previousClose && previousClose > 0) {
                                change24hPct = ((currentPrice - previousClose) / previousClose) * 100
                            }
                            if (typeof currentPrice === "number" && !isNaN(currentPrice)) {
                                results.push({
                                    symbol: sym,
                                    price: currentPrice,
                                    currency: meta.currency?.toUpperCase() || "USD",
                                    change24hPct,
                                    name: meta.shortName || meta.symbol,
                                })
                            }
                        }
                    }
                } catch (err) {
                    // Ignore
                }
            })
        )
    }

    return results
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

                const isBA = symbol.toUpperCase().endsWith(".BA")
                const currency = isBA ? "ARS" : (meta?.currency?.toUpperCase() || "USD")

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

export const KNOWN_FCI_TICKERS: Record<string, string> = {
    // Delta / CMA
    DFSACCA: "CMA Acciones - Clase A",
    DFSACCB: "CMA Acciones - Clase B",
    DELACCA: "Delta Acciones - Clase A",
    DELACCB: "Delta Acciones - Clase B",
    DELAHPA: "Delta Ahorro Plus - Clase A",
    DELAHOA: "Delta Ahorro - Clase A",
    RJMULIA: "RJ Delta Multimercado - Clase A",
    RJMULIB: "RJ Delta Multimercado - Clase B",
    DELDOAA: "Delta Dólares - Clase A",
    DELPYMA: "Delta Empresas Argentinas Pymes - Clase A",
    DELFEDA: "Delta Federal I - Clase A",
    CMARVA: "CMA Renta Variable - Clase A",
    CMARVB: "CMA Renta Variable - Clase B",
    CMAACCA: "CMA Acciones - Clase A",

    // FIMA (Banco Galicia)
    FIMPREA: "Fima Premium - Clase A",
    FIMPREB: "Fima Premium - Clase B",
    FIMABBA: "Fima Ahorro Pesos - Clase A",
    FIMMIXA: "Fima Mix I - Clase A",
    FIMACCA: "Fima Acciones - Clase A",
    FIMRFAA: "Fima Renta Fija - Clase A",
    FIMPBPA: "Fima PB Pesos - Clase A",

    // Balanz
    BALACCA: "Balanz Acciones - Clase A",
    BALACCB: "Balanz Acciones - Clase B",
    BALEQSA: "Balanz Equity Selection - Clase A",
    BALEQSB: "Balanz Equity Selection - Clase B",
    BALAHRA: "Balanz Ahorro - Clase A",
    BALCAPA: "Balanz Capital - Clase A",
    BALINFA: "Balanz Inflación - Clase A",
    BALMMCA: "Balanz Money Market - Clase A",
    BALRFAA: "Balanz Renta Fija - Clase A",

    // Galileo
    GALACCA: "Galileo Acciones - Clase A",
    GALACCB: "Galileo Acciones - Clase B",
    GALAHRA: "Galileo Ahorro - Clase A",
    GALINFA: "Galileo Inflación - Clase A",
    GALENGA: "Galileo Event Driven - Clase A",
    GALMMCA: "Galileo Money Market - Clase A",

    // Consultatio
    CONAHRA: "Consultatio Ahorro Plus - Clase A",
    CONACCA: "Consultatio Acciones Argentina - Clase A",
    CONDEBA: "Consultatio Deuda Argentina - Clase A",
    CONRENA: "Consultatio Renta Fija - Clase A",

    // SBS
    SBSACCA: "SBS Acciones Argentina - Clase A",
    SBSAHRA: "SBS Ahorro Pesos - Clase A",
    SBSRFAA: "SBS Renta Fija - Clase A",

    // Schroders
    SCHPREA: "Schroders Argentina - Clase A",
    SCHRENA: "Schroders Renta Fija - Clase A",
    SCHACCA: "Schroders Renta Variable - Clase A",

    // Quinquela
    QUINACCA: "Quinquela Acciones - Clase A",
    QUINAHOA: "Quinquela Ahorro - Clase A",

    // Allaria
    ALLACCA: "Allaria Acciones - Clase A",
    ALLAHRA: "Allaria Ahorro - Clase A",

    // Santander (Supergestión)
    STNACCA: "Super Fondo Acciones - Clase A",
    STNPREA: "Super Fondo Premium - Clase A",

    // Macro (Pellegrini)
    PMPACCA: "Pellegrini Acciones - Clase A",
    PMPAHRA: "Pellegrini Renta Fija - Clase A",

    // Mariva
    MARACCA: "Mariva Acciones - Clase A",
    MARAHRA: "Mariva Ahorro - Clase A",

    // AdCap
    ADCAPA: "AdCap Acciones - Clase A",
    ADCAHOR: "AdCap Ahorro Plus - Clase A",
}

export function formatFciTicker(fondoName: string): string {
    const parts = fondoName.split(" - ")
    const mainName = parts[0] || fondoName
    const classPart = parts[1] || ""

    const classMatch = classPart.match(/Clase\s+([A-Za-z0-9]+)/i)
    const classCode = classMatch ? classMatch[1].toUpperCase() : ""

    const words = mainName.replace(/[^A-Za-z0-9\s]/g, "").split(/\s+/).filter(Boolean)
    let tickerPrefix = ""
    if (words.length === 1) {
        tickerPrefix = words[0].slice(0, 6).toUpperCase()
    } else if (words.length === 2) {
        tickerPrefix = `${words[0].slice(0, 4).toUpperCase()}-${words[1].slice(0, 4).toUpperCase()}`
    } else {
        tickerPrefix = `${words[0].slice(0, 3).toUpperCase()}-${words.slice(1).map((w) => w.slice(0, 3).toUpperCase()).join("-")}`
    }

    return classCode ? `${tickerPrefix}-${classCode}` : tickerPrefix
}

export function resolveFciSymbol(fondoName: string): string {
    const upperFondo = fondoName.toUpperCase()
    for (const [ticker, name] of Object.entries(KNOWN_FCI_TICKERS)) {
        if (upperFondo.includes(name.toUpperCase()) || name.toUpperCase().includes(upperFondo)) {
            return ticker
        }
    }
    return formatFciTicker(fondoName)
}

interface FciItem {
    fondo: string
    vcp: number
    fecha: string
    category: string
}

let fciCatalogCache: { data: FciItem[]; timestamp: number } | null = null

export async function getFciCatalog(): Promise<FciItem[]> {
    const now = Date.now()
    if (fciCatalogCache && now - fciCatalogCache.timestamp < 60 * 60 * 1000) {
        return fciCatalogCache.data
    }

    const categories = ["rentaVariable", "rentaFija", "rentaMixta", "mercadoDinero"]
    const allItems: FciItem[] = []

    await Promise.allSettled(
        categories.map(async (cat) => {
            try {
                const res = await fetch(`https://api.argentinadatos.com/v1/finanzas/fci/${cat}/ultimo`, {
                    next: { revalidate: 3600 },
                })
                if (res.ok) {
                    const list: any[] = await res.json()
                    if (Array.isArray(list)) {
                        for (const item of list) {
                            if (item.fondo && typeof item.vcp === "number") {
                                // Calculate the real unit price per 1 cuotaparte:
                                // CAFCI raw report reports VCP per 1,000 cuotapartes.
                                // Exact formula: patrimonio / ccp, fallback: vcp / 1000.
                                const unitPrice =
                                    typeof item.ccp === "number" && item.ccp > 0 && typeof item.patrimonio === "number" && item.patrimonio > 0
                                        ? item.patrimonio / item.ccp
                                        : item.vcp / 1000

                                allItems.push({
                                    fondo: item.fondo,
                                    vcp: unitPrice,
                                    fecha: item.fecha,
                                    category: cat,
                                })
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn(`Error fetching FCI category ${cat}:`, err)
            }
        })
    )

    if (allItems.length > 0) {
        fciCatalogCache = { data: allItems, timestamp: now }
    }

    return allItems.length > 0 ? allItems : (fciCatalogCache?.data || [])
}

async function fetchFciPrices(symbols: string[]): Promise<AssetPriceInfo[]> {
    const catalog = await getFciCatalog()
    if (catalog.length === 0) return []

    const results: AssetPriceInfo[] = []
    for (const sym of symbols) {
        const upperSym = sym.toUpperCase().trim()
        const knownName = KNOWN_FCI_TICKERS[upperSym]

        const match = catalog.find((f) => {
            if (knownName && f.fondo.toUpperCase().includes(knownName.toUpperCase())) return true
            if (resolveFciSymbol(f.fondo).toUpperCase() === upperSym) return true
            if (f.fondo.toUpperCase() === upperSym) return true
            if (f.fondo.toUpperCase().replace(/[^A-Z0-9]/g, "").includes(upperSym.replace(/[^A-Z0-9]/g, ""))) return true
            return false
        })

        if (match) {
            results.push({
                symbol: sym,
                price: match.vcp,
                currency: "ARS",
                name: match.fondo,
            })
        }
    }
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
                    const isBA = symbol.toUpperCase().endsWith(".BA")
                    const currency = isBA ? "ARS" : (result.meta?.currency?.toUpperCase() || "USD")

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
                const [cryptoResults, stockResults, fciResults] = await Promise.all([
                    fetchCryptoPrices(expiredSymbols),
                    fetchStockPrices(expiredSymbols),
                    fetchFciPrices(expiredSymbols),
                ])

                const allFetched = [...cryptoResults, ...stockResults, ...fciResults]
                const todayStr = new Date().toISOString().split("T")[0]

                if (allFetched.length > 0) {
                    for (const p of allFetched) {
                        resultMap[p.symbol.toUpperCase()] = {
                            price: p.price,
                            currency: p.currency,
                            change24hPct: p.change24hPct,
                            name: p.name,
                        }
                    }

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

        // Await update so search results and dashboards get fresh prices immediately
        await updatePromise
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
    assetType: "CRYPTO" | "STOCK" | "ETF" | "CEDEAR" | "BOND" | "FCI" | "OTHER" | string
    defaultCurrency: string
    currentPrice?: number
    change24hPct?: number
    isRecent?: boolean
    isLocal?: boolean
}

/**
 * Searches online market assets via Yahoo Finance, CoinGecko and ArgentinaDatos FCIs
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

                    let assetType: "CRYPTO" | "STOCK" | "ETF" | "CEDEAR" | "BOND" | "FCI" | "OTHER" = "STOCK"
                    let currency = "USD"

                    const ARG_LOCAL_STOCKS = new Set([
                        "GGAL.BA", "YPFD.BA", "PAMP.BA", "ALUA.BA", "TXAR.BA", "BMA.BA", "BBAR.BA",
                        "CEPU.BA", "CRES.BA", "EDN.BA", "SUPV.BA", "VALO.BA", "LOMA.BA", "MIRG.BA",
                        "TGSU2.BA", "TGNO4.BA", "TRAN.BA", "MORI.BA", "COME.BA", "CVH.BA", "BYMA.BA",
                        "AGRO.BA", "AUSO.BA", "BHIP.BA", "BOLT.BA", "BPAT.BA", "CADO.BA", "CAPX.BA",
                        "CARC.BA", "CELU.BA", "CGPA2.BA", "CTIO.BA", "DGCU2.BA", "FERR.BA", "GCLA.BA",
                        "GRIM.BA", "HARG.BA", "HAVA.BA", "INTR.BA", "INVJ.BA", "IRSA.BA", "LEDE.BA",
                        "LONG.BA", "METR.BA", "MOLI.BA", "OEST.BA", "PATA.BA", "POLL.BA", "RIGO.BA",
                        "SAMI.BA", "SEMI.BA", "TECO2.BA"
                    ])

                    if (sym.endsWith(".BA") || item.exchange === "BUE") {
                        const rawName = `${item.shortname || ""} ${item.longname || ""}`.toUpperCase()
                        const isCedearByName = rawName.includes("CEDEAR") || rawName.includes("CDR") || rawName.includes("REP") || rawName.includes("TRUST")
                        const isKnownLocal = ARG_LOCAL_STOCKS.has(sym)

                        if (isCedearByName || !isKnownLocal) {
                            assetType = "CEDEAR"
                        } else {
                            assetType = "STOCK"
                        }
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

    // 3. Fondos Comunes de Inversión (FCI) Search
    const fciPromise = (async () => {
        try {
            const catalog = await getFciCatalog()
            const upperQ = q.toUpperCase().trim()

            const matchedFunds = catalog.filter((f) => {
                const name = f.fondo.toUpperCase()
                if (name.includes(upperQ)) return true
                const sym = resolveFciSymbol(f.fondo).toUpperCase()
                if (sym.includes(upperQ) || upperQ.includes(sym)) return true
                for (const [ticker, fondoName] of Object.entries(KNOWN_FCI_TICKERS)) {
                    if ((ticker.includes(upperQ) || upperQ.includes(ticker)) && name.includes(fondoName.toUpperCase())) {
                        return true
                    }
                }
                return false
            }).slice(0, 8)

            for (const f of matchedFunds) {
                const sym = resolveFciSymbol(f.fondo)
                if (!seenSymbols.has(sym)) {
                    seenSymbols.add(sym)
                    results.push({
                        symbol: sym,
                        name: f.fondo,
                        assetType: "FCI",
                        defaultCurrency: "ARS",
                        currentPrice: f.vcp,
                    })
                }
            }
        } catch (err) {
            console.error("Error searching FCIs:", err)
        }
    })()

    await Promise.allSettled([yahooPromise, coinGeckoPromise, fciPromise])

    // 4. Populate live prices from cache/online for top candidates
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
