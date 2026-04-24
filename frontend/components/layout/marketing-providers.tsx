'use client'

import { CurrencyProvider } from '@/lib/currency-context'

export function MarketingProviders({ children }: { children: React.ReactNode }) {
  return <CurrencyProvider>{children}</CurrencyProvider>
}
