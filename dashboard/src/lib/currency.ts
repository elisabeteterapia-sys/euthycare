// ─── Supported Currencies ────────────────────────────────────
export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
  locale: string
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro', locale: 'pt-BR' },
}

export const BASE_CURRENCY = 'EUR'

// ─── State (module-level, replaces a store for simplicity) ───
let _currency: string = BASE_CURRENCY
let _rates: Record<string, number> = { EUR: 1 }

export function setActiveCurrency(code: string) {
  _currency = CURRENCIES[code.toUpperCase()] ? code.toUpperCase() : BASE_CURRENCY
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred_currency', _currency)
  }
}

export function getActiveCurrency(): CurrencyInfo {
  return CURRENCIES[_currency]
}

export function setRates(rates: Record<string, number>) {
  _rates = rates
}

// ─── Detection ───────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

/**
 * Auto-detect the user's currency from their IP.
 * Respects a previously saved preference in localStorage.
 */
export async function detectCurrency(): Promise<string> {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('preferred_currency') : null
  if (saved && CURRENCIES[saved]) {
    setActiveCurrency(saved)
    await fetchAndCacheRates()
    return saved
  }

  const res = await fetch(`${API_BASE}/geo/currency`)
  const { currency } = await res.json()
  setActiveCurrency(currency)
  await fetchAndCacheRates()
  return currency
}

async function fetchAndCacheRates() {
  try {
    const res = await fetch(`${API_BASE}/geo/rates`)
    const { rates } = await res.json()
    setRates(rates)
  } catch {
    // Keep existing rates on failure
  }
}

// ─── Conversion ───────────────────────────────────────────────
/**
 * Convert a value stored in EUR cents to the active currency, in cents.
 * e.g. convertFromEur(1900, 'BRL') → ~10200 (R$102.00)
 */
export function convertFromEur(eurCents: number, targetCurrency?: string): number {
  const code = (targetCurrency ?? _currency).toUpperCase()
  const rate = _rates[code] ?? 1
  return Math.round(eurCents * rate)
}

// ─── Formatting ───────────────────────────────────────────────
/**
 * Format an amount in cents to a locale-aware currency string.
 * e.g. formatPrice(1900, 'EUR') → '€19,00'
 *      formatPrice(2052, 'USD') → '$20.52'
 */
export function formatPrice(
  cents: number,
  currencyCode?: string,
  opts?: Intl.NumberFormatOptions
): string {
  const code = (currencyCode ?? _currency).toUpperCase()
  const info = CURRENCIES[code] ?? CURRENCIES[BASE_CURRENCY]
  const amount = cents / 100

  return new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency: info.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(amount)
}

/**
 * Format a price from EUR cents in the user's active currency.
 * Combines conversion + formatting in one call.
 */
export function formatPriceFromEur(eurCents: number, targetCurrency?: string): string {
  const code = targetCurrency ?? _currency
  const converted = convertFromEur(eurCents, code)
  return formatPrice(converted, code)
}

// ─── Plans API helper ─────────────────────────────────────────
export async function fetchPlans(currency?: string) {
  const code = currency ?? _currency
  const res = await fetch(`${API_BASE}/billing/plans?currency=${code}`)
  return res.json() as Promise<{
    currency: string
    symbol: string
    plans: Array<{
      id: string
      name: string
      priceEurCents: number
      displayPrice: number
      displayCurrency: string
      interval: string
      features: string[]
    }>
  }>
}

export async function startCheckout(planId: string, currency?: string): Promise<void> {
  const code = currency ?? _currency
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${API_BASE}/billing/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ planId, currency: code }),
  })

  if (!res.ok) throw new Error('Checkout failed')
  const { url } = await res.json()
  window.location.href = url
}
