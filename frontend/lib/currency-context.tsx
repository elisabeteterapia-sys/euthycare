'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', BRL: 'R$' }
const LOCALES: Record<string, string> = { EUR: 'de-DE', USD: 'en-US', BRL: 'pt-BR' }
const SUPPORTED = ['EUR', 'USD', 'BRL']

interface CurrencyCtx {
  currency: string
  rates: Record<string, number>
  setCurrency: (c: string) => void
  formatPrice: (eurValue: number) => string
  symbol: string
}

const defaultCtx: CurrencyCtx = {
  currency: 'EUR',
  rates: { EUR: 1, USD: 1.08, BRL: 5.42 },
  setCurrency: () => {},
  formatPrice: (v) => `${v}€`,
  symbol: '€',
}

const Ctx = createContext<CurrencyCtx>(defaultCtx)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState('EUR')
  const [rates, setRates]           = useState<Record<string, number>>({ EUR: 1, USD: 1.08, BRL: 5.42 })

  useEffect(() => {
    // 1. Preferência guardada localmente
    const saved = localStorage.getItem('pref_currency')
    if (saved && SUPPORTED.includes(saved)) { setCurrencyState(saved); return }
    // 2. Detectar pelo IP via backend
    fetch(`${API}/geo/currency`)
      .then(r => r.json())
      .then(d => { if (d.currency && SUPPORTED.includes(d.currency)) setCurrencyState(d.currency) })
      .catch(() => null)
  }, [])

  useEffect(() => {
    fetch(`${API}/geo/rates`)
      .then(r => r.json())
      .then(d => { if (d.rates) setRates(d.rates) })
      .catch(() => null)
  }, [])

  function setCurrency(c: string) {
    setCurrencyState(c)
    localStorage.setItem('pref_currency', c)
  }

  function formatPrice(eurValue: number): string {
    const rate      = rates[currency] ?? 1
    const converted = eurValue * rate
    try {
      return new Intl.NumberFormat(LOCALES[currency] ?? 'de-DE', {
        style: 'currency', currency,
        minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(converted)
    } catch {
      return `${SYMBOLS[currency] ?? '€'}${Math.round(converted)}`
    }
  }

  return (
    <Ctx.Provider value={{ currency, rates, setCurrency, formatPrice, symbol: SYMBOLS[currency] ?? '€' }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAppCurrency() { return useContext(Ctx) }
