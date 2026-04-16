'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDays, Clock, Video, CheckCircle2, ArrowRight, Loader2,
  Mail, Shield, ChevronDown, ChevronUp, Star, Leaf, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ─── Tipos ────────────────────────────────────────────────────
interface Terapeuta {
  id: string
  nome: string
  titulo: string
  bio: string
  foto_url: string | null
  especialidades: string
  preco_cents: number
  duracao_min: number
}

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

// ─── Secção: Perfil da Terapeuta ─────────────────────────────
function PerfilTerapeuta({ t }: { t: Terapeuta }) {
  const especialidades = t.especialidades ? t.especialidades.split(',').map(e => e.trim()).filter(Boolean) : []
  return (
    <section className="py-16 bg-cream-100">
      <div className="container-app max-w-3xl">
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {t.foto_url ? (
              <img src={t.foto_url} alt={t.nome}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover shadow-card" />
            ) : (
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-sage-300 to-lilac-300 flex items-center justify-center shadow-card">
                <User className="h-14 w-14 text-white/70" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <Badge variant="sage" className="mb-3">Terapeuta Certificada</Badge>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{t.nome}</h1>
            <p className="text-sage-600 font-medium mb-4">{t.titulo}</p>
            {t.bio && <p className="text-gray-600 leading-relaxed mb-4">{t.bio}</p>}
            {especialidades.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {especialidades.map(e => (
                  <span key={e} className="px-3 py-1 rounded-full bg-sage-50 text-sage-700 text-xs font-medium border border-sage-200">
                    {e}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: Clock,       label: `${t.duracao_min} min`, desc: 'por sessão' },
            { icon: Video,       label: 'Online',               desc: 'videochamada segura' },
            { icon: Shield,      label: 'RGPD',                 desc: 'dados protegidos' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <Icon className="h-5 w-5 text-sage-500 mx-auto mb-1" />
              <p className="font-semibold text-gray-800 text-sm">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Secção: Pacotes ──────────────────────────────────────────
function SeccaoPacotes({ terapeuta, slug }: { terapeuta: Terapeuta; slug: string }) {
  const [pacotes, setPacotes]     = useState<Pacote[]>([])
  const [loading, setLoading]     = useState(true)
  const [email, setEmail]         = useState('')
  const [nome, setNome]           = useState('')
  const [pacoteSel, setPacoteSel] = useState<Pacote | null>(null)
  const [comprando, setComprando] = useState(false)
  const [erro, setErro]           = useState('')
  const [hasExp, setHasExp]       = useState(false)

  useEffect(() => {
    // Pacotes já carregados com o perfil
    fetch(`${API}/terapeutas/slug/${slug}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.pacotes)) setPacotes(d.pacotes) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [slug])

  async function verificarEmail(em: string) {
    if (!em) return
    try {
      const r = await fetch(`${API}/pacotes/creditos?email=${encodeURIComponent(em)}`)
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
          pacote_id:    pacoteSel.id,
          email,
          nome,
          terapeuta_id: terapeuta.id,
          terapeuta_slug: slug,
        }),
      })
      const d = await r.json()
      if (!r.ok) { setErro(d.error ?? 'Erro ao iniciar pagamento'); return }
      window.location.href = d.url
    } catch {
      setErro('Erro de ligação. Tente novamente.')
    } finally {
      setComprando(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-16 text-gray-400">
      <Loader2 className="h-6 w-6 animate-spin mr-2" /> A carregar…
    </div>
  )

  return (
    <section className="py-16" id="pacotes">
      <div className="container-app max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Agende a sua sessão</h2>
          <p className="text-gray-500">Escolha o pacote ideal e comece o seu processo terapêutico</p>
        </div>

        {/* Dados do cliente */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8 max-w-lg mx-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="O seu nome"
              className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={e => verificarEmail(e.target.value)}
              placeholder="o-seu@email.com"
              className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            />
          </div>
        </div>

        {/* Grid de pacotes */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {pacotes.map(p => {
            const isExp   = p.tipo === 'experimental'
            const blocked = isExp && hasExp
            const sel     = pacoteSel?.id === p.id
            return (
              <button
                key={p.id}
                disabled={blocked}
                onClick={() => !blocked && setPacoteSel(sel ? null : p)}
                className={cn(
                  'relative rounded-2xl border-2 p-4 text-left transition-all duration-150',
                  blocked  ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50' :
                  sel      ? 'border-sage-400 bg-sage-50 shadow-md' :
                  p.destaque ? 'border-sage-300 bg-white shadow-sm hover:border-sage-400' :
                             'border-cream-300 bg-white hover:border-sage-300'
                )}
              >
                {p.destaque && !blocked && (
                  <span className="absolute -top-2.5 left-4 bg-sage-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="h-2.5 w-2.5" /> Popular
                  </span>
                )}
                {sel && <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-sage-500" />}
                <p className="font-semibold text-gray-800 text-sm mb-1">{p.nome}</p>
                <p className="text-2xl font-bold text-sage-700 mb-1">{p.preco}€</p>
                <p className="text-xs text-gray-400 mb-2">{p.numero_sessoes} sessão{p.numero_sessoes > 1 ? 'ões' : ''} · {p.duracao_min} min</p>
                {p.descricao && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{p.descricao}</p>}
                {blocked && <p className="text-xs text-orange-500 mt-1 font-medium">Já utilizado</p>}
              </button>
            )
          })}
        </div>

        {erro && (
          <div className="mb-4 max-w-lg mx-auto rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 text-center">
            {erro}
          </div>
        )}

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleComprar}
            disabled={!pacoteSel || !email || !nome || comprando}
            className="gap-2 min-w-[200px]"
          >
            {comprando
              ? <><Loader2 className="h-4 w-4 animate-spin" /> A processar…</>
              : <><ArrowRight className="h-4 w-4" /> {pacoteSel ? `Pagar ${pacoteSel.preco}€` : 'Selecione um pacote'}</>
            }
          </Button>
        </div>
      </div>
    </section>
  )
}

// ─── Secção: Agendar slot ─────────────────────────────────────
function SeccaoAgendamento({ terapeuta, sucesso }: { terapeuta: Terapeuta; sucesso: boolean }) {
  const hoje    = new Date()
  const [ano, setAno]   = useState(hoje.getFullYear())
  const [mes, setMes]   = useState(hoje.getMonth())
  const [diaSel, setDiaSel] = useState<string | null>(null)
  const [slots, setSlots]   = useState<string[]>([])
  const [horaSel, setHoraSel] = useState<string | null>(null)
  const [loadSlots, setLoadSlots] = useState(false)
  const [email, setEmail]   = useState('')
  const [nome, setNome]     = useState('')
  const [agendando, setAgendando] = useState(false)
  const [agendado, setAgendado]   = useState(false)
  const [erro, setErro]           = useState('')

  const { firstDay, daysInMonth } = getCalendarDays(ano, mes)

  const carregarSlots = useCallback(async (data: string) => {
    setLoadSlots(true); setSlots([]); setHoraSel(null)
    try {
      const r = await fetch(`${API}/terapeutas/${terapeuta.id}/slots?data=${data}`)
      const d = await r.json()
      setSlots(d.slots ?? [])
    } catch { setSlots([]) }
    finally { setLoadSlots(false) }
  }, [terapeuta.id])

  function selDia(data: string) {
    setDiaSel(data); carregarSlots(data)
  }

  function prevMes() {
    if (mes === 0) { setAno(a => a - 1); setMes(11) } else setMes(m => m - 1)
    setDiaSel(null); setSlots([])
  }
  function nextMes() {
    if (mes === 11) { setAno(a => a + 1); setMes(0) } else setMes(m => m + 1)
    setDiaSel(null); setSlots([])
  }

  async function handleAgendar() {
    if (!diaSel || !horaSel || !email || !nome) return
    setAgendando(true); setErro('')
    try {
      const r = await fetch(`${API}/agendamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terapeuta_id: terapeuta.id,
          data:         diaSel,
          hora:         horaSel,
          email_cliente: email,
          nome_cliente:  nome,
        }),
      })
      const d = await r.json()
      if (!r.ok) { setErro(d.error ?? 'Erro ao agendar'); return }
      setAgendado(true)
    } catch {
      setErro('Erro de ligação. Tente novamente.')
    } finally {
      setAgendando(false)
    }
  }

  if (agendado) return (
    <section className="py-16 bg-cream-100">
      <div className="container-app max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-sage-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Consulta agendada!</h2>
        <p className="text-gray-500 mb-2">
          {diaSel && formatDate(diaSel)} às {horaSel} com {terapeuta.nome}
        </p>
        <p className="text-sm text-gray-400">Receberá a confirmação por e-mail em breve.</p>
      </div>
    </section>
  )

  return (
    <section className="py-16 bg-cream-100" id="agendar">
      <div className="container-app max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {sucesso ? '✓ Pagamento confirmado — agende agora' : 'Já tem créditos? Agende a sua consulta'}
          </h2>
          {sucesso && <p className="text-sage-600 font-medium">O seu pagamento foi recebido com sucesso.</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Calendário */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMes} className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-500 transition-colors">‹</button>
              <span className="font-semibold text-gray-800 text-sm">{MESES[mes]} {ano}</span>
              <button onClick={nextMes} className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-500 transition-colors">›</button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DIAS_SEMANA.map(d => <div key={d} className="text-center text-[10px] text-gray-400 font-medium py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dataStr = toDateString(ano, mes, day)
                const passado = new Date(dataStr) < new Date(hoje.toDateString())
                const sel     = diaSel === dataStr
                return (
                  <button
                    key={day}
                    disabled={passado}
                    onClick={() => selDia(dataStr)}
                    className={cn(
                      'aspect-square rounded-lg text-xs font-medium transition-colors',
                      passado ? 'text-gray-200 cursor-not-allowed' :
                      sel     ? 'bg-sage-400 text-white' :
                               'hover:bg-sage-100 text-gray-700'
                    )}
                  >{day}</button>
                )
              })}
            </div>
          </Card>

          {/* Slots + form */}
          <div className="flex flex-col gap-4">
            {diaSel && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  <CalendarDays className="inline h-4 w-4 mr-1 text-sage-500" />
                  {formatDate(diaSel)}
                </p>
                {loadSlots ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                    <Loader2 className="h-4 w-4 animate-spin" /> A verificar disponibilidade…
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">Sem horários disponíveis neste dia.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map(h => (
                      <button
                        key={h}
                        onClick={() => setHoraSel(h)}
                        className={cn(
                          'px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors',
                          horaSel === h ? 'bg-sage-400 text-white border-sage-400' : 'border-cream-400 text-gray-700 hover:border-sage-400'
                        )}
                      >{h}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {diaSel && horaSel && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
                />
                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
                />
                {erro && <p className="text-sm text-red-500">{erro}</p>}
                <Button
                  onClick={handleAgendar}
                  disabled={!email || !nome || agendando}
                  className="w-full gap-2"
                >
                  {agendando ? <><Loader2 className="h-4 w-4 animate-spin" /> A agendar…</> : 'Confirmar agendamento'}
                </Button>
              </div>
            )}

            {!diaSel && (
              <p className="text-sm text-gray-400 pt-4">← Selecione um dia no calendário</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Página principal ─────────────────────────────────────────
export default function TerapeutaPublicaPage() {
  const { slug }        = useParams<{ slug: string }>()
  const searchParams    = useSearchParams()
  const sucesso         = searchParams.get('sucesso') === '1'

  const [terapeuta, setTerapeuta] = useState<Terapeuta | null>(null)
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`${API}/terapeutas/slug/${slug}`)
      .then(r => { if (r.status === 404) { setNotFound(true); return null } return r.json() })
      .then(d => { if (d?.terapeuta) setTerapeuta(d.terapeuta) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen text-gray-400">
      <Loader2 className="h-6 w-6 animate-spin mr-2" /> A carregar…
    </div>
  )

  if (notFound || !terapeuta) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-400">
      <p>Terapeuta não encontrada.</p>
      <Link href="/" className="text-sage-600 text-sm hover:underline">Voltar ao início</Link>
    </div>
  )

  return (
    <>
      {/* Header mínimo */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-cream-200">
        <div className="container-app flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-sage-700 text-base">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center">
              <Leaf className="h-3.5 w-3.5 text-white" />
            </div>
            <span>Euthy<span className="text-sage-400">care</span></span>
          </Link>
          <a href="#pacotes">
            <Button size="sm">Agendar consulta</Button>
          </a>
        </div>
      </header>

      <main>
        <PerfilTerapeuta t={terapeuta} />

        {sucesso
          ? <SeccaoAgendamento terapeuta={terapeuta} sucesso={true} />
          : <SeccaoPacotes terapeuta={terapeuta} slug={slug} />
        }

        {!sucesso && (
          <div className="py-8 bg-cream-100 text-center">
            <p className="text-sm text-gray-400">
              Já tem créditos?{' '}
              <a href="#agendar" onClick={e => { e.preventDefault(); document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' }) }}
                className="text-sage-600 font-medium hover:underline">
                Clique aqui para agendar directamente
              </a>
            </p>
          </div>
        )}

        {/* Secção de agendamento (sempre visível abaixo dos pacotes) */}
        <SeccaoAgendamento terapeuta={terapeuta} sucesso={false} />
      </main>

      <footer className="border-t border-cream-200 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Euthycare · <Link href="/privacidade" className="hover:underline">Privacidade</Link>
      </footer>
    </>
  )
}
