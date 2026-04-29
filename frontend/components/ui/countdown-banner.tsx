'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

const COUNTDOWN_MINUTES = 15
const SESSION_KEY = 'global_countdown_expira'

// Contador de urgência global — persiste em sessionStorage por toda a sessão
export function CountdownBanner() {
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
    <div className={`w-full py-2.5 px-4 text-center text-sm font-medium flex items-center justify-center gap-3 transition-colors ${
      urgente ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
    }`}>
      <Clock className={`h-4 w-4 flex-shrink-0 ${urgente ? 'animate-pulse' : ''}`} />
      <span>
        {urgente ? '⚡ Oferta a expirar! ' : '🎁 Oferta por tempo limitado — '}
        Termina em{' '}
        <span className="font-bold tabular-nums text-base">
          {m}:{s}
        </span>
      </span>
    </div>
  )
}
