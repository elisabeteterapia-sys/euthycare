'use client'

import { CurrencyProvider } from '@/lib/currency-context'
import { LocaleProvider } from '@/lib/locale-context'

export function MarketingProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <CurrencyProvider>{children}</CurrencyProvider>
    </LocaleProvider>
  )
}
