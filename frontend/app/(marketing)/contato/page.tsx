'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Clock, CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const contatos = [
  {
    icon: Mail,
    label: 'E-mail',
    value: 'suporte@euthycare.com',
    desc: 'Respondemos o mais breve possível',
    color: 'bg-sage-100 text-sage-600',
  },
  {
    icon: Clock,
    label: 'Apoio por e-mail',
    value: 'Sempre disponível',
    desc: 'Envie a sua questão e respondemos assim que possível',
    color: 'bg-sage-100 text-sage-600',
  },
]

const assuntos = [
  'Agendamento de consulta',
  'Informações sobre serviços',
  'App Euthy',
  'Faturação / Pagamentos',
  'Parceria / Afiliado',
  'Outro',
]

export default function ContatoPage() {
  const [form, setForm] = useState({ nome: '', email: '', assunto: '', mensagem: '' })
  const [enviado, setEnviado] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-cream-200 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-sage-100 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-sage-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mensagem enviada!</h1>
          <p className="text-gray-500 mb-6">
            Recebemos a sua mensagem e entraremos em contacto em até <strong>2 horas úteis</strong>.
          </p>
          <Button onClick={() => { setEnviado(false); setForm({ nome: '', email: '', assunto: '', mensagem: '' }) }}>
            Enviar outra mensagem
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hero */}
      <section className="py-20 bg-cream-100 text-center border-b border-cream-300">
        <div className="container-app animate-fade-in">
          <Badge variant="sage" className="mb-4">Fale connosco</Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Estamos aqui para ajudar
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Tem dúvidas, quer saber mais sobre os nossos serviços ou precisa de apoio?
            A nossa equipa responde rapidamente.
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="container-app">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* Form */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Envie-nos uma mensagem</h2>
              <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Nome completo"
                    placeholder="Maria Silva"
                    value={form.nome}
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    required
                  />
                  <Input
                    label="E-mail"
                    type="email"
                    placeholder="maria@email.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Assunto</label>
                    <select
                      value={form.assunto}
                      onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))}
                      required
                      className="w-full rounded-xl border border-cream-400 bg-cream-100 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
                    >
                      <option value="">Selecione um assunto</option>
                      {assuntos.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Mensagem</label>
                    <textarea
                      rows={5}
                      placeholder="Como podemos ajudar?"
                      value={form.mensagem}
                      onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
                      required
                      className="w-full rounded-xl border border-cream-400 bg-cream-100 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={!form.nome || !form.email || !form.assunto || !form.mensagem}
                  >
                    Enviar mensagem <Send className="h-4 w-4" />
                  </Button>
                </form>
              </Card>
            </div>

            {/* Info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Informações de contacto</h2>
              <div className="flex flex-col gap-4 mb-10">
                {contatos.map((c) => (
                  <div key={c.label} className="flex items-start gap-4 p-4 rounded-2xl border border-cream-300 bg-cream-100">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.color}`}>
                      <c.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{c.label}</p>
                      <p className="font-semibold text-gray-800 text-sm">{c.value}</p>
                      <p className="text-xs text-gray-400">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-sage-50 border border-sage-100 p-6 text-center">
                <Mail className="h-8 w-8 mx-auto mb-2 text-sage-400" />
                <p className="text-sm font-semibold text-sage-700 mb-1">Prefere escrever directamente?</p>
                <a href="mailto:suporte@euthycare.com" className="text-sage-600 text-sm font-medium hover:underline">
                  suporte@euthycare.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ strip */}
      <section className="py-16 bg-cream-100 border-t border-cream-300">
        <div className="container-app text-center">
          <p className="text-gray-500 mb-4">Prefere procurar uma resposta rápida?</p>
          <Link href="/faq">
            <Button variant="outline" size="lg">Ver perguntas frequentes</Button>
          </Link>
        </div>
      </section>
    </>
  )
}
