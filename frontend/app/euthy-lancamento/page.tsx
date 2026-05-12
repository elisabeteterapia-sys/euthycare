'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays, Users, FileText, CreditCard, Brain, Building2,
  CheckCircle2, Loader2, Leaf, Mail, Star, Phone,
  BellOff, PhoneOff, Clock, Smile, Lock, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const APP_URL = 'https://app.euthycare.com'

const doresResolvidas = [
  {
    icon: PhoneOff,
    problema: 'Acabou o "ligo a confirmar a consulta"',
    solucao: 'O EuthyApp envia lembretes automáticos 24h e 30 minutos antes. O paciente confirma. Tu não fazes nada.',
  },
  {
    icon: CreditCard,
    problema: 'Acabou o "ligo a cobrar"',
    solucao: 'Link de pagamento enviado ao paciente. Recebe online, sem constrangimentos, sem ligações incómodas.',
  },
  {
    icon: FileText,
    problema: 'Acabou a papelada e os ficheiros perdidos',
    solucao: 'Fichas, anamnese, evolução e documentos — tudo num só lugar, seguro, acessível de qualquer dispositivo.',
  },
  {
    icon: Brain,
    problema: 'Acabou o tempo perdido a escrever notas',
    solucao: 'A IA clínica redige o rascunho das tuas notas, plano de tratamento e relatório. Tu revês e assinares.',
  },
  {
    icon: Clock,
    problema: 'Acabou o esquecer do histórico do paciente',
    solucao: 'Toda a evolução terapêutica em gráficos. Abre a ficha e tens o contexto completo antes de cada sessão.',
  },
  {
    icon: Smile,
    problema: 'Acabou o stress de gerir uma clínica',
    solucao: 'Agenda, financeiro, equipa e pacientes num único painel. Focas-te em ajudar — o app trata do resto.',
  },
]

const beneficios = [
  { icon: Users,        titulo: 'Gestão de Pacientes',   descricao: 'Fichas completas, histórico clínico e acompanhamento de evolução terapêutica.' },
  { icon: CalendarDays, titulo: 'Agenda Inteligente',     descricao: 'Calendário integrado, lembretes automáticos e controlo de disponibilidade.' },
  { icon: FileText,     titulo: 'Arquivo Clínico Total',  descricao: 'Notas de sessão estruturadas, anamnese TRG digital e histórico seguro.' },
  { icon: CreditCard,   titulo: 'Cobrança de Consultas',  descricao: 'Faturação simplificada, recibos automáticos e controlo financeiro.' },
  { icon: Brain,        titulo: 'IA de Apoio Clínico',    descricao: 'Rascunho de notas, plano terapêutico, recursos e relatório — tudo gerado pela IA.' },
  { icon: Building2,    titulo: 'Gestão de Clínica',      descricao: 'Para clínicas com múltiplos terapeutas: painel centralizado e permissões por equipa.' },
]

const plans = [
  {
    slug: 'solo-pdf',
    name: 'Terapeuta Essencial',
    priceMonthly: 17,
    priceAnnual: 13.50,
    annualTotal: 162,
    description: 'Tudo o que precisas para gerir a tua prática sozinho.',
    hasAI: false,
    highlight: false,
    features: [
      '1 terapeuta',
      'Fichas clínicas completas',
      'Agenda com lembretes automáticos',
      'Anamnese TRG digital',
      'Exportação e arquivo PDF',
      'Controlo financeiro',
      'Suporte por email',
    ],
  },
  {
    slug: 'solo-ia',
    name: 'Terapeuta Pro',
    priceMonthly: 34,
    priceAnnual: 27,
    annualTotal: 324,
    description: 'Com IA clínica e arquivo total — para crescer sem limite.',
    hasAI: true,
    highlight: false,
    features: [
      '1 terapeuta',
      'Tudo do Terapeuta Essencial',
      'Assistente IA clínico (5 modos)',
      'Arquivo total BKP do terapeuta',
      'Relatórios e análise de evolução',
      'Suporte prioritário',
    ],
  },
  {
    slug: 'clinica-5',
    name: 'Clínica Essencial',
    priceMonthly: 49,
    priceAnnual: 39,
    annualTotal: 468,
    description: 'Gestão centralizada para equipas de até 5 terapeutas.',
    hasAI: false,
    highlight: false,
    features: [
      '5 terapeutas incluídos',
      'Painel centralizado da clínica',
      'Fichas e registos de toda a equipa',
      'Arquivo total BKP da clínica',
      'Backup semanal automático',
      'Suporte prioritário',
    ],
  },
  {
    slug: 'clinica-ia',
    name: 'Clínica Pro',
    priceMonthly: 79,
    priceAnnual: 63,
    annualTotal: 756,
    description: 'IA para toda a equipa e arquivo completo da clínica.',
    hasAI: true,
    highlight: true,
    features: [
      '5 terapeutas incluídos',
      'Tudo da Clínica Essencial',
      'IA clínica para toda a equipa',
      'Arquivo total BKP da clínica',
      'Relatórios avançados e analytics',
      'Suporte 24h',
    ],
  },
]

