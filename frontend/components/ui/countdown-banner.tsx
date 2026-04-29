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
    <div className={`w-full py-2.5 px-4 transition-colors ${urgente ? 'bg-red-600' : 'bg-orange-500'}`}>
      <div className="container-app">
        <div className="flex items-center justify-center gap-4 flex-wrap">

          {/* Ícone + mensagem */}
          <div className="flex items-center gap-2 text-white">
            {urgente
              ? <Zap className="h-4 w-4 animate-pulse flex-shrink-0" />
              : <Clock className="h-4 w-4 flex-shrink-0" />
            }
            <span className="text-sm font-medium">
              {urgente ? '⚡ A expirar!' : '🎁 Oferta por tempo limitado —'}
            </span>
          </div>

          {/* Contador */}
          <div className="bg-white/25 rounded-xl px-3 py-1 text-white text-center">
            <span className={`font-bold tabular-nums text-xl leading-none ${urgente ? 'animate-pulse' : ''}`}>
              {m}:{s}
            </span>
          </div>

          {/* Botão CTA compacto */}
          <a
            href={buyHref}
            className={`flex items-center gap-1.5 font-bold text-xs px-4 py-1.5 rounded-xl transition-all shadow ${
              urgente
                ? 'bg-white text-red-600 hover:bg-red-50 animate-bounce'
                : 'bg-white text-orange-600 hover:bg-orange-50 hover:scale-105'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Comprar agora
          </a>
        </div>
      </div>
    </div>
  )
}
