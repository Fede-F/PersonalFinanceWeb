/**
 * Singleton Intl.NumberFormat instances for maximum performance and consistent formatting
 */

const formattersCache: Map<string, Intl.NumberFormat> = new Map()

function getCurrencyFormatter(currency: string, maximumFractionDigits?: number): Intl.NumberFormat {
    const isUSD = currency === "USD"
    const digits = maximumFractionDigits !== undefined ? maximumFractionDigits : isUSD ? 2 : 0
    const key = `currency_${currency}_${digits}`

    let formatter = formattersCache.get(key)
    if (!formatter) {
        formatter = new Intl.NumberFormat(isUSD ? "en-US" : "es-AR", {
            style: "currency",
            currency: currency,
            minimumFractionDigits: isUSD ? 2 : 0,
            maximumFractionDigits: digits,
        })
        formattersCache.set(key, formatter)
    }
    return formatter
}

const quantityFormatters = {
    large: new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }),
    medium: new Intl.NumberFormat("es-AR", { maximumFractionDigits: 4 }),
    small: new Intl.NumberFormat("es-AR", { maximumFractionDigits: 8 }),
}

const percentFormatter = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

export function formatCurrency(value: number, currency = "USD", maximumFractionDigits?: number): string {
    if (isNaN(value)) return "$0"
    return getCurrencyFormatter(currency, maximumFractionDigits).format(value)
}

export function formatQuantity(qty: number): string {
    if (isNaN(qty)) return "0"
    if (qty >= 100) return quantityFormatters.large.format(qty)
    if (qty >= 1) return quantityFormatters.medium.format(qty)
    return quantityFormatters.small.format(qty)
}

export function formatPercentage(val: number): string {
    if (isNaN(val)) return "0.00%"
    return `${val >= 0 ? "+" : ""}${percentFormatter.format(val)}%`
}
