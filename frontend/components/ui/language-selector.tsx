'use client'

import { useLocale, SUPPORTED_LOCALES, LOCALE_LABELS, type Locale } from '@/lib/locale-context'

export function LanguageSelector() {
  const { locale, setLocale } = useLocale()

  return (
    <select
      value={locale}
      onChange={e => setLocale(e.target.value as Locale)}
      aria-label="Selecionar idioma"
      className="text-xs border border-sage-200 rounded-lg px-2 py-1 bg-white text-sage-700 hover:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400 cursor-pointer transition-colors"
    >
      {SUPPORTED_LOCALES.map(l => (
        <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
      ))}
    </select>
  )
}
