'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, Settings, Ban, RefreshCw, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Loader2, Trash2, Clock, Plus, Gift,
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

const DIAS_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DIAS_SHORT  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

type Tab = 'dia' | 'agendamentos' | 'disponibilidade' | 'bloqueios' | 'oferecer'

interface Agendamento {
  id: string; data: string; hora: string
  nome_cliente: string; email_cliente: string
  telefone?: string; servico: string; modalidade: string
  status: 'pendente' | 'confirmado' | 'cancelado'
  mensagem?: string; criado_em: string
}

interface DiaDispo {
  dia_semana: number; hora_inicio: string; hora_fim: string
  intervalo_min: number; ativo: boolean
}

interface Bloqueio {
  id: string; data: string; hora_inicio?: string; hora_fim?: string; motivo?: string
}

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...opts, headers: { ...adminHeaders(), ...(opts.headers ?? {}) } })
  const text = await res.text()
  if (!text) throw new Error('Resposta vazia do servidor')
  let json: unknown
  try { json = JSON.parse(text) } catch { throw new Error('Resposta inválida do servidor') }
  if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Erro')
  return json as T
}

export default function AdminAgendamentoPage() {
  const [tab, setTab] = useState<Tab>('dia')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Agendamento</h1>
        <p className="text-sm text-gray-400 mt-1">Agenda, disponibilidade e bloqueios</p>
      </div>

      <div className="flex gap-1 bg-cream-100 border border-cream-300 rounded-2xl p-1 w-fit flex-wrap">
        {([
          { key: 'dia',            label: 'Agenda do Dia',   icon: Calendar },
          { key: 'agendamentos',   label: 'Consultas',       icon: CheckCircle },
          { key: 'disponibilidade',label: 'Disponibilidade', icon: Settings },
          { key: 'bloqueios',      label: 'Bloqueios',       icon: Ban },
          { key: 'oferecer',       label: 'Oferecer Sessão', icon: Gift },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab === key ? 'bg-sage-400 text-white shadow-soft' : 'text-gray-500 hover:text-gray-800')}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'dia'             && <TabAgendaDia />}
      {tab === 'agendamentos'    && <TabAgendamentos />}
      {tab === 'disponibilidade' && <TabDisponibilidade />}
      {tab === 'bloqueios'       && <TabBloqueios />}
      {tab === 'oferecer'        && <TabOferecer />}
    </div>
  )
}

