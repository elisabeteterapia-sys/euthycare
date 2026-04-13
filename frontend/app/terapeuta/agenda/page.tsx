'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTerapeuta } from '../context'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function fmt(d: Date) {
  return d.toISOString().slice(0, 10)
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

interface Agendamento {
  id: string
  hora: string
  status: 'pendente' | 'confirmado' | 'cancelado'
  nome_cliente: string
  email_cliente: string
  notas?: string
  video_url?: string
}

interface Bloqueio {
  hora_inicio: string | null
  hora_fim: string | null
}

const STATUS_COLOR: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmado: 'bg-sage-100 text-sage-700 border-sage-200',
  cancelado: 'bg-red-100 text-red-500 border-red-200',
}

export default function TerapeutaAgenda() {
  const terapeuta = useTerapeuta()
  const [data, setData] = useState(fmt(new Date()))
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Agendamento | null>(null)

  const load = useCallback(async () => {
    const token = sessionStorage.getItem('terapeuta_token')
    setLoading(true)
    try {
      const r = await fetch(`${API}/terapeutas/me/agenda?data=${data}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (r.ok) {
        const json = await r.json()
        setAgendamentos(json.agendamentos ?? [])
        setBloqueios(json.bloqueios ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [data])

  useEffect(() => { load() }, [load])

  function prevDay() {
    const d = new Date(data + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    setData(fmt(d))
  }

  function nextDay() {
    const d = new Date(data + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    setData(fmt(d))
  }

  const diaCompleto = bloqueios.some(b => !b.hora_inicio)

  return (
    <div>
      <h1 className="text-2xl font-bold text-sage-800 mb-6">Minha Agenda</h1>

      {/* Date nav */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={prevDay} className="p-2 rounded-xl bg-white border border-sage-200 hover:bg-sage-50 text-sage-600 transition-colors">
          ←
        </button>
        <div className="flex-1 text-center">
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            className="sr-only"
            id="date-pick"
          />
          <label htmlFor="date-pick" className="cursor-pointer">
            <p className="text-lg font-semibold text-sage-800 capitalize">{fmtDate(data)}</p>
          </label>
        </div>
        <button onClick={nextDay} className="p-2 rounded-xl bg-white border border-sage-200 hover:bg-sage-50 text-sage-600 transition-colors">
          →
        </button>
        <button onClick={() => setData(fmt(new Date()))} className="px-3 py-2 rounded-xl bg-sage-400 text-white text-sm font-medium hover:bg-sage-500 transition-colors">
          Hoje
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sage-400">A carregar agenda...</div>
      ) : diaCompleto ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-semibold">Dia bloqueado</p>
          <p className="text-sm text-red-500 mt-1">Este dia está marcado como indisponível.</p>
        </div>
      ) : agendamentos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sage-100 p-8 text-center">
          <p className="text-sage-400 text-lg">Sem consultas neste dia</p>
          <p className="text-sm text-sage-300 mt-1">Aproveite para descansar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agendamentos.map(a => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-sage-100 p-4 flex items-center gap-4 hover:shadow-card transition-shadow"
            >
              <button onClick={() => setSelected(a)} className="flex items-center gap-4 flex-1 text-left min-w-0">
                <div className="text-2xl font-bold text-sage-400 w-16 text-center flex-shrink-0">{a.hora.slice(0, 5)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sage-800">{a.nome_cliente}</p>
                  <p className="text-sm text-sage-500 truncate">{a.email_cliente}</p>
                </div>
              </button>
              <span className={`text-xs font-medium px-3 py-1 rounded-full border flex-shrink-0 ${STATUS_COLOR[a.status]}`}>
                {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
              </span>
              {a.video_url && (
                <a
                  href={a.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1.5 bg-sage-400 hover:bg-sage-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                  title="Entrar na videochamada"
                >
                  🎥 Iniciar
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detalhe da consulta */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-sage-800 mb-4">Detalhes da Consulta</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-sage-400 uppercase tracking-wide">Cliente</dt>
                <dd className="text-sm font-medium text-sage-800">{selected.nome_cliente}</dd>
              </div>
              <div>
                <dt className="text-xs text-sage-400 uppercase tracking-wide">Email</dt>
                <dd className="text-sm text-sage-700">{selected.email_cliente}</dd>
              </div>
              <div>
                <dt className="text-xs text-sage-400 uppercase tracking-wide">Hora</dt>
                <dd className="text-sm font-medium text-sage-800">{selected.hora.slice(0, 5)}</dd>
              </div>
              <div>
                <dt className="text-xs text-sage-400 uppercase tracking-wide">Estado</dt>
                <dd>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLOR[selected.status]}`}>
                    {selected.status}
                  </span>
                </dd>
              </div>
              {selected.notas && (
                <div>
                  <dt className="text-xs text-sage-400 uppercase tracking-wide">Notas</dt>
                  <dd className="text-sm text-sage-700">{selected.notas}</dd>
                </div>
              )}
            </dl>
            {selected.video_url && (
              <a
                href={selected.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center gap-2 w-full bg-sage-400 hover:bg-sage-500 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
              >
                <span>🎥</span> Entrar na videochamada
              </a>
            )}
            <button
              onClick={() => setSelected(null)}
              className="mt-3 w-full bg-sage-100 hover:bg-sage-200 text-sage-700 font-semibold rounded-xl py-2.5 text-sm transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
