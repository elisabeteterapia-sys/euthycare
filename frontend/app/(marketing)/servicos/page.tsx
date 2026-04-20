import Link from 'next/link'
import { Heart, Flame, Zap, Shield, ArrowRight, CheckCircle2, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Serviços — EuthyCare',
  description: 'Terapia emocional online. Apoio especializado em ansiedade, burnout e trauma emocional. Sessões por videochamada, para todo o mundo lusófono.',
  openGraph: {
    title: 'Serviços de Terapia Emocional Online — EuthyCare',
    description: 'Apoio especializado em ansiedade, burnout, trauma e depressão. Sessões online em português.',
    url: 'https://euthycare.com/servicos',
    siteName: 'EuthyCare',
    locale: 'pt_PT',
    type: 'website',
  },
}

const servicos = [
  {
    id: 'ansiedade',
    icon: Heart,
    titulo: 'Ansiedade e Stress',
    subtitulo: 'Para quem se sente sobrecarregado',
    descricao: 'A ansiedade manifesta-se de formas diferentes — preocupação constante, dificuldade em descansar, tensão no corpo. Trabalhamos juntos para identificar os padrões e encontrar ferramentas concretas para recuperar o equilíbrio.',
    abordagens: ['Regulação emocional', 'Gestão do pensamento ansioso', 'Técnicas de relaxamento', 'Autoconhecimento'],
    duracao: '50 minutos',
    modalidade: 'Online',
    cor: 'from-sage-400 to-sage-600',
  },
  {
    id: 'burnout',
    icon: Flame,
    titulo: 'Burnout e Esgotamento',
    subtitulo: 'Quando o cansaço vai além do físico',
    descricao: 'O burnout é mais do que cansaço — é uma perda de sentido, de energia e de si mesmo. Num processo terapêutico, reconstruímos os limites, os valores e a relação com o trabalho e com a vida.',
    abordagens: ['Identificação de limites', 'Gestão de energia emocional', 'Reconstrução de propósito', 'Prevenção de recaídas'],
    duracao: '50 minutos',
    modalidade: 'Online',
    cor: 'from-amber-400 to-amber-600',
  },
  {
    id: 'trauma',
    icon: Shield,
    titulo: 'Trauma Emocional',
    subtitulo: 'Processar o que ficou por resolver',
    descricao: 'Experiências passadas deixam marcas que continuam a influenciar o presente. Num espaço seguro e sem julgamentos, trabalhamos o que ficou guardado — ao ritmo da pessoa, com cuidado e respeito.',
    abordagens: ['Processamento de experiências difíceis', 'Regulação do sistema nervoso', 'Trabalho com a criança interior', 'Ressignificação'],
    duracao: '50 minutos',
    modalidade: 'Online',
    cor: 'from-lilac-400 to-lilac-600',
  },
  {
    id: 'depressao',
    icon: Zap,
    titulo: 'Depressão e Vazio Emocional',
    subtitulo: 'Quando tudo parece pesado demais',
    descricao: 'A depressão não é fraqueza — é um sinal de que algo precisa de atenção. Através da terapia emocional, trabalhamos as raízes do sofrimento e construímos, passo a passo, um caminho de volta à vida.',
    abordagens: ['Apoio emocional estruturado', 'Trabalho com crenças limitantes', 'Activação comportamental', 'Construção de recursos internos'],
    duracao: '50 minutos',
    modalidade: 'Online',
    cor: 'from-sage-500 to-sage-700',
  },
]

export default function ServicosPage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-cream-100 text-center">
        <div className="container-app animate-fade-in">
          <Badge variant="sage" className="mb-4">Terapia emocional online</Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Um espaço seguro<br />
            <span className="text-gradient">para ser quem é</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
            Sessões individuais de terapia emocional online, em português,
            para quem vive em Portugal ou em qualquer parte do mundo.
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
