import Link from 'next/link'
import { Heart, Users, Baby, Sparkles, Brain, ArrowRight, CheckCircle2, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Serviços — EuthyCare',
  description: 'Psicoterapia individual, de casal e infantil. Sessões online. Terapeutas qualificados com abordagens comprovadas.',
}

const servicos = [
  {
    id: 'individual',
    icon: Heart,
    titulo: 'Psicoterapia Individual',
    subtitulo: 'Para adultos e jovens adultos',
    descricao: 'Um espaço seguro e confidencial para explorar pensamentos, emoções e padrões de comportamento. Trabalhamos juntos para promover bem-estar e autoconhecimento.',
    abordagens: ['TCC — Terapia Cognitivo-Comportamental', 'Terapia Humanista', 'EMDR para trauma', 'Terapia de Aceitação e Compromisso (ACT)'],
    duracao: '50 minutos',
    modalidade: 'Online',
    cor: 'from-sage-400 to-sage-600',
  },
  {
    id: 'casal',
    icon: Users,
    titulo: 'Terapia de Casal',
    subtitulo: 'Para casais em qualquer fase',
    descricao: 'Apoio especializado para melhorar a comunicação, resolver conflitos e fortalecer a ligação entre parceiros. Trabalhamos com casais em crise e em prevenção.',
    abordagens: ['Comunicação não-violenta', 'Método Gottman', 'Terapia focada na emoção (EFT)', 'Resolução de conflitos'],
    duracao: '75 minutos',
    modalidade: 'Online',
    cor: 'from-lilac-400 to-lilac-600',
  },
  {
    id: 'infantil',
    icon: Baby,
    titulo: 'Psicologia Infantil',
    subtitulo: 'Para crianças e adolescentes',
    descricao: 'Acompanhamento especializado para crianças e adolescentes que enfrentam desafios emocionais, comportamentais ou de desenvolvimento.',
    abordagens: ['Ludoterapia', 'Terapia de jogo', 'Terapia familiar sistémica', 'Suporte a dificuldades de aprendizagem'],
    duracao: '50 minutos',
    modalidade: 'Online',
    cor: 'from-amber-400 to-amber-500',
  },
  {
    id: 'digital',
    icon: Sparkles,
    titulo: 'App Euthy',
    subtitulo: 'Apoio digital diário',
    descricao: 'Ferramenta de apoio emocional para usar entre as sessões. Ideal como complemento à terapia ou como primeiro passo para o bem-estar.',
    abordagens: ['Registo de humor', 'Exercícios guiados', 'Diário terapêutico', 'Conexão com o terapeuta'],
    duracao: 'Disponível 24/7',
    modalidade: 'Web e App Móvel',
    cor: 'from-sage-500 to-lilac-500',
  },
]

const terapeutas = [
  { nome: 'Dra. Ana Ribeiro', especialidade: 'Ansiedade e Depressão', anos: 12, abordagem: 'TCC + ACT' },
  { nome: 'Dr. Miguel Costa', especialidade: 'Terapia de Casal', anos: 8, abordagem: 'Gottman + EFT' },
  { nome: 'Dra. Sofia Lopes', especialidade: 'Psicologia Infantil', anos: 10, abordagem: 'Ludoterapia' },
  { nome: 'Dr. Rui Santos', especialidade: 'Trauma e EMDR', anos: 15, abordagem: 'EMDR + Trauma' },
]

export default function ServicosPage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-cream-100 text-center">
        <div className="container-app animate-fade-in">
          <Badge variant="sage" className="mb-4">Os nossos serviços</Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Cuidado especializado,<br />
            <span className="text-gradient">centrado em si</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
            Oferecemos acompanhamento psicológico de qualidade, online,
            adaptado às suas necessidades e objetivos.
          </p>
          <Link href="/agendamento">
            <Button size="lg" className="gap-2">
              <CalendarDays className="h-5 w-5" />
              Agendar primeira consulta
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Cards de serviços ─────────────────────────────────────── */}
      <section className="page-section">
        <div className="container-app space-y-8">
          {servicos.map((s, i) => (
            <div
              key={s.id}
              id={s.id}
              className={`grid lg:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}
            >
              {/* Visual */}
              <div className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                <div className={`rounded-3xl bg-gradient-to-br ${s.cor} p-10 text-white h-64 flex items-center justify-center`}>
                  <s.icon className="h-24 w-24 opacity-30" />
                </div>
              </div>

              {/* Content */}
              <div className={i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                <Badge variant="cream" className="mb-3">{s.subtitulo}</Badge>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">{s.titulo}</h2>
                <p className="text-gray-500 leading-relaxed mb-5">{s.descricao}</p>

                <ul className="space-y-2 mb-6">
                  {s.abordagens.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-sage-400 flex-shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-6">
                  <span className="flex items-center gap-1.5 bg-cream-200 rounded-xl px-3 py-1.5">
                    ⏱ {s.duracao}
                  </span>
                  <span className="flex items-center gap-1.5 bg-cream-200 rounded-xl px-3 py-1.5">
                    📍 {s.modalidade}
                  </span>
                </div>

                <Link href={s.id === 'digital' ? '/app-euthy' : '/agendamento'}>
                  <Button className="gap-2">
                    {s.id === 'digital' ? 'Conhecer o App' : 'Agendar agora'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Equipa ──────────────────────────────────────────────────── */}
      <section className="page-section bg-cream-100">
        <div className="container-app">
          <div className="text-center mb-12">
            <Badge variant="lilac" className="mb-4">A nossa equipa</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Terapeutas qualificados</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Todos os nossos profissionais são licenciados, supervisionados e comprometidos
              com a ética e o seu bem-estar.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {terapeutas.map((t) => (
              <Card key={t.nome} hover className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-sage-300 to-lilac-400 flex items-center justify-center text-white text-2xl font-bold">
                  {t.nome.split(' ')[1][0]}
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{t.nome}</h3>
                <p className="text-xs text-sage-600 font-medium mb-2">{t.especialidade}</p>
                <p className="text-xs text-gray-400 mb-2">{t.abordagem}</p>
                <Badge variant="cream">{t.anos} anos de experiência</Badge>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container-app text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Não sabe por onde começar?
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Entre em contacto e ajudamos a encontrar o serviço mais adequado para si.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/agendamento">
              <Button size="lg" className="gap-2">
                <CalendarDays className="h-5 w-5" /> Agendar consulta
              </Button>
            </Link>
            <Link href="/contato">
              <Button size="lg" variant="outline">Falar connosco</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
