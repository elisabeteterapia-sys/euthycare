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
    <div className={`w-full py-4 px-4 transition-colors ${urgente ? 'bg-red-600' : 'bg-orange-500'}`}>
      <div className="container-app max-w-4xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Mensagem + contador */}
          <div className="flex items-center gap-3">
            {urgente
              ? <Zap className="h-6 w-6 text-white animate-pulse flex-shrink-0" />
              : <Clock className="h-6 w-6 text-white flex-shrink-0" />
            }
            <div className="text-white">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-90">
                {urgente ? '⚡ A expirar!' : '🎁 Oferta por tempo limitado'}
              </p>
              <p className="text-sm font-medium opacity-90">
                Esta promoção termina em
              </p>
            </div>
          </div>

          {/* Contador grande */}
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-2 text-white text-center min-w-[100px]">
              <span className={`font-bold tabular-nums text-4xl leading-none ${urgente ? 'animate-pulse' : ''}`}>
                {m}:{s}
              </span>
              <p className="text-[10px] uppercase tracking-widest opacity-80 mt-0.5">min : seg</p>
            </div>
          </div>

          {/* Botão CTA */}
          <a
            href={buyHref}
            className={`flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-2xl transition-all shadow-lg ${
              urgente
                ? 'bg-white text-red-600 hover:bg-red-50 animate-bounce'
                : 'bg-white text-orange-600 hover:bg-orange-50 hover:scale-105'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Comprar agora
          </a>
        </div>
      </div>
    </div>
  )
}
