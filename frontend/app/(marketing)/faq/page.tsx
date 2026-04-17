'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const categorias = [
  {
    label: 'Geral',
    faqs: [
      {
        q: 'O que é o EuthyCare?',
        a: 'O EuthyCare é uma plataforma de terapia emocional online que conecta pessoas com terapeutas qualificados, através de sessões por videochamada segura. Pode marcar, pagar e realizar as suas sessões sem sair de casa.',
      },
      {
        q: 'Para quem é o EuthyCare?',
        a: 'Para qualquer pessoa adulta que queira apoio emocional profissional — seja para lidar com ansiedade, burnout, depressão, trauma, ou simplesmente para investir no seu bem-estar. A plataforma está disponível para todo o mundo lusófono.',
      },
      {
        q: 'As sessões são presenciais ou online?',
        a: 'Todas as sessões são online, por videochamada segura. Não é necessário deslocar-se — basta ter um dispositivo com câmara e uma ligação à internet estável.',
      },
      {
        q: 'O EuthyCare está disponível fora de Portugal?',
        a: 'Sim. Qualquer pessoa que fale português pode utilizar a plataforma, independentemente de onde esteja. Os pagamentos são processados em euros (EUR) através da Stripe.',
      },
    ],
  },
  {
    label: 'Sessões',
    faqs: [
      {
        q: 'Como funciona a primeira consulta?',
        a: 'A primeira sessão é uma consulta experimental — um espaço para se conhecerem, perceber o que a trouxe e ver se há sintonia. Não há compromisso. Pode decidir depois se quer continuar.',
      },
      {
        q: 'Quanto tempo dura uma sessão?',
        a: 'Cada sessão tem a duração de 50 minutos.',
      },
      {
        q: 'Como é feita a videochamada?',
        a: 'Após agendar, receberá o link da sessão por e-mail. Não é necessário instalar nenhuma aplicação — a sessão funciona directamente no browser.',
      },
      {
        q: 'Posso cancelar ou reagendar uma sessão?',
        a: 'Sim. Pedimos que o cancelamento seja feito com pelo menos 24 horas de antecedência. Em caso de cancelamento tardio, o crédito pode ser considerado utilizado. Entre em contacto para situações excepcionais.',
      },
      {
        q: 'O que acontece se tiver problemas técnicos durante a sessão?',
        a: 'Se a ligação falhar durante a sessão, o terapeuta tentará reconectar. Se não for possível concluir a sessão por razões técnicas, a sessão não é descontada dos seus créditos.',
      },
    ],
  },
  {
    label: 'Pagamentos',
    faqs: [
      {
        q: 'Como funcionam os pacotes de sessões?',
        a: 'Compra um pacote de sessões (por exemplo, 4 ou 8 sessões) e depois agenda cada sessão à medida que precisar, dentro do prazo de validade do pacote.',
      },
      {
        q: 'Que métodos de pagamento aceitam?',
        a: 'Aceitamos cartões de crédito e débito (Visa, Mastercard, Amex) através da Stripe. Os pagamentos são processados de forma segura — não armazenamos dados de cartão nos nossos servidores.',
      },
      {
        q: 'Recebo recibo após o pagamento?',
        a: 'Sim. A Stripe envia automaticamente um recibo por e-mail imediatamente após o pagamento.',
      },
      {
        q: 'Os pacotes têm reembolso?',
        a: 'Pacotes não iniciados podem ser reembolsados na totalidade. Após o uso de sessões, é feito o reembolso proporcional às sessões não utilizadas. Contacte-nos em até 7 dias.',
      },
    ],
  },
  {
    label: 'Privacidade',
    faqs: [
      {
        q: 'As sessões são confidenciais?',
        a: 'Sim, totalmente. Todo o conteúdo partilhado nas sessões é confidencial e protegido pelo sigilo terapêutico. Os dados são tratados em conformidade com o RGPD.',
      },
      {
        q: 'Os dados pessoais estão seguros?',
        a: 'Sim. Os dados são encriptados em trânsito (TLS) e em repouso. Nunca partilhamos informações pessoais com terceiros. Pode consultar a nossa política de privacidade completa.',
      },
      {
        q: 'As sessões são gravadas?',
        a: 'Não. As sessões não são gravadas. A videochamada é apenas entre o cliente e o terapeuta.',
      },
    ],
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-cream-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left"
      >
        <span className="font-medium text-gray-800 leading-snug">{q}</span>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="text-sm text-gray-500 leading-relaxed pb-5 -mt-1">
          {a}
        </p>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [categoria, setCategoria] = useState('Geral')
  const current = categorias.find((c) => c.label === categoria)!

  return (
    <>
      {/* Hero */}
      <section className="py-16 bg-cream-100 text-center">
        <div className="container-app max-w-2xl">
          <Badge variant="sage" className="mb-4">Dúvidas frequentes</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Como podemos ajudar?</h1>
          <p className="text-gray-500">
            Encontre respostas sobre sessões, pagamentos e privacidade.
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="container-app max-w-3xl">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-10">
            {categorias.map((c) => (
              <button
                key={c.label}
                onClick={() => setCategoria(c.label)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  categoria === c.label
                    ? 'bg-sage-400 text-white'
                    : 'bg-cream-100 text-gray-600 hover:bg-cream-200 border border-cream-300'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* FAQ accordion */}
          <div className="rounded-2xl border border-cream-200 bg-white divide-y-0 px-6">
            {current.faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-2xl bg-sage-50 border border-sage-100 p-8 text-center">
            <MessageCircle className="h-8 w-8 text-sage-400 mx-auto mb-3" />
            <h2 className="font-bold text-gray-900 mb-2">Não encontrou resposta?</h2>
            <p className="text-sm text-gray-500 mb-5">
              A nossa equipa responde em até 24 horas úteis.
            </p>
            <Link href="/contato">
              <Button variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Contactar suporte
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
