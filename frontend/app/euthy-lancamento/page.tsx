'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays, Users, FileText, CreditCard, Brain, Building2,
  CheckCircle2, Loader2, Leaf, Mail, Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const APP_URL = 'https://app.euthycare.com'

const beneficios = [
  { icon: Users,       titulo: 'Gestão de Pacientes',    descricao: 'Fichas completas, histórico clínico e acompanhamento de evolução terapêutica.' },
  { icon: CalendarDays, titulo: 'Agenda de Consultas',   descricao: 'Calendário integrado, lembretes automáticos e controlo de disponibilidade.' },
  { icon: FileText,    titulo: 'Registo Terapêutico',    descricao: 'Notas de sessão estruturadas, templates clínicos e histórico seguro.' },
  { icon: CreditCard,  titulo: 'Cobrança de Consultas',  descricao: 'Faturação simplificada, recibos automáticos e controlo financeiro da prática.' },
  { icon: Brain,       titulo: 'IA de Apoio Clínico',    descricao: 'Sugestões inteligentes, resumos de sessão e identificação de padrões emocionais.' },
  { icon: Building2,   titulo: 'Gestão de Clínica',      descricao: 'Para clínicas com múltiplos terapeutas: painel centralizado e permissões por equipa.' },
]

const plans = [
  {
    slug: 'essencial',
    name: 'Essencial',
    price: 29,
    description: 'Ideal para terapeuta individual a começar.',
    features: ['1 terapeuta', 'Agenda e calendário', 'Registo clínico completo', 'Anamnese digital', 'Financeiro básico', 'Backup PDF', 'Suporte por email'],
    highlight: false,
  },
  {
    slug: 'profissional',
    name: 'Profissional',
    price: 69,
    description: 'Para clínicas com até 3 terapeutas e funcionalidades IA.',
    features: ['3 terapeutas', 'Tudo do Essencial', 'IA de sugestões clínicas', 'Backup BKO completo', 'Analytics e relatórios', 'Notificações automáticas', 'Suporte prioritário'],
    highlight: true,
  },
  {
    slug: 'clinica',
    name: 'Clínica',
    price: 129,
    description: 'Para clínicas com múltiplos terapeutas e volume elevado.',
    features: ['Terapeutas ilimitados', 'Até 3 clínicas', 'Tudo do Profissional', 'Backup BKO semanal automático', 'Relatórios avançados', 'Página pública da clínica', 'Suporte 24h'],
    highlight: false,
  },
]

function PlanCard({ plan }: { plan: typeof plans[0] }) {
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Introduza o seu email.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${APP_URL}/api/stripe/create-plan-checkout`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan_slug: plan.slug, customer_email: email.trim() }),
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
    <div className={`rounded-3xl border-2 bg-white p-7 flex flex-col gap-5 ${plan.highlight ? 'border-sage-400 shadow-lg' : 'border-cream-200 shadow-sm'}`}>
      {plan.highlight && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-sage-600 uppercase tracking-wide">
          <Star className="h-3.5 w-3.5" /> Mais popular
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
      </div>

      <div className="flex items-end gap-1">
        <span className="text-4xl font-bold text-gray-900">€{plan.price}</span>
        <span className="text-gray-400 text-sm mb-1">/mês</span>
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
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> A processar...</> : 'Comprar agora →'}
        </Button>
      </form>
    </div>
  )
}

export default function EuthyLancamentoPage() {
  return (
    <div className="bg-cream-50 min-h-screen">

      {/* ── Navbar ───────────────────────────────────────────── */}
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

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="page-section text-center bg-gradient-to-b from-sage-50 to-cream-50 pt-20 pb-16">
        <div className="container-app max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-sage-400 animate-pulse" />
            Disponível agora — Preço especial de lançamento
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            A plataforma completa para<br />
            <span className="text-sage-500">terapeutas</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-6 leading-relaxed">
            Gerencie pacientes, registe consultas, organize a sua prática e receba pagamentos online.
            Receba a sua chave de acesso imediatamente após o pagamento.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-sage-400" /> Chave de acesso por email</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-sage-400" /> Sem contratos</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-sage-400" /> Cancele quando quiser</span>
          </div>
        </div>
      </section>

      {/* ── Planos ───────────────────────────────────────────── */}
      <section className="page-section">
        <div className="container-app">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Escolha o seu plano</h2>
            <p className="text-gray-500">Após o pagamento recebe a chave de ativação no email e ativa em <strong>app.euthycare.com</strong></p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map(plan => <PlanCard key={plan.slug} plan={plan} />)}
          </div>
        </div>
      </section>

      {/* ── Como funciona ────────────────────────────────────── */}
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

      {/* ── Benefícios ───────────────────────────────────────── */}
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

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-cream-200 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} EuthyCare · <Link href="/privacidade" className="hover:text-sage-600">Privacidade</Link> · <Link href="/termos" className="hover:text-sage-600">Termos</Link>
      </footer>
    </div>
  )
}
