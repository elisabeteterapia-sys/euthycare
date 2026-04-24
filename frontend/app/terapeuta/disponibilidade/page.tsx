'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTerapeuta } from '../context'
import { Save, Loader2, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

interface DisponibilidadeRow {
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  intervalo_min: number
  ativo: boolean
}

interface Bloqueio {
  id: string
  data: string
  hora_inicio: string | null
  hora_fim: string | null
  motivo: string | null
}

function getToken() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('terapeuta_token') ?? '' : ''
}

function authHeader() {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
}

function toDateString(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function formatDatePT(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MESES[m - 1]} ${y}`
}

function getCalDays(y: number, m: number) {
  return { firstDay: new Date(y, m, 1).getDay(), daysInMonth: new Date(y, m + 1, 0).getDate() }
}

// ─── Defaults: Seg-Sex 09h-18h, 60min ───────────────────────
function defaultDisponibilidades(): DisponibilidadeRow[] {
  return DIAS.map((_, i) => ({
    dia_semana:   i,
    hora_inicio:  '09:00',
    hora_fim:     '18:00',
    intervalo_min: 60,
    ativo:         i >= 1 && i <= 5, // Seg-Sex activo por defeito
  }))
}

export default function DisponibilidadePage() {
  const terapeuta = useTerapeuta()

  const [disps, setDisps]       = useState<DisponibilidadeRow[]>(defaultDisponibilidades())
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([])
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null)

  // Calendário de bloqueios
  const hoje = new Date()
  const [calAno, setCalAno]   = useState(hoje.getFullYear())
  const [calMes, setCalMes]   = useState(hoje.getMonth())
  const [addBloq, setAddBloq] = useState<{ data: string; motivo: string } | null>(null)
  const [addingBloq, setAddingBloq] = useState(false)

  // Carregar disponibilidades
  const carregarDisps = useCallback(async () => {
    const r = await fetch(`${API}/terapeutas/me/disponibilidade`, { headers: authHeader() })
    if (r.ok) {
      const d: DisponibilidadeRow[] = await r.json()
      if (d.length > 0) {
        // Merge com defaults (garantir todos os 7 dias)
        const merged = defaultDisponibilidades().map(def => {
          const existente = d.find(x => x.dia_semana === def.dia_semana)
          return existente ?? def
        })
        setDisps(merged)
      }
    }
  }, [])

  // Carregar bloqueios dos próximos 3 meses
  const carregarBloqueios = useCallback(async () => {
    const from = toDateString(calAno, calMes, 1)
    const ate  = new Date(calAno, calMes + 3, 0)
    const to   = toDateString(ate.getFullYear(), ate.getMonth(), ate.getDate())
    const r = await fetch(`${API}/terapeutas/me/bloqueios?from=${from}&to=${to}`, { headers: authHeader() })
    if (r.ok) setBloqueios(await r.json())
  }, [calAno, calMes])

  useEffect(() => { carregarDisps(); carregarBloqueios() }, [carregarDisps, carregarBloqueios])

  // Guardar horários semanais
  async function guardarDisps() {
    setSaving(true); setMsg(null)
    try {
      const rows = disps.filter(d => d.ativo).map(({ dia_semana, hora_inicio, hora_fim, intervalo_min }) =>
        ({ dia_semana, hora_inicio, hora_fim, intervalo_min, ativo: true })
      )
      const r = await fetch(`${API}/terapeutas/me/disponibilidade`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify(rows),
      })
      if (r.ok) setMsg({ ok: true, text: 'Horários guardados com sucesso.' })
      else       setMsg({ ok: false, text: 'Erro ao guardar. Tente novamente.' })
    } catch {
      setMsg({ ok: false, text: 'Erro de ligação.' })
    } finally { setSaving(false) }
  }

  // Adicionar bloqueio
  async function adicionarBloqueio() {
    if (!addBloq) return
    setAddingBloq(true)
    try {
      const r = await fetch(`${API}/terapeutas/me/bloqueio`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ data: addBloq.data, motivo: addBloq.motivo || null }),
      })
      if (r.ok) { await carregarBloqueios(); setAddBloq(null) }
    } finally { setAddingBloq(false) }
  }

  // Remover bloqueio
  async function removerBloqueio(id: string) {
    await fetch(`${API}/terapeutas/me/bloqueio/${id}`, { method: 'DELETE', headers: authHeader() })
    setBloqueios(b => b.filter(x => x.id !== id))
  }

  function toggleDia(i: number) {
    setDisps(prev => prev.map(d => d.dia_semana === i ? { ...d, ativo: !d.ativo } : d))
  }

  function updateDisp(i: number, field: keyof DisponibilidadeRow, val: string | number | boolean) {
    setDisps(prev => prev.map(d => d.dia_semana === i ? { ...d, [field]: val } : d))
  }

  const { firstDay, daysInMonth } = getCalDays(calAno, calMes)
  const bloqDatas = new Set(bloqueios.map(b => b.data))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-sage-800">Disponibilidade</h1>
        <p className="text-sm text-sage-500 mt-1">Defina os seus horários semanais e bloqueie datas específicas.</p>
      </div>

      {/* ── Horários semanais ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-sage-100 shadow-soft p-6">
        <h2 className="font-semibold text-sage-800 mb-4">Horários por dia da semana</h2>

        <div className="space-y-3">
          {disps.map(d => (
            <div key={d.dia_semana} className={`flex flex-wrap items-center gap-3 rounded-xl p-3 transition-colors ${d.ativo ? 'bg-sage-50' : 'bg-gray-50 opacity-60'}`}>
              {/* Toggle dia */}
              <button
                onClick={() => toggleDia(d.dia_semana)}
                className={`w-20 text-xs font-semibold py-1.5 rounded-lg border transition-colors ${
                  d.ativo ? 'bg-sage-400 text-white border-sage-400' : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                {DIAS_CURTOS[d.dia_semana]}
              </button>

              {d.ativo && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <label className="text-gray-500">Das</label>
                    <input
                      type="time"
                      value={d.hora_inicio}
                      onChange={e => updateDisp(d.dia_semana, 'hora_inicio', e.target.value)}
                      className="border border-sage-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
                    />
                    <label className="text-gray-500">às</label>
                    <input
                      type="time"
                      value={d.hora_fim}
                      onChange={e => updateDisp(d.dia_semana, 'hora_fim', e.target.value)}
                      className="border border-sage-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm ml-auto">
                    <label className="text-gray-500">Intervalo</label>
                    <select
                      value={d.intervalo_min}
                      onChange={e => updateDisp(d.dia_semana, 'intervalo_min', Number(e.target.value))}
                      className="border border-sage-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
                    >
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={50}>50 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                    </select>
                  </div>
                </>
              )}

              {!d.ativo && (
                <span className="text-xs text-gray-400 ml-2">Indisponível</span>
              )}
            </div>
          ))}
        </div>

        {msg && (
          <div className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-sage-50 text-sage-700 border border-sage-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {msg.text}
          </div>
        )}

        <button
          onClick={guardarDisps}
          disabled={saving}
          className="mt-5 flex items-center gap-2 bg-sage-400 hover:bg-sage-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar horários
        </button>
      </div>

      {/* ── Bloqueios de datas ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-sage-100 shadow-soft p-6">
        <h2 className="font-semibold text-sage-800 mb-4">Bloquear datas específicas</h2>
        <p className="text-xs text-gray-400 mb-4">Clique num dia para o bloquear (férias, ausências, etc.).</p>

        {/* Calendário */}
        <div className="max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => { if (calMes === 0) { setCalMes(11); setCalAno(a => a - 1) } else setCalMes(m => m - 1) }}
              className="p-1.5 rounded-lg hover:bg-cream-200 text-gray-500"
            >‹</button>
            <span className="text-sm font-semibold text-gray-800">{MESES[calMes]} {calAno}</span>
            <button
              onClick={() => { if (calMes === 11) { setCalMes(0); setCalAno(a => a + 1) } else setCalMes(m => m + 1) }}
              className="p-1.5 rounded-lg hover:bg-cream-200 text-gray-500"
            >›</button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DIAS_CURTOS.map(d => <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const ds = toDateString(calAno, calMes, day)
              const bloqueado = bloqDatas.has(ds)
              const passado   = new Date(ds) < new Date(hoje.toDateString())
              return (
                <button
                  key={day}
                  disabled={passado}
                  onClick={() => !bloqueado && setAddBloq({ data: ds, motivo: '' })}
                  title={bloqueado ? 'Clique para remover bloqueio' : ''}
                  className={`aspect-square rounded-lg text-xs font-medium transition-colors ${
                    passado   ? 'text-gray-200 cursor-not-allowed' :
                    bloqueado ? 'bg-red-400 text-white hover:bg-red-500' :
                               'hover:bg-sage-100 text-gray-700'
                  }`}
                >{day}</button>
              )
            })}
          </div>
        </div>

        {/* Modal adicionar bloqueio */}
        {addBloq && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 max-w-sm">
            <p className="text-sm font-medium text-red-700 mb-2">Bloquear {formatDatePT(addBloq.data)}</p>
            <input
              type="text"
              placeholder="Motivo (opcional)"
              value={addBloq.motivo}
              onChange={e => setAddBloq(b => b ? { ...b, motivo: e.target.value } : b)}
              className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
            />
            <div className="flex gap-2">
              <button
                onClick={adicionarBloqueio}
                disabled={addingBloq}
                className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                {addingBloq ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Bloquear dia
              </button>
              <button onClick={() => setAddBloq(null)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de bloqueios activos */}
        {bloqueios.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium text-gray-500 mb-2">Dias bloqueados:</p>
            <div className="flex flex-wrap gap-2">
              {bloqueios.map(b => (
                <div key={b.id} className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 text-xs text-red-700">
                  <span>{formatDatePT(b.data)}{b.motivo ? ` — ${b.motivo}` : ''}</span>
                  <button onClick={() => removerBloqueio(b.id)} className="hover:text-red-900">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
