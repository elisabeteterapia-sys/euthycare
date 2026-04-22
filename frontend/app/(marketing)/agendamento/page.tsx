'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  CalendarDays, Clock, Video, CheckCircle2, ArrowRight, Loader2,
  Mail, Bell, Shield, ChevronDown, ChevronUp, Star, Sparkles,
  Check, CreditCard, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// ─── Tipos ────────────────────────────────────────────────────
interface Pacote {
  id: string
  tipo: 'experimental' | 'pacote'
  nome: string
  numero_sessoes: number
  duracao_min: number
  preco: number
  moeda: string
  validade_dias: number
  destaque: boolean
  descricao: string
}

interface Credito {
  id: string
  sessoes_restantes: number
  validade: string
  pacotes: { nome: string; tipo: string }
}

// ─── Constantes ───────────────────────────────────────────────
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function toDateString(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function getCalendarDays(y: number, m: number) {
  return { firstDay: new Date(y, m, 1).getDay(), daysInMonth: new Date(y, m + 1, 0).getDate() }
}
function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
}

const confianca = [
  { icon: Mail,   title: 'Confirmação por e-mail',  desc: 'Recebe confirmação imediata com todos os detalhes da sessão.' },
  { icon: Bell,   title: 'Lembrete automático',      desc: 'Enviamos um lembrete 24 h antes para que não falhe a consulta.' },
  { icon: Shield, title: 'Confidencialidade total',  desc: 'Os seus dados e sessões são protegidos segundo o RGPD e Código Deontológico.' },
]

const faq = [
  { q: 'O que é a Consulta Experimental?', a: 'É uma sessão de 50 minutos a 25€ para conhecermos o seu caso e verificar se somos a combinação certa. Disponível apenas uma vez por cliente.' },
  { q: 'Como funciona a consulta online?', a: 'Via videochamada segura. Receberá o link por e-mail. Basta um dispositivo com câmara e microfone.' },
  { q: 'Posso remarcar ou cancelar?', a: 'Sim, gratuitamente até 24 h antes. Responda ao e-mail de confirmação ou contacte-nos directamente.' },
  { q: 'Os créditos expiram?', a: 'Sim. Cada pacote tem validade: Essencial 30 dias, Evolução 60 dias, Premium 90 dias. A Consulta Experimental tem 30 dias.' },
]

// ─── Componente FAQ ───────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-cream-300 last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-gray-800 hover:text-sage-600 transition-colors">
        {q}
        {open ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
      </button>
      {open && <p className="pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>}
    </div>
  )
}

// ─── Secção: escolha de terapeuta ────────────────────────────
interface TerapeutaCard {
  id: string; nome: string; titulo: string; bio: string
  foto_url: string | null; especialidades: string[]; slug: string; duracao_min: number
}

