'use client'

import { useEffect, useState } from 'react'

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').trim()

export default function TerapeutaCalendario() {
  const [token, setToken] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [renovando, setRenovando] = useState(false)

  useEffect(() => {
    const authToken = sessionStorage.getItem('terapeuta_token')
    fetch(`${API}/terapeutas/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.json())
      .then(j => setToken(j.terapeuta?.calendario_token ?? null))
  }, [])

  const icsUrl = token ? `${API}/terapeutas/cal/${token}` : null
  const webcalUrl = icsUrl?.replace('https://', 'webcal://').replace('http://', 'webcal://')
  const googleUrl = icsUrl
    ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icsUrl)}`
    : null

  async function copiar() {
    if (!icsUrl) return
    await navigator.clipboard.writeText(icsUrl)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function renovar() {
    if (!confirm('Vai gerar um novo link. O link anterior deixará de funcionar. Continuar?')) return
    setRenovando(true)
    const authToken = sessionStorage.getItem('terapeuta_token')
    const r = await fetch(`${API}/terapeutas/me/renovar-calendario`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    })
    const j = await r.json()
    if (r.ok) setToken(j.calendario_token)
    setRenovando(false)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-sage-800 mb-2">Calendário</h1>
      <p className="text-sage-500 text-sm mb-8">
        Subscreva a sua agenda no Google Calendar, Apple Calendar ou Outlook.
        Os agendamentos sincronizam automaticamente.
      </p>

      {/* Google Calendar */}
      <div className="bg-white rounded-2xl border border-sage-100 p-6 mb-4 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">📅</div>
          <div>
            <p className="font-semibold text-sage-800">Google Calendar</p>
            <p className="text-xs text-sage-400">Clique para adicionar directamente</p>
          </div>
        </div>
        <a
          href={googleUrl ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
            googleUrl
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
          }`}
        >
          Subscrever no Google Calendar
        </a>
      </div>

      {/* Apple / Outlook */}
      <div className="bg-white rounded-2xl border border-sage-100 p-6 mb-4 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl">🍎</div>
          <div>
            <p className="font-semibold text-sage-800">Apple Calendar / Outlook</p>
            <p className="text-xs text-sage-400">Clique para abrir com o calendário do sistema</p>
          </div>
        </div>
        <a
          href={webcalUrl ?? '#'}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
            webcalUrl
              ? 'bg-gray-800 hover:bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
          }`}
        >
          Abrir com Apple Calendar / Outlook
        </a>
      </div>

      {/* URL manual */}
      <div className="bg-white rounded-2xl border border-sage-100 p-6 mb-4 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center text-xl">🔗</div>
          <div>
            <p className="font-semibold text-sage-800">URL do calendário</p>
            <p className="text-xs text-sage-400">Copie e cole em qualquer aplicação de calendário</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            readOnly
            value={icsUrl ?? 'A carregar...'}
            className="flex-1 bg-cream-100 border border-cream-300 rounded-xl px-3 py-2.5 text-xs text-sage-600 font-mono truncate focus:outline-none"
          />
          <button
            onClick={copiar}
            disabled={!icsUrl}
            className="px-4 py-2.5 bg-sage-400 hover:bg-sage-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
          >
            {copiado ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Como funciona */}
      <div className="bg-cream-100 rounded-2xl p-5 mb-6 text-sm text-sage-600">
        <p className="font-semibold text-sage-700 mb-2">Como funciona</p>
        <ul className="space-y-1.5 text-sage-500">
          <li>• Os agendamentos sincronizam automaticamente</li>
          <li>• O Google Calendar atualiza a cada poucas horas</li>
          <li>• Inclui lembrete automático 15 minutos antes</li>
          <li>• O link da videochamada aparece no evento</li>
        </ul>
      </div>

      {/* Renovar token */}
      <div className="border-t border-sage-100 pt-6">
        <p className="text-xs text-sage-400 mb-3">
          Se partilhou o link por engano, pode gerar um novo. O link anterior deixará de funcionar.
        </p>
        <button
          onClick={renovar}
          disabled={renovando}
          className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
        >
          {renovando ? 'A renovar...' : 'Gerar novo link (invalida o actual)'}
        </button>
      </div>
    </div>
  )
}
