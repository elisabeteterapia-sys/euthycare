'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  CalendarDays, Users, FileText, CreditCard, Brain, Building2,
  CheckCircle2, ArrowDown, Loader2, Leaf
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// ── Config ────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const beneficios = [
  {
    icon: Users,
    titulo: 'Gestão de Pacientes',
    descricao: 'Fichas completas, histórico clínico e acompanhamento de evolução terapêutica.',
  },
  {
    icon: CalendarDays,
    titulo: 'Agenda de Consultas',
    descricao: 'Calendário integrado, lembretes automáticos e controlo de disponibilidade.',
  },
  {
    icon: FileText,
    titulo: 'Registo Terapêutico',
    descricao: 'Notas de sessão estruturadas, templates clínicos e histórico seguro.',
  },
  {
    icon: CreditCard,
    titulo: 'Cobrança de Consultas',
    descricao: 'Faturação simplificada, recibos automáticos e controlo financeiro da prática.',
  },
  {
    icon: Brain,
    titulo: 'IA de Apoio Clínico',
    descricao: 'Sugestões inteligentes, resumos de sessão e identificação de padrões emocionais.',
  },
  {
    icon: Building2,
    titulo: 'Gestão de Clínica',
    descricao: 'Para clínicas com múltiplos terapeutas: painel centralizado e permissões por equipa.',
  },
]

const vantagens = [
  'Acesso antecipado à plataforma',
  '30 dias gratuitos ao lançar',
  'Prioridade na abertura das inscrições',
  'Suporte direto da equipa fundadora',
  'Preço especial de lançamento',
]

// ── Page ──────────────────────────────────────────────────────

export default function EuthyLancamentoPage() {
  const formRef = useRef<HTMLElement>(null)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [tipo, setTipo] = useState<'terapeuta' | 'clinica'>('terapeuta')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'loading') return
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch(`${API_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          tipo_usuario: tipo,
          source: 'euthy-lancamento',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erro ao enviar. Tente novamente.')
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch {
      setErrorMsg('Erro de ligação. Verifique a sua conexão e tente novamente.')
      setStatus('error')
    }
  }

  return (
    <div className="bg-cream-50 min-h-screen">

      {/* ── Minimal Navbar ───────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-cream-200">
        <div className="container-app flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
            <div className="h-7 w-7 rounded-lg bg-sage-400 flex items-center justify-center">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            Euthy
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={scrollToForm}
              className="hidden sm:block text-sm text-gray-500 hover:text-sage-600 transition-colors"
            >
              Lista de espera
            </button>
            <Button size="sm" onClick={scrollToForm}>
              Acesso antecipado
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="page-section text-center bg-gradient-to-b from-sage-50 to-cream-50 pt-20 pb-24">
        <div className="container-app max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-sage-400 animate-pulse" />
            Em breve · Fase de pré-lançamento
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Uma nova plataforma para<br />
            <span className="text-sage-500">terapeutas</span> está chegando
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Gerencie pacientes, registe consultas e organize a sua prática terapêutica
            com o Euthy — a plataforma pensada para quem cuida.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={scrollToForm} className="gap-2">
              Entrar na lista de espera
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          <p className="mt-6 text-sm text-gray-400">
            Sem cartão de crédito · 30 dias gratuitos · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── Benefícios ───────────────────────────────────────── */}
      <section className="page-section">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Tudo o que a sua prática precisa
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Uma plataforma completa, pensada para o terapeuta moderno.
            </p>
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

      {/* ── Acesso antecipado + Formulário ───────────────────── */}
      <section
        ref={formRef}
        className="page-section bg-gradient-to-b from-cream-100 to-sage-50"
      >
        <div className="container-app max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
                Acesso Antecipado
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Seja um dos primeiros terapeutas a testar o Euthy
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Junte-se à lista de espera e garanta o seu lugar antes da abertura oficial.
                Os primeiros terapeutas terão condições especiais de lançamento.
              </p>

              <ul className="space-y-3">
                {vantagens.map((v) => (
                  <li key={v} className="flex items-center gap-3 text-sm text-gray-700">
                    <CheckCircle2 className="h-5 w-5 text-sage-400 flex-shrink-0" />
                    {v}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: form */}
            <div>
              {status === 'success' ? (
                <div className="rounded-3xl bg-white border border-sage-200 p-10 text-center shadow-sm">
                  <div className="h-16 w-16 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-8 w-8 text-sage-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Está na lista!
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Recebemos o seu interesse. Entraremos em contacto assim que o Euthy
                    estiver pronto para os primeiros utilizadores.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-3xl bg-white border border-cream-300 p-8 shadow-sm space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nome
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="O seu nome"
                      className="w-full rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-300 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      E-mail profissional
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="terapeuta@exemplo.com"
                      className="w-full rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-300 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Perfil
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['terapeuta', 'clinica'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTipo(t)}
                          className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                            tipo === t
                              ? 'border-sage-400 bg-sage-50 text-sage-700'
                              : 'border-cream-300 bg-cream-50 text-gray-500 hover:border-sage-200'
                          }`}
                        >
                          {t === 'terapeuta' ? 'Terapeuta individual' : 'Clínica / equipa'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {status === 'error' && (
                    <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
                      {errorMsg}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2"
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        A enviar…
                      </>
                    ) : (
                      'Quero acesso antecipado'
                    )}
                  </Button>

                  <p className="text-xs text-gray-400 text-center">
                    Sem spam. Apenas atualizações do lançamento.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer minimal ───────────────────────────────────── */}
      <footer className="border-t border-cream-200 py-8 text-center">
        <div className="container-app">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} EuthyCare · Todos os direitos reservados
          </p>
          <div className="flex justify-center gap-6 mt-3">
            <Link href="/privacidade" className="text-xs text-gray-400 hover:text-sage-600 transition-colors">
              Privacidade
            </Link>
            <Link href="/termos" className="text-xs text-gray-400 hover:text-sage-600 transition-colors">
              Termos
            </Link>
            <Link href="/contato" className="text-xs text-gray-400 hover:text-sage-600 transition-colors">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