function SeccaoTerapeutas() {
  const [terapeutas, setTerapeutas] = useState<TerapeutaCard[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    fetch(`${API}/terapeutas`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.terapeutas)) setTerapeutas(d.terapeutas) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20 text-gray-400">
      <Loader2 className="h-6 w-6 animate-spin mr-2" /> A carregar…
    </div>
  )

  return (
    <section id="planos" className="py-20 bg-cream-200">
      <div className="container-app">
        <div className="text-center mb-12">
          <Badge variant="sage" className="mb-4">As nossas terapeutas</Badge>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Escolha a sua terapeuta</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Cada terapeuta tem os seus pacotes e disponibilidade. Clique para ver os preços e agendar.
          </p>
        </div>

        {terapeutas.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Sem terapeutas disponíveis de momento.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {terapeutas.map(t => (
              <a key={t.id} href={`/t/${t.slug}`}
                className="group bg-white rounded-2xl border border-cream-200 p-6 shadow-soft hover:shadow-card hover:border-sage-300 transition-all duration-200 flex flex-col"
              >
                <div className="flex items-center gap-4 mb-4">
                  {t.foto_url ? (
                    <img src={t.foto_url} alt={t.nome}
                      className="h-16 w-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-sage-200 to-lilac-200 flex items-center justify-center text-2xl font-bold text-sage-600 flex-shrink-0">
                      {t.nome.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 group-hover:text-sage-700 transition-colors">{t.nome}</p>
                    <p className="text-sm text-sage-600">{t.titulo}</p>
                    <p className="text-xs text-gray-400">{t.duracao_min} min por sessão</p>
                  </div>
                </div>
                {t.bio && (
                  <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3 flex-1">{t.bio}</p>
                )}
                {t.especialidades?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {t.especialidades.slice(0, 3).map((e: string) => (
                      <span key={e} className="text-xs bg-sage-50 text-sage-600 border border-sage-200 rounded-full px-2.5 py-0.5">{e}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-cream-200">
                  <span className="text-xs text-gray-400">Ver consulta experimental · pacotes</span>
                  <ArrowRight className="h-4 w-4 text-sage-400 group-hover:text-sage-600 group-hover:translate-x-1 transition-all" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Secção de Preços (legado — mantido para compatibilidade) ─
function SeccaoPacotes() {
  const [pacotes, setPacotes]     = useState<Pacote[]>([])
  const [loading, setLoading]     = useState(true)
  const [email, setEmail]         = useState('')
  const [nome, setNome]           = useState('')
  const [pacoteSel, setPacoteSel] = useState<Pacote | null>(null)
  const [comprando, setComprando] = useState(false)
  const [erro, setErro]           = useState('')
  const [hasExp, setHasExp]       = useState(false)

  useEffect(() => {
    fetch(`${API}/pacotes`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPacotes(data) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  async function verificarEmail(email: string) {
    if (!email) return
    try {
      const r = await fetch(`${API}/pacotes/creditos?email=${encodeURIComponent(email)}`)
      const d = await r.json()
      setHasExp(d.hasExperimental ?? false)
    } catch { /* ignore */ }
  }

  async function handleComprar() {
    if (!pacoteSel || !email || !nome) return
    setComprando(true); setErro('')
    try {
      const r = await fetch(`${API}/pacotes/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacote_id:   pacoteSel.id,
          email,
          nome,
          success_url: `${SITE}/agendamento?sucesso=1&email=${encodeURIComponent(email)}`,
          cancel_url:  `${SITE}/agendamento`,
        }),
      })
      const d = await r.json()
      if (!r.ok) { setErro(d.error ?? 'Erro ao criar checkout'); return }
      window.location.href = d.url
    } catch { setErro('Erro de ligação. Tente novamente.') }
    finally { setComprando(false) }
  }

  const experimental = pacotes.find(p => p.tipo === 'experimental')
  const regulares    = pacotes.filter(p => p.tipo === 'pacote')

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <Loader2 className="h-6 w-6 animate-spin mr-2" /> A carregar planos…
    </div>
  )

  return (
    <section id="planos" className="py-20 bg-cream-200">
      <div className="container-app">
        <div className="text-center mb-12">
          <Badge variant="sage" className="mb-4">Planos & Preços</Badge>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Escolha o seu plano</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Compre um pacote de sessões e agende quando quiser. Sem compromissos de longo prazo.
          </p>
        </div>

        {/* Consulta Experimental */}
        {experimental && !hasExp && (
          <div className="mb-8 max-w-xl mx-auto">
            <div className="relative rounded-2xl border-2 border-lilac-300 bg-gradient-to-br from-lilac-50 to-cream-100 p-6 shadow-lilac">
              <div className="absolute -top-3 left-6">
                <span className="bg-lilac-400 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Novos clientes
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 mt-2">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{experimental.nome}</h3>
                  <p className="text-sm text-gray-500 mb-3">{experimental.descricao}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {experimental.duracao_min} min</span>
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Válido {experimental.validade_dias} dias</span>
                    <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Online</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-bold text-lilac-600">{experimental.preco}€</div>
                  <div className="text-xs text-gray-400">1 sessão</div>
                  <Button variant="lilac" size="sm" className="mt-3" onClick={() => setPacoteSel(experimental)}>
                    Começar aqui
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {experimental && hasExp && (
          <div className="mb-8 max-w-xl mx-auto rounded-2xl border border-cream-300 bg-cream-100 p-4 text-sm text-gray-500 text-center">
            A Consulta Experimental já foi utilizada nesta conta.
          </div>
        )}

        {/* Pacotes — Em breve no App */}
        <div className="max-w-xl mx-auto mb-12 rounded-2xl border border-cream-300 bg-cream-100/80 p-6 text-center">
          <div className="h-10 w-10 rounded-xl bg-sage-100 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-5 w-5 text-sage-500" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">Pacotes de sessões — Em breve</h3>
          <p className="text-sm text-gray-500">Os pacotes de acompanhamento estarão disponíveis na App Euthy, que está a ser desenvolvida. Fique na lista de espera para ser dos primeiros a aceder.</p>
          <a href="/euthy-lancamento" className="inline-block mt-4 text-sm font-medium text-sage-600 hover:underline">Entrar na lista de espera →</a>
        </div>

        {/* Pacotes regulares (oculto) */}
        <div className="hidden grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {regulares.map((p) => (
            <div key={p.id} className={cn(
              'relative rounded-2xl border p-6 flex flex-col transition-all duration-200',
              p.destaque
                ? 'border-sage-400 bg-gradient-to-br from-sage-50 to-cream-100 shadow-card scale-[1.03]'
                : 'border-cream-300 bg-cream-100 hover:border-sage-300 hover:shadow-soft'
            )}>
              {p.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-sage-400 text-white text-xs font-bold px-4 py-1 rounded-full">⭐ Mais popular</span>
                </div>
              )}
              <div className="mb-4 mt-2">
                <h3 className="text-lg font-bold text-gray-900">{p.nome}</h3>
                <p className="text-sm text-gray-500 mt-1">{p.descricao}</p>
              </div>
              <div className="mb-5">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-gray-900">{p.preco}€</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{p.numero_sessoes} sessões · {p.preco / p.numero_sessoes}€/sessão</div>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  `${p.numero_sessoes} sessões de ${p.duracao_min} min`,
                  `Válido por ${p.validade_dias} dias`,
                  'Consulta online segura',
                  ...(p.destaque ? ['Prioridade no agendamento'] : []),
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-sage-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={p.destaque ? 'primary' : 'outline'}
                className="w-full gap-2"
                onClick={() => setPacoteSel(p)}
              >
                <CreditCard className="h-4 w-4" /> Comprar pacote
              </Button>
            </div>
          ))}
        </div>

        {/* Modal de checkout */}
        {pacoteSel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setPacoteSel(null); setErro('') }}>
            <div className="bg-cream-100 rounded-2xl shadow-card max-w-md w-full p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-gray-900 text-lg mb-1">{pacoteSel.nome}</h3>
              <p className="text-sm text-gray-500 mb-5">{pacoteSel.numero_sessoes} sessão(ões) · {pacoteSel.preco}€</p>

              {erro && (
                <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> {erro}
                </div>
              )}

              <div className="space-y-3 mb-5">
                <Input label="Nome completo" placeholder="Maria Silva" value={nome} onChange={e => setNome(e.target.value)} required />
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="maria@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={e => verificarEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setPacoteSel(null); setErro('') }} className="flex-1">Cancelar</Button>
                <Button onClick={handleComprar} loading={comprando} disabled={!email || !nome} className="flex-1 gap-2">
                  <CreditCard className="h-4 w-4" /> Pagar {pacoteSel.preco}€
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Verificador de créditos ──────────────────────────────────
function VerificadorCreditos({ onCreditos }: { onCreditos: (creditos: Credito[], email: string) => void }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')

  async function verificar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErro(''); setLoading(true)
    try {
      const r = await fetch(`${API}/pacotes/creditos?email=${encodeURIComponent(email)}`)
      const d = await r.json()
      if (!r.ok) { setErro(d.error ?? 'Erro ao verificar créditos'); return }
      if (!d.sessoes_restantes) {
        setErro('Sem créditos activos para este e-mail. Adquira um pacote acima.')
        return
      }
      onCreditos(d.creditos, email)
    } catch { setErro('Erro de ligação. Tente novamente.') }
    finally { setLoading(false) }
  }

  return (
    <section id="agendar" className="py-20 bg-cream-100">
      <div className="container-app max-w-md text-center">
        <Badge variant="lilac" className="mb-4">Já tem um pacote?</Badge>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Agendar consulta</h2>
        <p className="text-gray-500 mb-8">Introduza o e-mail com que comprou o pacote para verificar os seus créditos.</p>
        <Card>
          <form onSubmit={verificar} className="space-y-4">
            <Input
              label="E-mail do pacote"
              type="email"
              placeholder="maria@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {erro && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-left">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> {erro}
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full gap-2">
              <ArrowRight className="h-4 w-4" /> Verificar créditos
            </Button>
          </form>
        </Card>
      </div>
    </section>
  )
}

// ─── Wizard de agendamento ────────────────────────────────────
function WizardAgendamento({ creditos, email }: { creditos: Credito[]; email: string }) {
  const today = new Date()
  const [step, setStep]         = useState<1 | 2 | 3>(1)
  const [creditoSel, setCreditoSel] = useState<Credito>(creditos[0])
  const [year, setYear]         = useState(today.getFullYear())
  const [month, setMonth]       = useState(today.getMonth())
  const [dia, setDia]           = useState<number | null>(null)
  const [horario, setHorario]   = useState('')
  const [slots, setSlots]       = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [form, setForm]         = useState({ nome: '', mensagem: '' })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado]   = useState(false)
  const [erro, setErro]         = useState('')

  const { firstDay, daysInMonth } = getCalendarDays(year, month)
  const totalRestantes = creditos.reduce((a, c) => a + c.sessoes_restantes, 0)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
    setDia(null); setHorario('')
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
    setDia(null); setHorario('')
  }

  function isPast(day: number) {
    return new Date(year, month, day) < new Date(new Date().setHours(0, 0, 0, 0))
  }

  const fetchSlots = useCallback(async (d: number) => {
    setLoadingSlots(true); setSlots([]); setHorario('')
    try {
      const r = await fetch(`${API}/agendamento/slots?data=${toDateString(year, month, d)}`)
      const j = await r.json()
      setSlots(j.slots ?? [])
    } catch { setSlots([]) }
    finally { setLoadingSlots(false) }
  }, [year, month])

  useEffect(() => { if (dia !== null) fetchSlots(dia) }, [dia, fetchSlots])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErro(''); setEnviando(true)
    try {
      const r = await fetch(`${API}/agendamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_cliente:  form.nome,
          email_cliente: email,
          mensagem:      form.mensagem,
          data:          toDateString(year, month, dia!),
          hora:          horario,
          servico:       'individual',
          modalidade:    'online',
          credito_id:    creditoSel.id,
        }),
      })
      const j = await r.json()
      if (!r.ok) { setErro(j.error ?? 'Erro ao agendar.'); return }
      setEnviado(true)
    } catch { setErro('Erro de ligação. Tente novamente.') }
    finally { setEnviando(false) }
  }

  if (enviado) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-sage-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-sage-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Consulta agendada!</h2>
        <p className="text-gray-500 mb-2">Receberá uma confirmação por e-mail em breve.</p>
        <div className="mt-5 rounded-2xl bg-cream-100 border border-cream-300 p-5 text-left text-sm space-y-2 max-w-sm mx-auto">
          <div className="flex justify-between"><span className="text-gray-400">Data</span><span className="font-medium">{formatDate(toDateString(year, month, dia!))}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Horário</span><span className="font-medium">{horario}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Pacote</span><span className="font-medium">{creditoSel.pacotes.nome}</span></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Banner de créditos */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-sage-50 border border-sage-200 p-4">
        <CheckCircle2 className="h-5 w-5 text-sage-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">
            {totalRestantes} sessão{totalRestantes !== 1 ? 'ões' : ''} disponível{totalRestantes !== 1 ? 'is' : ''}
          </p>
          <p className="text-xs text-gray-400">Válido até {formatDate(creditoSel.validade)}</p>
        </div>
        {creditos.length > 1 && (
          <select
            value={creditoSel.id}
            onChange={e => setCreditoSel(creditos.find(c => c.id === e.target.value)!)}
            className="h-8 rounded-lg border border-sage-300 bg-white px-2 text-xs text-gray-700 focus:outline-none"
          >
            {creditos.map(c => (
              <option key={c.id} value={c.id}>{c.pacotes.nome} — {c.sessoes_restantes} sessão(ões)</option>
            ))}
          </select>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all',
              step >= s ? 'bg-sage-400 text-white' : 'bg-cream-300 text-gray-400')}>
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            <span className={cn('text-xs font-medium hidden sm:block', step >= s ? 'text-sage-600' : 'text-gray-400')}>
              {['Data', 'Horário', 'Confirmar'][s - 1]}
            </span>
            {s < 3 && <div className={cn('flex-1 h-px', step > s ? 'bg-sage-400' : 'bg-cream-300')} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Calendário */}
      {step === 1 && (
        <Card className="animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Escolha a data</h3>
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-cream-300 text-gray-500">←</button>
            <span className="font-semibold text-gray-800">{MESES[month]} {year}</span>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-cream-300 text-gray-500">→</button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DIAS_SEMANA.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-6">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
              <button key={d} disabled={isPast(d)} onClick={() => setDia(d)} className={cn(
                'h-10 w-full rounded-xl text-sm font-medium transition-all',
                dia === d && 'bg-sage-400 text-white shadow-soft',
                !isPast(d) && dia !== d && 'hover:bg-cream-300 text-gray-700',
                isPast(d) && 'text-gray-300 cursor-not-allowed',
              )}>{d}</button>
            ))}
          </div>
          <Button className="w-full gap-2" disabled={!dia || loadingSlots} onClick={() => setStep(2)}>
            {loadingSlots ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continuar <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </Card>
      )}

      {/* Step 2 — Horário */}
      {step === 2 && (
        <Card className="animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Escolha o horário</h3>
          <p className="text-sm text-gray-400 mb-5 flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> {dia && formatDate(toDateString(year, month, dia))}
          </p>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar…
            </div>
          ) : slots.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              <p className="font-medium mb-1">Sem horários disponíveis</p>
              <p>Escolha outra data.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 mb-6">
              {slots.map(h => (
                <button key={h} onClick={() => setHorario(h)} className={cn(
                  'py-3 rounded-xl text-sm font-semibold border transition-all',
                  horario === h ? 'bg-sage-400 text-white border-sage-400 shadow-soft' : 'border-cream-400 text-gray-700 hover:border-sage-300 hover:bg-sage-50'
                )}>{h}</button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
            <Button className="flex-1 gap-2" disabled={!horario} onClick={() => setStep(3)}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3 — Confirmar */}
      {step === 3 && (
        <Card className="animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Confirmar agendamento</h3>

          <div className="rounded-xl bg-sage-50 border border-sage-200 p-4 mb-5 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-400">Data</span><span className="font-medium">{dia && formatDate(toDateString(year, month, dia))}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Horário</span><span className="font-medium">{horario}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Duração</span><span className="font-medium">50 min · Online</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Pacote</span><span className="font-medium">{creditoSel.pacotes.nome}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Créditos após</span><span className="font-medium">{creditoSel.sessoes_restantes - 1} sessão(ões)</span></div>
          </div>

          {erro && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="O seu nome" placeholder="Maria Silva" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Motivo / observações (opcional)</label>
              <textarea rows={3} placeholder="Breve descrição do que pretende trabalhar…" value={form.mensagem}
                onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
                className="w-full rounded-xl border border-cream-400 bg-cream-100 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">Voltar</Button>
              <Button type="submit" loading={enviando} disabled={!form.nome} className="flex-1 gap-2">
                <CheckCircle2 className="h-4 w-4" /> Confirmar
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export default function AgendamentoPage() {
  const [creditos, setCreditos] = useState<Credito[] | null>(null)
  const [emailCliente, setEmailCliente] = useState('')

  // Verificar retorno do Stripe (?sucesso=1&email=...)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('sucesso') === '1') {
      const email = params.get('email') ?? ''
      if (email) {
        fetch(`${API}/pacotes/creditos?email=${encodeURIComponent(email)}`)
          .then(r => r.json())
          .then(d => { if (d.creditos?.length) { setCreditos(d.creditos); setEmailCliente(email) } })
          .catch(() => null)
      }
      // Limpar query string
      window.history.replaceState({}, '', '/agendamento')
    }
  }, [])

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-sage-50 via-cream-100 to-lilac-50 py-24 text-center border-b border-cream-300">
        <div className="container-app">
          <Badge variant="sage" className="mb-5">Agendamento online</Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Consultas terapêuticas<br /><span className="text-gradient">ao seu ritmo</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Comece com uma consulta experimental a 25€ ou adquira um pacote de sessões.
            Agende quando quiser, sem compromissos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#planos">
              <Button size="lg" className="gap-2 shadow-soft">
                Ver planos <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href="#agendar">
              <Button size="lg" variant="outline" className="gap-2">
                Já tenho pacote
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Terapeutas ───────────────────────────────────────── */}
      <SeccaoTerapeutas />

      {/* ── Agendar (verificar créditos ou wizard) ────────────── */}
      {creditos && creditos.length > 0 ? (
        <section id="agendar" className="py-20 bg-cream-100">
          <div className="container-app max-w-2xl">
            <div className="text-center mb-10">
              <Badge variant="sage" className="mb-4">Agendar consulta</Badge>
              <h2 className="text-3xl font-bold text-gray-900">Escolha a sua data e hora</h2>
            </div>
            <WizardAgendamento creditos={creditos} email={emailCliente} />
          </div>
        </section>
      ) : (
        <VerificadorCreditos onCreditos={(c, e) => { setCreditos(c); setEmailCliente(e) }} />
      )}

      {/* ── Confiança ────────────────────────────────────────── */}
      <section className="py-20 bg-cream-200">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Seguro e transparente</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {confianca.map(item => (
              <Card key={item.title} className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-sage-100 text-sage-500 flex items-center justify-center">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 bg-cream-200">
        <div className="container-app max-w-2xl">
          <div className="text-center mb-10">
            <Badge variant="sage" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl font-bold text-gray-900">Perguntas frequentes</h2>
          </div>
          <Card>{faq.map(item => <FaqItem key={item.q} {...item} />)}</Card>
        </div>
      </section>
    </>
  )
}
