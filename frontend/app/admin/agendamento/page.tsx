'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, Settings, Ban, RefreshCw, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Loader2, Trash2, Clock,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

function adminHeaders() {
  return { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET }
}

const DIAS_SEMANA_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DIAS_SEMANA_SHORT  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

type Tab = 'agendamentos' | 'disponibilidade' | 'bloqueios'

interface Agendamento {
  id: string
  data: string
  hora: string
  nome_cliente: string
  email_cliente: string
  telefone?: string
  servico: string
  modalidade: string
  status: 'pendente' | 'confirmado' | 'cancelado'
  mensagem?: string
  criado_em: string
}

interface DiaDispo {
  dia_semana: number   // 0-6
  hora_inicio: string  // HH:MM
  hora_fim: string
  intervalo_min: number
  ativo: boolean
}

interface Bloqueio {
  id: string
  data: string
  motivo?: string
}

// ─── Helper ──────────────────────────────────────────────────
async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...opts, headers: { ...adminHeaders(), ...(opts.headers ?? {}) } })
  const text = await res.text()
  if (!text) throw new Error('Resposta vazia do servidor')
  let json: unknown
  try { json = JSON.parse(text) } catch { throw new Error('Resposta inválida do servidor') }
  if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Erro')
  return json as T
}

// ─── Componente principal ─────────────────────────────────────
export default function AdminAgendamentoPage() {
  const [tab, setTab] = useState<Tab>('agendamentos')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Agendamento</h1>
        <p className="text-sm text-gray-400 mt-1">Consultas, disponibilidade e bloqueios de agenda</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream-100 border border-cream-300 rounded-2xl p-1 w-fit">
        {([
          { key: 'agendamentos', label: 'Agendamentos', icon: Calendar },
          { key: 'disponibilidade', label: 'Disponibilidade', icon: Settings },
          { key: 'bloqueios', label: 'Bloqueios', icon: Ban },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab === key ? 'bg-sage-400 text-white shadow-soft' : 'text-gray-500 hover:text-gray-800'
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'agendamentos'   && <TabAgendamentos />}
      {tab === 'disponibilidade' && <TabDisponibilidade />}
      {tab === 'bloqueios'      && <TabBloqueios />}
    </div>
  )
}

// ─── Tab: Agendamentos ────────────────────────────────────────
function TabAgendamentos() {
  const [lista, setLista]       = useState<Agendamento[]>([])
  const [loading, setLoading]   = useState(true)
  const [filtro, setFiltro]     = useState<'todos' | 'pendente' | 'confirmado' | 'cancelado'>('todos')
  const [erro, setErro]         = useState('')
  const [detalhe, setDetalhe]   = useState<Agendamento | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<Agendamento[]>('/agendamento/admin')
      setLista(data)
    } catch (e) { setErro(String(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function atualizarStatus(id: string, status: 'confirmado' | 'cancelado') {
    try {
      await api(`/agendamento/admin/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setLista(l => l.map(a => a.id === id ? { ...a, status } : a))
      if (detalhe?.id === id) setDetalhe(d => d ? { ...d, status } : d)
    } catch (e) { alert(String(e)) }
  }

  const filtrados = filtro === 'todos' ? lista : lista.filter(a => a.status === filtro)

  const statusVariant: Record<string, 'sage' | 'amber' | 'cream'> = {
    confirmado: 'sage', pendente: 'amber', cancelado: 'cream',
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {(['todos', 'pendente', 'confirmado', 'cancelado'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all capitalize',
              filtro === f ? 'bg-sage-400 text-white border-sage-400' : 'border-cream-400 text-gray-500 hover:border-sage-300'
            )}
          >{f}</button>
        ))}
        <button onClick={carregar} className="ml-auto p-1.5 rounded-xl hover:bg-cream-300 text-gray-400 transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {erro && <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{erro}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> A carregar…
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Sem agendamentos.</div>
      ) : (
        <div className="grid gap-3">
          {filtrados.map((a) => (
            <Card
              key={a.id}
              hover
              className="cursor-pointer"
              onClick={() => setDetalhe(a)}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-sage-100 text-sage-600 flex flex-col items-center justify-center text-xs font-bold flex-shrink-0">
                  <span>{new Date(a.data + 'T12:00:00').getDate()}</span>
                  <span className="text-sage-400">{MESES[new Date(a.data + 'T12:00:00').getMonth()]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{a.nome_cliente}</p>
                  <p className="text-xs text-gray-400">{a.hora} · {a.servico} · {a.modalidade}</p>
                </div>
                <Badge variant={statusVariant[a.status] ?? 'cream'} className="flex-shrink-0 capitalize">
                  {a.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de detalhe */}
      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetalhe(null)}>
          <div className="bg-cream-100 rounded-2xl shadow-card max-w-md w-full p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900">Detalhe do Agendamento</h3>
              <button onClick={() => setDetalhe(null)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
            </div>
            <dl className="space-y-2 text-sm mb-6">
              {[
                ['Cliente', detalhe.nome_cliente],
                ['E-mail', detalhe.email_cliente],
                ['Telefone', detalhe.telefone ?? '—'],
                ['Data', `${detalhe.data} às ${detalhe.hora}`],
                ['Serviço', detalhe.servico],
                ['Modalidade', detalhe.modalidade],
                ['Mensagem', detalhe.mensagem ?? '—'],
                ['Estado', detalhe.status],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-24 flex-shrink-0 text-gray-400">{label}</dt>
                  <dd className="text-gray-800 font-medium capitalize">{value}</dd>
                </div>
              ))}
            </dl>
            {detalhe.status === 'pendente' && (
              <div className="flex gap-3">
                <Button size="sm" variant="outline" className="flex-1 gap-1 text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => atualizarStatus(detalhe.id, 'cancelado')}>
                  <XCircle className="h-4 w-4" /> Cancelar
                </Button>
                <Button size="sm" className="flex-1 gap-1"
                  onClick={() => atualizarStatus(detalhe.id, 'confirmado')}>
                  <CheckCircle className="h-4 w-4" /> Confirmar
                </Button>
              </div>
            )}
            {detalhe.status === 'confirmado' && (
              <Button size="sm" variant="outline" className="w-full gap-1 text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => atualizarStatus(detalhe.id, 'cancelado')}>
                <XCircle className="h-4 w-4" /> Cancelar consulta
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Disponibilidade ─────────────────────────────────────
function TabDisponibilidade() {
  const [dispo, setDispo]     = useState<DiaDispo[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dia_semana: i, hora_inicio: '09:00', hora_fim: '18:00',
      intervalo_min: 60, ativo: i >= 1 && i <= 5,
    }))
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [ok, setOk]           = useState(false)

  useEffect(() => {
    api<DiaDispo[]>('/agendamento/admin/disponibilidade')
      .then(data => { if (data.length) setDispo(data) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  function atualizar(dia: number, campo: keyof DiaDispo, valor: string | boolean | number) {
    setDispo(d => d.map(x => x.dia_semana === dia ? { ...x, [campo]: valor } : x))
  }

  async function salvar() {
    setSaving(true); setOk(false)
    try {
      await api('/agendamento/admin/disponibilidade', { method: 'PUT', body: JSON.stringify(dispo) })
      setOk(true); setTimeout(() => setOk(false), 3000)
    } catch (e) { alert(String(e)) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="h-5 w-5 animate-spin mr-2" />A carregar…</div>

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <Clock className="h-4 w-4 text-sage-500" /> Horários por dia da semana
        </h3>
        <div className="space-y-3">
          {dispo.map((d) => (
            <div key={d.dia_semana} className={cn('flex flex-wrap items-center gap-3 p-3 rounded-xl border transition-all',
              d.ativo ? 'border-sage-200 bg-sage-50/50' : 'border-cream-300 bg-cream-200/50 opacity-60')}>
              <div className="w-24">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={d.ativo} onChange={e => atualizar(d.dia_semana, 'ativo', e.target.checked)}
                    className="rounded accent-sage-400" />
                  <span className="text-sm font-medium text-gray-700">{DIAS_SEMANA_LABELS[d.dia_semana]}</span>
                </label>
              </div>
              {d.ativo && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Das</label>
                    <input type="time" value={d.hora_inicio} onChange={e => atualizar(d.dia_semana, 'hora_inicio', e.target.value)}
                      className="h-8 rounded-lg border border-cream-400 bg-cream-100 px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">às</label>
                    <input type="time" value={d.hora_fim} onChange={e => atualizar(d.dia_semana, 'hora_fim', e.target.value)}
                      className="h-8 rounded-lg border border-cream-400 bg-cream-100 px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Intervalo</label>
                    <select value={d.intervalo_min} onChange={e => atualizar(d.dia_semana, 'intervalo_min', Number(e.target.value))}
                      className="h-8 rounded-lg border border-cream-400 bg-cream-100 px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400">
                      <option value={30}>30 min</option>
                      <option value={50}>50 min</option>
                      <option value={60}>60 min</option>
                      <option value={75}>75 min</option>
                      <option value={90}>90 min</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-6">
          <Button onClick={salvar} loading={saving} className="gap-2">
            {ok ? <><CheckCircle className="h-4 w-4" /> Guardado!</> : 'Guardar disponibilidade'}
          </Button>
          {ok && <span className="text-sm text-sage-600 font-medium">Disponibilidade actualizada.</span>}
        </div>
      </Card>
    </div>
  )
}

// ─── Tab: Bloqueios ───────────────────────────────────────────
function TabBloqueios() {
  const today = new Date()
  const [year, setYear]       = useState(today.getFullYear())
  const [month, setMonth]     = useState(today.getMonth())
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([])
  const [loading, setLoading] = useState(true)
  const [motivo, setMotivo]   = useState('')

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<Bloqueio[]>('/agendamento/admin/bloqueios')
      setBloqueios(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function isBloqueado(day: number) {
    return bloqueios.some(b => b.data === dateStr(day))
  }

  function isPast(day: number) {
    return new Date(year, month, day) < new Date(new Date().setHours(0, 0, 0, 0))
  }

  async function toggleBloqueio(day: number) {
    const data = dateStr(day)
    const existente = bloqueios.find(b => b.data === data)
    if (existente) {
      await api(`/agendamento/admin/bloqueios/${existente.id}`, { method: 'DELETE' })
      setBloqueios(b => b.filter(x => x.id !== existente.id))
    } else {
      const criado = await api<Bloqueio>('/agendamento/admin/bloqueios', {
        method: 'POST', body: JSON.stringify({ data, motivo: motivo || undefined }),
      })
      setBloqueios(b => [...b, criado])
    }
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Calendário */}
      <div className="lg:col-span-2">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-800">
              {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][month]} {year}
            </h3>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-500 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-500 transition-colors"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DIAS_SEMANA_SHORT.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const bloqueado = isBloqueado(d)
                const passado   = isPast(d)
                return (
                  <button key={d} disabled={passado} onClick={() => toggleBloqueio(d)}
                    title={bloqueado ? 'Clique para desbloquear' : 'Clique para bloquear'}
                    className={cn(
                      'relative h-10 w-full rounded-xl text-sm font-medium transition-all',
                      bloqueado && 'bg-red-400 text-white',
                      !bloqueado && !passado && 'hover:bg-cream-300 text-gray-700',
                      passado && 'text-gray-300 cursor-not-allowed',
                    )}>
                    {d}
                  </button>
                )
              })}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">Clique num dia para bloquear/desbloquear. Dias bloqueados não aceitam agendamentos.</p>
        </Card>
      </div>

      {/* Painel lateral */}
      <div className="space-y-4">
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Motivo do bloqueio</h3>
          <Input placeholder="Ex.: Férias, Congresso…" value={motivo} onChange={e => setMotivo(e.target.value)} />
          <p className="text-xs text-gray-400 mt-2">Opcional. Aplicado ao próximo dia que clicar.</p>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Dias bloqueados</h3>
          {bloqueios.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum bloqueio activo.</p>
          ) : (
            <div className="space-y-2">
              {bloqueios.sort((a, b) => a.data.localeCompare(b.data)).map(b => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded-xl bg-red-50 border border-red-100 text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{b.data}</p>
                    {b.motivo && <p className="text-xs text-gray-400">{b.motivo}</p>}
                  </div>
                  <button onClick={async () => {
                    await api(`/agendamento/admin/bloqueios/${b.id}`, { method: 'DELETE' })
                    setBloqueios(bl => bl.filter(x => x.id !== b.id))
                  }} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
