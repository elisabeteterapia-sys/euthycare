import Link from 'next/link'
import { CalendarDays, Heart, Shield, Leaf, ArrowRight, Star, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EuthyCare — Psicoterapia Online',
  description: 'Cuidado mental acolhedor e acessível. Consultas de psicoterapia online com profissionais qualificados.',
}

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="bg-gradient-to-b from-cream-200 to-cream-100 py-20 px-4">
        <div className="container-app text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Leaf className="h-3.5 w-3.5" /> Psicoterapia Online · Portugal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-5">
            Cuidado mental <span className="text-sage-500">acolhedor</span> e acessível
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            Sessões de psicoterapia online, no conforto da sua casa. Apoio profissional para ansiedade, burnout, relações e bem-estar emocional.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/agendamento">
              <Button size="lg" className="gap-2">
                <CalendarDays className="h-4 w-4" /> Agendar consulta
              </Button>
            </Link>
            <Link href="/servicos">
              <Button size="lg" variant="outline" className="gap-2">
                Ver serviços <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">Primeira consulta experimental · €25 · Sem compromisso</p>
        </div>
      </section>

      {/* Trust */}
      <section className="py-10 border-b border-cream-300 bg-cream-100">
        <div className="container-app">
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
            {[
              { label: 'Consultas realizadas', value: '+200' },
              { label: 'Anos de experiência', value: '8' },
              { label: 'Satisfação', value: '98%' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-sage-600">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4 bg-cream-100">
        <div className="container-app">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Como posso ajudar</h2>
            <p className="text-gray-500 text-sm">Apoio especializado para diferentes momentos da vida</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Heart, title: 'Ansiedade e Stress', desc: 'Ferramentas práticas para gerir a ansiedade e recuperar o equilíbrio emocional.' },
              { icon: Shield, title: 'Burnout', desc: 'Apoio para identificar e superar o esgotamento profissional e pessoal.' },
              { icon: Star, title: 'Bem-estar Emocional', desc: 'Desenvolvimento pessoal, autoconhecimento e qualidade de vida.' },
            ].map(s => (
              <Card key={s.title} className="text-center p-6">
                <div className="h-10 w-10 rounded-xl bg-sage-100 flex items-center justify-center mx-auto mb-3">
                  <s.icon className="h-5 w-5 text-sage-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </Card>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/servicos">
              <Button variant="outline" className="gap-2">Ver todos os serviços <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-cream-200/50">
        <div className="container-app max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Como funciona</h2>
            <p className="text-gray-500 text-sm">Simples, seguro e acolhedor</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Escolha o pacote', desc: 'Consulta experimental de €25 ou um pacote de sessões.' },
              { step: '2', title: 'Agende a sessão', desc: 'Escolha o dia e hora que mais lhe convém.' },
              { step: '3', title: 'Sessão online', desc: 'Consulta por videochamada segura, no conforto da sua casa.' },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-full bg-sage-500 text-white font-bold flex items-center justify-center mb-3 text-sm">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-sage-500 text-white text-center">
        <div className="container-app max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Dê o primeiro passo</h2>
          <p className="text-sage-100 mb-6 text-sm">A consulta experimental custa apenas €25. Sem compromisso, sem cartão recorrente.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/agendamento">
              <Button size="lg" className="bg-white text-sage-700 hover:bg-cream-100 gap-2">
                <CalendarDays className="h-4 w-4" /> Agendar agora
              </Button>
            </Link>
            <Link href="/contato">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-sage-600 gap-2">
                Falar connosco
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-sage-200">
            {['Sessão segura e confidencial', 'Profissional certificada', 'Cancelamento gratuito'].map(t => (
              <span key={t} className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