// ─── Tab: Oferecer Sessão Gratuita ────────────────────────────
function TabOferecer() {
  const [email, setEmail]           = useState('')
  const [nome, setNome]             = useState('')
  const [sessoes, setSessoes]       = useState(1)
  const [validade, setValidade]     = useState(30)
  const [enviando, setEnviando]     = useState(false)
  const [resultado, setResultado]   = useState<{ url: string } | null>(null)
  const [erro, setErro]             = useState('')

  async function handleOferecer(e: { preventDefault(): void }) {
    e.preventDefault()
    setEnviando(true); setErro(''); setResultado(null)
    try {
      const r = await fetch(`${API}/pacotes/admin/credito-oferta`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ email, nome, sessoes, validade_dias: validade }),
      })
      const d = await r.json()
      if (!r.ok) { setErro(d.error ?? 'Erro ao criar crédito'); return }
      setResultado(d)
      setEmail(''); setNome('')
    } catch { setErro('Erro de ligação.') }
    finally { setEnviando(false) }
  }

  return (
    <Card className="max-w-md">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Oferecer sessão gratuita</h2>
      <p className="text-sm text-gray-400 mb-5">Cria um crédito manual para o cliente agendar sem pagamento.</p>

      {resultado && (
        <div className="mb-4 rounded-xl bg-sage-50 border border-sage-200 p-4 text-sm text-sage-800">
          <p className="font-semibold mb-1">✓ Crédito criado com sucesso!</p>
          <p className="text-xs text-gray-500 mb-2">Envie este link ao cliente:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-white border border-sage-200 px-2 py-1 text-xs break-all">{resultado.url}</code>
            <button onClick={() => navigator.clipboard.writeText(resultado.url)}
              className="text-sage-600 text-xs font-medium hover:underline whitespace-nowrap">Copiar</button>
          </div>
        </div>
      )}

      <form onSubmit={handleOferecer} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Nome do cliente</label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo"
            className="w-full h-9 px-3 rounded-xl border border-cream-400 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">E-mail do cliente *</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com"
            className="w-full h-9 px-3 rounded-xl border border-cream-400 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Nº sessões</label>
            <input type="number" min={1} max={20} value={sessoes} onChange={e => setSessoes(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-xl border border-cream-400 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Validade (dias)</label>
            <input type="number" min={7} max={365} value={validade} onChange={e => setValidade(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-xl border border-cream-400 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400" />
          </div>
        </div>
        {erro && <p className="text-sm text-red-500">{erro}</p>}
        <Button type="submit" loading={enviando} disabled={!email} className="w-full gap-2">
          <Gift className="h-4 w-4" /> Criar crédito gratuito
        </Button>
      </form>
    </Card>
  )
}

// ─── Tab: Agenda do Dia ───────────────────────────────────────
function TabAgendaDia() {
  const hoje = new Date().toISOString().slice(0, 10)
  const [data, setData] = useState(hoje)
  const [slots, setSlots] = useState<string[]>([])
  const [consultas, setConsultas] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(false)
  const [detalhe, setDetalhe] = useState<Agendamento | null>(null)
  const [remarkModal, setRemarkModal] = useState<Agendamento | null>(null)
  const [novaData, setNovaData] = useState('')
  const [novaHora, setNovaHora] = useState('')
  const [saving, setSaving] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [slotsRes, all] = await Promise.all([
        api<{ slots: string[] }>(`/agendamento/slots?data=${data}`),
        api<Agendamento[]>('/agendamento/admin'),
      ])
      setSlots(slotsRes.slots)
      setConsultas(all.filter(a => a.data === data && a.status !== 'cancelado'))
    } catch { /* ignore */ }
    setLoading(false)
  }, [data])

  useEffect(() => { carregar() }, [carregar])

  function prevDia() {
    const d = new Date(data + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    setData(d.toISOString().slice(0, 10))
  }
  function nextDia() {
    const d = new Date(data + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    setData(d.toISOString().slice(0, 10))
  }

  async function atualizarStatus(id: string, status: 'confirmado' | 'cancelado') {
    try {
      await api(`/agendamento/admin/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setConsultas(l => l.map(a => a.id === id ? { ...a, status } : a))
      setDetalhe(d => d?.id === id ? { ...d, status } : d)
      await carregar()
    } catch (e) { alert(String(e)) }
  }

  async function remarcar() {
    if (!remarkModal || !novaData || !novaHora) return
    setSaving(true)
    try {
      await api(`/agendamento/admin/${remarkModal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ data: novaData, hora: novaHora, status: 'confirmado' }),
      })
      setRemarkModal(null)
      setDetalhe(null)
      await carregar()
    } catch (e) { alert(String(e)) }
    setSaving(false)
  }

  // All time slots for the day (booked + free)
  const todasAsHoras = [
    ...slots,
    ...consultas.map(c => c.hora.slice(0, 5)),
  ].filter((v, i, a) => a.indexOf(v) === i).sort()

  const dataObj = new Date(data + 'T12:00:00')
  const diaSemana = DIAS_LABELS[dataObj.getDay()]

  return (
    <div className="space-y-4">
      {/* Navegação de data */}
      <Card className="flex items-center gap-4">
        <button onClick={prevDia} className="p-2 rounded-xl hover:bg-cream-300 text-gray-500 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-gray-900">{diaSemana}</p>
          <p className="text-sm text-gray-400">{dataObj.getDate()} de {MESES_FULL[dataObj.getMonth()]} de {dataObj.getFullYear()}</p>
        </div>
        <button onClick={nextDia} className="p-2 rounded-xl hover:bg-cream-300 text-gray-500 transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
        <input type="date" value={data} onChange={e => setData(e.target.value)}
          className="h-9 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
        <button onClick={carregar} className="p-2 rounded-xl hover:bg-cream-300 text-gray-400 transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> A carregar…
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {todasAsHoras.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400 text-sm">
              Sem horários disponíveis para este dia.
            </div>
          )}
          {todasAsHoras.map(hora => {
            const consulta = consultas.find(c => c.hora.slice(0, 5) === hora)
            const livre = slots.includes(hora) && !consulta
            return (
              <button key={hora} onClick={() => consulta && setDetalhe(consulta)}
                className={cn('p-4 rounded-2xl border text-left transition-all',
                  consulta?.status === 'confirmado' && 'border-sage-300 bg-sage-50 cursor-pointer hover:bg-sage-100',
                  consulta?.status === 'pendente' && 'border-amber-300 bg-amber-50 cursor-pointer hover:bg-amber-100',
                  livre && 'border-cream-300 bg-cream-100 cursor-default',
                )}>
                <p className="font-bold text-gray-800 text-lg">{hora}</p>
                {consulta ? (
                  <>
                    <p className="text-sm font-medium text-gray-700 mt-1">{consulta.nome_cliente}</p>
                    <p className="text-xs text-gray-400">{consulta.servico}</p>
                    <Badge variant={consulta.status === 'confirmado' ? 'sage' : 'amber'} className="mt-2 capitalize">
                      {consulta.status}
                    </Badge>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">Livre</p>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Resumo */}
      {!loading && (
        <div className="flex gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sage-400 inline-block" /> {consultas.filter(c => c.status === 'confirmado').length} confirmadas</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" /> {consultas.filter(c => c.status === 'pendente').length} pendentes</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cream-400 inline-block" /> {slots.length} livres</span>
        </div>
      )}

      {/* Modal detalhe */}
      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetalhe(null)}>
          <div className="bg-cream-100 rounded-2xl shadow-card max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Consulta</h3>
              <button onClick={() => setDetalhe(null)}><XCircle className="h-5 w-5 text-gray-400" /></button>
            </div>
            <dl className="space-y-2 text-sm mb-6">
              {[
                ['Cliente', detalhe.nome_cliente],
                ['E-mail', detalhe.email_cliente],
                ['Data', `${detalhe.data} às ${detalhe.hora}`],
                ['Serviço', detalhe.servico],
                ['Modalidade', detalhe.modalidade],
                ['Estado', detalhe.status],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-3">
                  <dt className="w-24 flex-shrink-0 text-gray-400">{l}</dt>
                  <dd className="text-gray-800 font-medium capitalize">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-col gap-2">
              <Button size="sm" variant="outline" className="gap-1"
                onClick={() => { setRemarkModal(detalhe); setNovaData(detalhe.data); setNovaHora('') }}>
                <RefreshCw className="h-4 w-4" /> Remarcar
              </Button>
              {detalhe.status === 'pendente' && (
                <Button size="sm" className="gap-1"
                  onClick={() => atualizarStatus(detalhe.id, 'confirmado')}>
                  <CheckCircle className="h-4 w-4" /> Confirmar
                </Button>
              )}
              {detalhe.status !== 'cancelado' && (
                <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => atualizarStatus(detalhe.id, 'cancelado')}>
                  <XCircle className="h-4 w-4" /> Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal remarcar */}
      {remarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRemarkModal(null)}>
          <div className="bg-white rounded-2xl shadow-card max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">Remarcar consulta</h3>
            <p className="text-sm text-gray-500 mb-4">{remarkModal.nome_cliente} — {remarkModal.data} às {remarkModal.hora}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nova data</label>
                <input type="date" value={novaData} onChange={e => setNovaData(e.target.value)} min={hoje}
                  className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nova hora</label>
                <input type="time" value={novaHora} onChange={e => setNovaHora(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setRemarkModal(null)}>Cancelar</Button>
              <Button size="sm" className="flex-1 gap-1" disabled={!novaData || !novaHora || saving} onClick={remarcar}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Todas as Consultas ──────────────────────────────────
function TabAgendamentos() {
  const [lista, setLista]     = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro]   = useState<'todos' | 'pendente' | 'confirmado' | 'cancelado'>('todos')
  const [erro, setErro]       = useState('')
  const [detalhe, setDetalhe] = useState<Agendamento | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try { setLista(await api<Agendamento[]>('/agendamento/admin')) }
    catch (e) { setErro(String(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function atualizarStatus(id: string, status: 'confirmado' | 'cancelado') {
    try {
      await api(`/agendamento/admin/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setLista(l => l.map(a => a.id === id ? { ...a, status } : a))
      setDetalhe(d => d?.id === id ? { ...d, status } : d)
    } catch (e) { alert(String(e)) }
  }

  const filtrados = filtro === 'todos' ? lista : lista.filter(a => a.status === filtro)
  const statusVariant: Record<string, 'sage' | 'amber' | 'cream'> = {
    confirmado: 'sage', pendente: 'amber', cancelado: 'cream',
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['todos', 'pendente', 'confirmado', 'cancelado'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all capitalize',
              filtro === f ? 'bg-sage-400 text-white border-sage-400' : 'border-cream-400 text-gray-500 hover:border-sage-300')}>
            {f}
          </button>
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
          {filtrados.map(a => (
            <Card key={a.id} hover className="cursor-pointer" onClick={() => setDetalhe(a)}>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-sage-100 text-sage-600 flex flex-col items-center justify-center text-xs font-bold flex-shrink-0">
                  <span>{new Date(a.data + 'T12:00:00').getDate()}</span>
                  <span className="text-sage-400">{MESES[new Date(a.data + 'T12:00:00').getMonth()]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{a.nome_cliente}</p>
                  <p className="text-xs text-gray-400">{a.hora} · {a.servico} · {a.modalidade}</p>
                </div>
                <Badge variant={statusVariant[a.status] ?? 'cream'} className="flex-shrink-0 capitalize">{a.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetalhe(null)}>
          <div className="bg-cream-100 rounded-2xl shadow-card max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900">Detalhe da Consulta</h3>
              <button onClick={() => setDetalhe(null)}><XCircle className="h-5 w-5 text-gray-400" /></button>
            </div>
            <dl className="space-y-2 text-sm mb-6">
              {[
                ['Cliente', detalhe.nome_cliente],
                ['E-mail', detalhe.email_cliente],
                ['Telefone', detalhe.telefone ?? '—'],
                ['Data', `${detalhe.data} às ${detalhe.hora}`],
                ['Serviço', detalhe.servico],
                ['Modalidade', detalhe.modalidade],
                ['Estado', detalhe.status],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-3">
                  <dt className="w-24 flex-shrink-0 text-gray-400">{l}</dt>
                  <dd className="text-gray-800 font-medium capitalize">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-col gap-2">
              {detalhe.status === 'pendente' && (
                <Button size="sm" className="gap-1"
                  onClick={() => atualizarStatus(detalhe.id, 'confirmado')}>
                  <CheckCircle className="h-4 w-4" /> Confirmar
                </Button>
              )}
              {detalhe.status !== 'cancelado' && (
                <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => atualizarStatus(detalhe.id, 'cancelado')}>
                  <XCircle className="h-4 w-4" /> Cancelar consulta
                </Button>
              )}
            </div>
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
      .then(data => {
        if (data.length) {
          setDispo(prev => prev.map(p => {
            const found = data.find(d => d.dia_semana === p.dia_semana)
            return found ?? p
          }))
        }
      })
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
          {dispo.map(d => (
            <div key={d.dia_semana} className={cn('flex flex-wrap items-center gap-3 p-3 rounded-xl border transition-all',
              d.ativo ? 'border-sage-200 bg-sage-50/50' : 'border-cream-300 bg-cream-200/50 opacity-60')}>
              <div className="w-24">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={d.ativo}
                    onChange={e => atualizar(d.dia_semana, 'ativo', e.target.checked)}
                    className="rounded accent-sage-400" />
                  <span className="text-sm font-medium text-gray-700">{DIAS_LABELS[d.dia_semana]}</span>
                </label>
              </div>
              {d.ativo && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Das</label>
                    <input type="time" value={d.hora_inicio}
                      onChange={e => atualizar(d.dia_semana, 'hora_inicio', e.target.value)}
                      className="h-8 rounded-lg border border-cream-400 bg-cream-100 px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">às</label>
                    <input type="time" value={d.hora_fim}
                      onChange={e => atualizar(d.dia_semana, 'hora_fim', e.target.value)}
                      className="h-8 rounded-lg border border-cream-400 bg-cream-100 px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Intervalo</label>
                    <select value={d.intervalo_min}
                      onChange={e => atualizar(d.dia_semana, 'intervalo_min', Number(e.target.value))}
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
          <Button onClick={salvar} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : ok ? <CheckCircle className="h-4 w-4" /> : null}
            {ok ? 'Guardado!' : 'Guardar disponibilidade'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─── Tab: Bloqueios ───────────────────────────────────────────
function TabBloqueios() {
  const today = new Date()
  const [year, setYear]         = useState(today.getFullYear())
  const [month, setMonth]       = useState(today.getMonth())
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([])
  const [loading, setLoading]   = useState(true)
  const [motivo, setMotivo]     = useState('')
  const [modo, setModo]         = useState<'dia' | 'horario'>('dia')
  const [horaIni, setHoraIni]   = useState('09:00')
  const [horaFim, setHoraFim]   = useState('10:00')
  const [dataManual, setDataManual] = useState('')
  const [addingManual, setAddingManual] = useState(false)

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const carregar = useCallback(async () => {
    setLoading(true)
    try { setBloqueios(await api<Bloqueio[]>('/agendamento/admin/bloqueios')) }
    catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function isBloqueadoDia(day: number) {
    return bloqueios.some(b => b.data === dateStr(day) && !b.hora_inicio)
  }

  function temBloqueioHorario(day: number) {
    return bloqueios.some(b => b.data === dateStr(day) && b.hora_inicio)
  }

  function isPast(day: number) {
    return new Date(year, month, day) < new Date(new Date().setHours(0, 0, 0, 0))
  }

  async function toggleBloqueio(day: number) {
    const data = dateStr(day)
    if (modo === 'dia') {
      const existente = bloqueios.find(b => b.data === data && !b.hora_inicio)
      if (existente) {
        await api(`/agendamento/admin/bloqueios/${existente.id}`, { method: 'DELETE' })
        setBloqueios(b => b.filter(x => x.id !== existente.id))
      } else {
        const criado = await api<Bloqueio>('/agendamento/admin/bloqueios', {
          method: 'POST',
          body: JSON.stringify({ data, motivo: motivo || undefined }),
        })
        setBloqueios(b => [...b, criado])
      }
    } else {
      // Block specific hours
      const criado = await api<Bloqueio>('/agendamento/admin/bloqueios', {
        method: 'POST',
        body: JSON.stringify({ data, hora_inicio: horaIni, hora_fim: horaFim, motivo: motivo || undefined }),
      })
      setBloqueios(b => [...b, criado])
    }
  }

  async function adicionarBloqueioManual() {
    if (!dataManual) return
    setAddingManual(true)
    try {
      const payload: Record<string, string> = { data: dataManual }
      if (modo === 'horario') { payload.hora_inicio = horaIni; payload.hora_fim = horaFim }
      if (motivo) payload.motivo = motivo
      const criado = await api<Bloqueio>('/agendamento/admin/bloqueios', {
        method: 'POST', body: JSON.stringify(payload),
      })
      setBloqueios(b => [...b, criado])
      setDataManual('')
    } catch (e) { alert(String(e)) }
    setAddingManual(false)
  }

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Calendário */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">{MESES_FULL[month]} {year}</h3>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-500 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-500 transition-colors"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DIAS_SHORT.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                const bloqDia   = isBloqueadoDia(d)
                const bloqHora  = temBloqueioHorario(d)
                const passado   = isPast(d)
                return (
                  <button key={d} disabled={passado} onClick={() => toggleBloqueio(d)}
                    className={cn(
                      'relative h-10 w-full rounded-xl text-sm font-medium transition-all',
                      bloqDia  && 'bg-red-400 text-white',
                      bloqHora && !bloqDia && 'bg-amber-200 text-amber-800',
                      !bloqDia && !bloqHora && !passado && 'hover:bg-cream-300 text-gray-700',
                      passado  && 'text-gray-300 cursor-not-allowed',
                    )}>
                    {d}
                    {bloqHora && !bloqDia && <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  </button>
                )
              })}
            </div>
          )}
          <div className="flex gap-4 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-400 inline-block" /> Dia bloqueado</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-200 inline-block" /> Horário bloqueado</span>
          </div>
        </Card>
      </div>

      {/* Painel lateral */}
      <div className="space-y-4">
        {/* Tipo de bloqueio */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">Tipo de bloqueio</h3>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setModo('dia')}
              className={cn('flex-1 py-1.5 rounded-xl text-xs font-medium border transition-all',
                modo === 'dia' ? 'bg-sage-400 text-white border-sage-400' : 'border-cream-400 text-gray-500')}>
              Dia inteiro
            </button>
            <button onClick={() => setModo('horario')}
              className={cn('flex-1 py-1.5 rounded-xl text-xs font-medium border transition-all',
                modo === 'horario' ? 'bg-sage-400 text-white border-sage-400' : 'border-cream-400 text-gray-500')}>
              Horário específico
            </button>
          </div>

          {modo === 'horario' && (
            <div className="flex items-center gap-2 mb-3">
              <input type="time" value={horaIni} onChange={e => setHoraIni(e.target.value)}
                className="flex-1 h-8 px-2 rounded-lg border border-cream-400 bg-cream-100 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400" />
              <span className="text-xs text-gray-400">até</span>
              <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)}
                className="flex-1 h-8 px-2 rounded-lg border border-cream-400 bg-cream-100 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400" />
            </div>
          )}

          <Input placeholder="Motivo (opcional)" value={motivo} onChange={e => setMotivo(e.target.value)} />
          <p className="text-xs text-gray-400 mt-2">Clique num dia no calendário para bloquear.</p>
        </Card>

        {/* Adicionar bloqueio manual */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Bloqueio manual
          </h3>
          <input type="date" value={dataManual} onChange={e => setDataManual(e.target.value)}
            className="w-full h-9 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-sage-400" />
          <Button size="sm" className="w-full" disabled={!dataManual || addingManual} onClick={adicionarBloqueioManual}>
            {addingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar bloqueio'}
          </Button>
        </Card>

        {/* Lista de bloqueios */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">Bloqueios activos</h3>
          {bloqueios.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum bloqueio.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {bloqueios.sort((a, b) => a.data.localeCompare(b.data)).map(b => (
                <div key={b.id} className={cn('flex items-center justify-between p-2 rounded-xl border text-sm',
                  b.hora_inicio ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100')}>
                  <div>
                    <p className="font-medium text-gray-800">{b.data}</p>
                    {b.hora_inicio && <p className="text-xs text-gray-500">{b.hora_inicio} — {b.hora_fim}</p>}
                    {b.motivo && <p className="text-xs text-gray-400">{b.motivo}</p>}
                  </div>
                  <button onClick={async () => {
                    await api(`/agendamento/admin/bloqueios/${b.id}`, { method: 'DELETE' })
                    setBloqueios(bl => bl.filter(x => x.id !== b.id))
                  }} className="text-red-400 hover:text-red-600 transition-colors ml-2 flex-shrink-0">
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
