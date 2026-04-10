// ─── Currency Registry ────────────────────────────────────────
// Base currency: EUR. Add new currencies by extending CURRENCIES.

export interface Currency {
  code: string
  symbol: string
  name: string
  locale: string        // BCP 47 locale for Intl.NumberFormat
  stripeCurrency: string // Stripe uses lowercase ISO 4217
  zeroDecimal: boolean  // Stripe zero-decimal currencies (e.g. JPY)
}

export const CURRENCIES: Record<string, Currency> = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
    stripeCurrency: 'eur',
    zeroDecimal: false,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    stripeCurrency: 'usd',
    zeroDecimal: false,
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real Brasileiro',
    locale: 'pt-BR',
    stripeCurrency: 'brl',
    zeroDecimal: false,
  },
  // To add a new currency, add an entry here. Nothing else needs to change.
  // GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', stripeCurrency: 'gbp', zeroDecimal: false },
}

export const BASE_CURRENCY = 'EUR'

export const SUPPORTED_CURRENCY_CODES = Object.keys(CURRENCIES)

export function getCurrency(code: string): Currency {
  return CURRENCIES[code.toUpperCase()] ?? CURRENCIES[BASE_CURRENCY]
}

/** Map country ISO 3166-1 alpha-2 → currency code */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Eurozone
  AT: 'EUR', BE: 'EUR', CY: 'EUR', DE: 'EUR', EE: 'EUR', ES: 'EUR',
  FI: 'EUR', FR: 'EUR', GR: 'EUR', HR: 'EUR', IE: 'EUR', IT: 'EUR',
  LT: 'EUR', LU: 'EUR', LV: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR',
  SI: 'EUR', SK: 'EUR',
  // USD
  US: 'USD',
  // BRL
  BR: 'BRL',
}

export function currencyForCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode?.toUpperCase()] ?? BASE_CURRENCY
}
