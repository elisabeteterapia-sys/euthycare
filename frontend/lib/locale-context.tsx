'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import type { AbstractIntlMessages } from 'next-intl'
import ptMessages from '@/messages/pt.json'
import enMessages from '@/messages/en.json'
import esMessages from '@/messages/es.json'
import frMessages from '@/messages/fr.json'

export type Locale = 'pt' | 'en' | 'es' | 'fr'

const MESSAGES: Record<Locale, AbstractIntlMessages> = {
  pt: ptMessages as AbstractIntlMessages,
  en: enMessages as AbstractIntlMessages,
  es: esMessages as AbstractIntlMessages,
  fr: frMessages as AbstractIntlMessages,
}

const LOCALE_LABELS: Record<Locale, string> = {
  pt: '🇵🇹 PT',
  en: '🇺🇸 EN',
  es: '🇪🇸 ES',
  fr: '🇫🇷 FR',
}

export const SUPPORTED_LOCALES: Locale[] = ['pt', 'en', 'es', 'fr']

interface LocaleCtx {
  locale: Locale
  setLocale: (l: Locale) => void
  localeLabel: string
}

const Ctx = createContext<LocaleCtx>({ locale: 'pt', setLocale: () => {}, localeLabel: '🇵🇹 PT' })

// Mapeia o código de idioma do browser para os locales suportados
function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'pt'
  const lang = navigator.language?.slice(0, 2).toLowerCase()
  if (lang === 'en') return 'en'
  if (lang === 'es') return 'es'
  if (lang === 'fr') return 'fr'
  return 'pt' // padrão para PT/BR e outros
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt')

  useEffect(() => {
    const saved = localStorage.getItem('pref_locale') as Locale | null
    if (saved && SUPPORTED_LOCALES.includes(saved)) {
      setLocaleState(saved)
    } else {
      setLocaleState(detectLocale())
    }
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem('pref_locale', l)
  }

  return (
    <Ctx.Provider value={{ locale, setLocale, localeLabel: LOCALE_LABELS[locale] }}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
        {children}
      </NextIntlClientProvider>
    </Ctx.Provider>
  )
}

export function useLocale() { return useContext(Ctx) }

export { LOCALE_LABELS }
