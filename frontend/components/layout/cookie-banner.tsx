'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CONSENT_KEY = 'euthy_cookie_consent'

type Consent = 'all' | 'essential' | null

export function CookieBanner() {
  const [consent, setConsent] = useState<Consent | 'loading'>('loading')

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY) as Consent | null
    setConsent(saved)
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'all')
    setConsent('all')
  }

  function essentialOnly() {
    localStorage.setItem(CONSENT_KEY, 'essential')
    setConsent('essential')
  }

  // Don't render until we've read localStorage (avoids hydration mismatch)
  if (consent === 'loading' || consent !== null) return null

  return (
    <div
      role="dialog"
      aria-label="Preferências de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none"
    >
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-cream-200 p-5 sm:p-6 pointer-events-auto">
        <div className="flex items-start gap-4">
          <div className="h-9 w-9 rounded-xl bg-sage-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cookie className="h-5 w-5 text-sage-600" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 mb-1">Este site usa cookies</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Utilizamos cookies essenciais para o funcionamento do site e, com o seu consentimento,
              cookies de analytics para melhorar a experiência.{' '}
              <Link href="/cookies" className="text-sage-600 underline hover:text-sage-700">
                Saber mais
              </Link>
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button size="sm" onClick={accept} className="gap-1.5">
                Aceitar todos
              </Button>
              <Button size="sm" variant="outline" onClick={essentialOnly}>
                Apenas essenciais
              </Button>
            </div>
          </div>

          {/* Dismiss (same as essential only) */}
          <button
            onClick={essentialOnly}
            aria-label="Fechar"
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
