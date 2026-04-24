'use client'

import { useAppCurrency } from '@/lib/currency-context'

const OPTIONS = [
  { code: 'EUR', label: '€ EUR' },
  { code: 'USD', label: '$ USD' },
  { code: 'BRL', label: 'R$ BRL' },
]

export function CurrencySelector() {
  const { currency, setCurrency } = useAppCurrency()

  return (
    <select
      value={currency}
      onChange={e => setCurrency(e.target.value)}
      aria-label="Selecionar moeda"
      className="text-xs border border-sage-200 rounded-lg px-2 py-1 bg-white text-sage-700 hover:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400 cursor-pointer transition-colors"
    >
      {OPTIONS.map(o => (
        <option key={o.code} value={o.code}>{o.label}</option>
      ))}
    </select>
  )
}