function PlanCard({ plan, annual }: { plan: typeof plans[0]; annual: boolean }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const price = annual ? plan.priceAnnual : plan.priceMonthly

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Introduza o seu email.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${APP_URL}/api/stripe/create-plan-checkout`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          plan_slug:      plan.slug,
          customer_email: email.trim(),
          period:         annual ? 'annual' : 'monthly',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.checkout_url) {
        setError(data.error ?? 'Erro ao iniciar pagamento. Tente novamente.')
        return
      }
      window.location.href = data.checkout_url
    } catch {
      setError('Erro de ligação. Verifique a sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`rounded-3xl border-2 bg-white p-7 flex flex-col gap-5 ${plan.highlight ? 'border-sage-400 shadow-xl' : 'border-cream-200 shadow-sm'}`}>
      {plan.highlight && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-sage-600 uppercase tracking-wide">
          <Star className="h-3.5 w-3.5" /> Mais popular
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
          {plan.hasAI && (
            <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Brain className="h-3 w-3" /> IA
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{plan.description}</p>
      </div>

      <div>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold text-gray-900">€{price % 1 === 0 ? price : price.toFixed(2)}</span>
          <span className="text-gray-400 text-sm mb-1">/mês</span>
        </div>
        {annual && (
          <p className="text-sm text-sage-600 font-semibold mt-1">
            Total anual: €{plan.annualTotal} — poupas €{Math.round((plan.priceMonthly * 12) - plan.annualTotal)}/ano
          </p>
        )}
      </div>

      <ul className="space-y-2 flex-1">
        {plan.features.map(f => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle2 className="h-4 w-4 text-sage-400 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <form onSubmit={handleBuy} className="space-y-3 pt-2 border-t border-cream-200">
        <div className="flex items-center gap-2 border border-cream-300 rounded-xl px-3 py-2.5 bg-cream-50 focus-within:ring-2 focus-within:ring-sage-300">
          <Mail className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="o-seu@email.com"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className={`w-full gap-2 ${plan.highlight ? 'bg-sage-500 hover:bg-sage-600' : ''}`}
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> A processar...</>
            : annual ? 'Subscrever anualmente →' : 'Comprar agora →'}
        </Button>
      </form>
    </div>
  )
}

function EnterpriseCard() {
  return (
    <div className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-7 flex flex-col gap-5">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Enterprise</h3>
        <p className="text-sm text-gray-500 mt-1">Para clínicas com mais de 5 terapeutas.</p>
      </div>

      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold text-gray-700">Sob consulta</span>
      </div>

      <ul className="space-y-2 flex-1">
        {[
          'Mais de 5 terapeutas',
          'Múltiplas clínicas',
          'IA personalizada',
          'Arquivo total da organização',
          'Integração sob medida',
          'Gestor de conta dedicado',
        ].map(f => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle2 className="h-4 w-4 text-slate-400 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <div className="pt-2 border-t border-slate-200">
        <a
          href="mailto:geral@euthycare.com"
          className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors"
        >
          <Phone className="h-4 w-4" />
          Entrar em contacto →
        </a>
      </div>
    </div>
  )
}

export default function EuthyLancamentoPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="bg-cream-50 min-h-screen">

      {/* ── Navbar ─────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-cream-200">
        <div className="container-app flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
            <div className="h-7 w-7 rounded-lg bg-sage-400 flex items-center justify-center">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            Euthy
          </Link>
          <a href={`${APP_URL}/login`} className="text-sm text-gray-500 hover:text-sage-600 transition-colors">
            Já tenho conta →
          </a>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────── */}
      <section className="page-section text-center bg-gradient-to-b from-sage-50 to-cream-50 pt-20 pb-16">
        <div className="container-app max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-sage-400 animate-pulse" />
            Disponível agora — Preço especial de lançamento
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Chega de ligar a cobrar.<br />
            Chega de ligar a confirmar.<br />
            <span className="text-sage-500">O EuthyApp faz isso por ti.</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-4 leading-relaxed">
            A gestão da tua prática clínica nas tuas mãos — simples, directa e com todas as soluções que precisas.
            Agenda, pacientes, cobranças e IA de apoio, tudo num só lugar.
          </p>

          <p className="text-base font-semibold text-sage-600 max-w-lg mx-auto mb-6">
            Dedica o teu tempo ao que importa: os teus pacientes.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-sage-400" /> Lembretes automáticos aos pacientes</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-sage-400" /> Cobrança online sem constrangimentos</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-sage-400" /> IA que escreve as tuas notas clínicas</span>
          </div>
        </div>
      </section>

      {/* ── Dores resolvidas ───────────────────────── */}
      <section className="page-section bg-white">
        <div className="container-app">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              O teu tempo vale demasiado<br />para ser gasto em burocracia
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Cada minuto que passas a ligar, a cobrar ou a preencher papéis é um minuto que não estás a ajudar quem precisa de ti.<br />
              <strong className="text-sage-600">O EuthyApp elimina as burocracias. O teu tempo fica inteiro para os teus pacientes.</strong>
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {doresResolvidas.map((d) => (
              <div key={d.problema} className="rounded-2xl border border-cream-200 bg-cream-50 p-6 flex flex-col gap-3">
                <div className="h-10 w-10 rounded-xl bg-sage-100 flex items-center justify-center">
                  <d.icon className="h-5 w-5 text-sage-600" />
                </div>
                <p className="font-bold text-gray-900 text-sm leading-snug">{d.problema}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{d.solucao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planos ─────────────────────────────────── */}
      <section className="page-section">
        <div className="container-app">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Escolha o seu plano</h2>
            <p className="text-gray-500 mb-6">
              Após o pagamento recebe a chave de ativação no email e ativa em <strong>app.euthycare.com</strong><br />
              <span className="text-sm text-sage-600 font-medium">Plano anual com 20% de desconto — cancele quando quiser.</span>
            </p>

            {/* Toggle mensal / anual */}
            <div className="inline-flex items-center gap-3 bg-cream-100 rounded-2xl p-1.5">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${!annual ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${annual ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Anual
                <span className="text-xs bg-sage-100 text-sage-700 font-bold px-2 py-0.5 rounded-full">−20%</span>
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {plans.map(plan => <PlanCard key={plan.slug} plan={plan} annual={annual} />)}
            <EnterpriseCard />
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Preços em EUR, IVA não incluído. Plano anual cobrado uma vez por ano. Cancele quando quiser.
          </p>
        </div>
      </section>

      {/* ── Como funciona ──────────────────────────── */}
      <section className="page-section bg-gradient-to-b from-cream-100 to-sage-50">
        <div className="container-app max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Como funciona</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { n: '1', title: 'Escolhe o plano', desc: 'Selecciona o plano adequado à sua prática e introduz o seu email.' },
              { n: '2', title: 'Pagamento seguro', desc: 'Paga via Stripe (cartão, MB WAY, Multibanco). A chave chega por email.' },
              { n: '3', title: 'Activa e começa', desc: 'Acede a app.euthycare.com, cria conta e activa com a chave recebida.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-sage-500 text-white font-bold flex items-center justify-center mx-auto">{n}</div>
                <p className="font-semibold text-gray-800">{title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefícios ─────────────────────────────── */}
      <section className="page-section">
        <div className="container-app">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Tudo o que a sua prática precisa</h2>
            <p className="text-gray-500">Uma plataforma completa, pensada para o terapeuta moderno.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {beneficios.map((b) => (
              <Card key={b.titulo} className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-xl bg-sage-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <b.icon className="h-5 w-5 text-sage-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{b.titulo}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{b.descricao}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="border-t border-cream-200 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} EuthyCare ·{' '}
        <Link href="/privacidade" className="hover:text-sage-600">Privacidade</Link> ·{' '}
        <Link href="/termos" className="hover:text-sage-600">Termos</Link> ·{' '}
        <a href="mailto:geral@euthycare.com" className="hover:text-sage-600">geral@euthycare.com</a>
      </footer>
    </div>
  )
}
