'use client'

import { useState, useEffect } from 'react'
import { Clock, ShoppingBag, Zap } from 'lucide-react'

const COUNTDOWN_MINUTES = 15
const SESSION_KEY = 'global_countdown_expira'

// Contador de urgência global — persiste em sessionStorage por toda a sessão
export function CountdownBanner({ buyHref = '#' }: { buyHref?: string }) {
  const [segundos, setSegundos] = useState<number>(COUNTDOWN_MINUTES * 60)
  const [montado, setMontado]   = useState(false)

  useEffect(() => {
    setMontado(true)
    const agora = Date.now()
    const salvo = sessionStorage.getItem(SESSION_KEY)
    let expira: number

    if (salvo && Number(salvo) > agora) {
      expira = Number(salvo)
    } else {
      expira = agora + COUNTDOWN_MINUTES * 60 * 1000
      sessionStorage.setItem(SESSION_KEY, String(expira))
    }

    const tick = () => {
      const restam = Math.max(0, Math.round((expira - Date.now()) / 1000))
      setSegundos(restam)
      if (restam <= 0) {
        expira = Date.now() + COUNTDOWN_MINUTES * 60 * 1000
        sessionStorage.setItem(SESSION_KEY, String(expira))
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!montado) return null

  const m       = String(Math.floor(segundos / 60)).padStart(2, '0')
  const s       = String(segundos % 60).padStart(2, '0')
  const urgente = segundos < 120

  return (
    <div className="w-full flex justify-center px-4 py-3 bg-cream-100 border-b border-cream-300">
      <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full shadow-md transition-colors ${urgente ? 'bg-red-600' : 'bg-orange-500'}`}>

        {/* Ícone + mensagem */}
        <div className="flex items-center gap-1.5 text-white">
          {urgente
            ? <Zap className="h-3.5 w-3.5 animate-pulse flex-shrink-0" />
            : <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          }
          <span className="text-xs font-semibold whitespace-nowrap">
            {urgente ? '⚡ A expirar!' : '🎁 Oferta limitada —'}
          </span>
        </div>

        {/* Contador */}
        <div className="bg-white/25 rounded-lg px-2.5 py-0.5">
          <span className={`font-bold tabular-nums text-base text-white leading-none ${urgente ? 'animate-pulse' : ''}`}>
            {m}:{s}
          </span>
        </div>

        {/* Botão CTA */}
        <a
          href={buyHref}
          className={`flex items-center gap-1 font-bold text-xs px-3 py-1.5 rounded-full transition-all ${
            urgente
              ? 'bg-white text-red-600 hover:bg-red-50 animate-bounce'
              : 'bg-white text-orange-600 hover:bg-orange-50 hover:scale-105'
          }`}
        >
          <ShoppingBag className="h-3 w-3" />
          Comprar
        </a>
      </div>
    </div>
  )
}
