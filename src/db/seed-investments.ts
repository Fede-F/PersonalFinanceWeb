import "dotenv/config";
import { db } from "./index";
import { investmentAssets, investmentCategories } from "./schema";
import { eq, and, isNull } from "drizzle-orm";

const systemCategories = [
    { name: "CRYPTO", label: "Criptomonedas", color: "#f59e0b", isSystem: true },
    { name: "CEDEAR", label: "CEDEARs / Arg", color: "#8b5cf6", isSystem: true },
    { name: "STOCK", label: "Acciones USA", color: "#3b82f6", isSystem: true },
    { name: "ETF", label: "ETFs", color: "#10b981", isSystem: true },
    { name: "BOND", label: "Bonos / Renta Fija", color: "#06b6d4", isSystem: true },
    { name: "FCI", label: "Fondos Comunes (FCI)", color: "#6366f1", isSystem: true },
    { name: "OTHER", label: "Otros", color: "#6b7280", isSystem: true },
];

const initialAssets = [
    // --- Cryptocurrencies ---
    { symbol: "BTC", name: "Bitcoin", assetType: "CRYPTO", defaultCurrency: "USD", icon: "bitcoin" },
    { symbol: "ETH", name: "Ethereum", assetType: "CRYPTO", defaultCurrency: "USD", icon: "coins" },
    { symbol: "SOL", name: "Solana", assetType: "CRYPTO", defaultCurrency: "USD", icon: "coins" },
    { symbol: "USDT", name: "Tether USD", assetType: "CRYPTO", defaultCurrency: "USD", icon: "dollar-sign" },
    { symbol: "BNB", name: "Binance Coin", assetType: "CRYPTO", defaultCurrency: "USD", icon: "coins" },
    { symbol: "XRP", name: "Ripple", assetType: "CRYPTO", defaultCurrency: "USD", icon: "coins" },
    { symbol: "ADA", name: "Cardano", assetType: "CRYPTO", defaultCurrency: "USD", icon: "coins" },

    // --- US Stocks ---
    { symbol: "AAPL", name: "Apple Inc.", assetType: "STOCK", defaultCurrency: "USD", icon: "apple" },
    { symbol: "NVDA", name: "NVIDIA Corporation", assetType: "STOCK", defaultCurrency: "USD", icon: "cpu" },
    { symbol: "MSFT", name: "Microsoft Corporation", assetType: "STOCK", defaultCurrency: "USD", icon: "monitor" },
    { symbol: "AMZN", name: "Amazon.com Inc.", assetType: "STOCK", defaultCurrency: "USD", icon: "shopping-cart" },
    { symbol: "GOOGL", name: "Alphabet Inc. (Google)", assetType: "STOCK", defaultCurrency: "USD", icon: "globe" },
    { symbol: "META", name: "Meta Platforms Inc.", assetType: "STOCK", defaultCurrency: "USD", icon: "share-2" },
    { symbol: "TSLA", name: "Tesla Inc.", assetType: "STOCK", defaultCurrency: "USD", icon: "zap" },

    // --- US ETFs ---
    { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", assetType: "ETF", defaultCurrency: "USD", icon: "trending-up" },
    { symbol: "QQQ", name: "Invesco QQQ Trust (Nasdaq 100)", assetType: "ETF", defaultCurrency: "USD", icon: "trending-up" },
    { symbol: "VOO", name: "Vanguard S&P 500 ETF", assetType: "ETF", defaultCurrency: "USD", icon: "trending-up" },
    { symbol: "VTI", name: "Vanguard Total Stock Market ETF", assetType: "ETF", defaultCurrency: "USD", icon: "pie-chart" },

    // --- CEDEARs (Argentina - Cotizan en ARS / USD) ---
    { symbol: "SPY.BA", name: "CEDEAR SPDR S&P 500 ETF", assetType: "CEDEAR", defaultCurrency: "ARS", icon: "trending-up" },
    { symbol: "QQQ.BA", name: "CEDEAR Invesco QQQ Trust", assetType: "CEDEAR", defaultCurrency: "ARS", icon: "trending-up" },
    { symbol: "AAPL.BA", name: "CEDEAR Apple Inc.", assetType: "CEDEAR", defaultCurrency: "ARS", icon: "apple" },
    { symbol: "NVDA.BA", name: "CEDEAR NVIDIA Corporation", assetType: "CEDEAR", defaultCurrency: "ARS", icon: "cpu" },
    { symbol: "MELI.BA", name: "CEDEAR MercadoLibre Inc.", assetType: "CEDEAR", defaultCurrency: "ARS", icon: "shopping-bag" },
    { symbol: "KO.BA", name: "CEDEAR The Coca-Cola Company", assetType: "CEDEAR", defaultCurrency: "ARS", icon: "cup-soda" },
    { symbol: "TSLA.BA", name: "CEDEAR Tesla Inc.", assetType: "CEDEAR", defaultCurrency: "ARS", icon: "zap" },
    { symbol: "MSFT.BA", name: "CEDEAR Microsoft Corp.", assetType: "CEDEAR", defaultCurrency: "ARS", icon: "monitor" },

    // --- Acciones Argentinas (Merval / BYMA) ---
    { symbol: "GGAL.BA", name: "Grupo Financiero Galicia", assetType: "STOCK", defaultCurrency: "ARS", icon: "landmark" },
    { symbol: "YPFD.BA", name: "YPF S.A.", assetType: "STOCK", defaultCurrency: "ARS", icon: "fuel" },
    { symbol: "PAMP.BA", name: "Pampa Energía S.A.", assetType: "STOCK", defaultCurrency: "ARS", icon: "zap" },
    { symbol: "BMA.BA", name: "Banco Macro S.A.", assetType: "STOCK", defaultCurrency: "ARS", icon: "landmark" },
    { symbol: "TXAR.BA", name: "Ternium Argentina S.A.", assetType: "STOCK", defaultCurrency: "ARS", icon: "factory" },
    { symbol: "ALUA.BA", name: "Aluar Aluminio Argentino", assetType: "STOCK", defaultCurrency: "ARS", icon: "box" },
];

async function main() {
    console.log("🌱 Seeding system investment categories...");

    for (const cat of systemCategories) {
        const [existing] = await db
            .select()
            .from(investmentCategories)
            .where(and(eq(investmentCategories.name, cat.name), isNull(investmentCategories.workspaceId)))
            .limit(1);

        if (!existing) {
            await db.insert(investmentCategories).values({
                workspaceId: null,
                name: cat.name,
                label: cat.label,
                color: cat.color,
                isSystem: true,
            });
        }
    }

    console.log("🌱 Seeding initial investment assets...");

    for (const asset of initialAssets) {
        await db.insert(investmentAssets).values({
            workspaceId: null, // global system asset
            symbol: asset.symbol,
            name: asset.name,
            assetType: asset.assetType,
            defaultCurrency: asset.defaultCurrency,
            icon: asset.icon,
            isActive: true,
        }).onConflictDoNothing();
    }

    console.log(`✅ Successfully seeded ${initialAssets.length} initial investment assets!`);

    const ARG_LOCAL_STOCKS = new Set([
        "GGAL.BA", "YPFD.BA", "PAMP.BA", "ALUA.BA", "TXAR.BA", "BMA.BA", "BBAR.BA",
        "CEPU.BA", "CRES.BA", "EDN.BA", "SUPV.BA", "VALO.BA", "LOMA.BA", "MIRG.BA",
        "TGSU2.BA", "TGNO4.BA", "TRAN.BA", "MORI.BA", "COME.BA", "CVH.BA", "BYMA.BA",
        "AGRO.BA", "AUSO.BA", "BHIP.BA", "BOLT.BA", "BPAT.BA", "CADO.BA", "CAPX.BA",
        "CARC.BA", "CELU.BA", "CGPA2.BA", "CTIO.BA", "DGCU2.BA", "FERR.BA", "GCLA.BA",
        "GRIM.BA", "HARG.BA", "HAVA.BA", "INTR.BA", "INVJ.BA", "IRSA.BA", "LEDE.BA",
        "LONG.BA", "METR.BA", "MOLI.BA", "OEST.BA", "PATA.BA", "POLL.BA", "RIGO.BA",
        "SAMI.BA", "SEMI.BA", "TECO2.BA"
    ]);

    const allAssets = await db.select().from(investmentAssets);
    for (const a of allAssets) {
        const sym = a.symbol.toUpperCase();
        if (sym.endsWith(".BA")) {
            const isLocal = ARG_LOCAL_STOCKS.has(sym);
            const expectedType = isLocal ? "STOCK" : "CEDEAR";
            if (a.assetType !== expectedType) {
                console.log(`🔄 Updating ${sym} from ${a.assetType} to ${expectedType}`);
                await db.update(investmentAssets).set({ assetType: expectedType }).where(eq(investmentAssets.id, a.id));
            }
        }
    }
}

main()
    .catch((e) => {
        console.error("❌ Seeding investment assets failed!", e);
        process.exit(1);
    })
    .finally(async () => {
        process.exit(0);
    });
