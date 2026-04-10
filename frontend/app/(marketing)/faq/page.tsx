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
        a: 'O EuthyCare é uma plataforma de saúde mental com dois componentes: o App Euthy, uma ferramenta SaaS para terapeutas gerirem pacientes, agenda e consultas; e a Loja EuthyCare, onde vendemos recursos digitais (PDFs terapêuticos) para terapeutas e clientes.',
      },
      {
        q: 'Para quem é o EuthyCare?',
        a: 'O App Euthy é destinado a terapeutas individuais e clínicas. A Loja é aberta a qualquer pessoa interessada em recursos de saúde mental e bem-estar emocional.',
      },
      {
        q: 'As sessões são presenciais ou online?',
        a: 'Todas as sessões são realizadas online, por videochamada segura. Não temos espaço físico — o que nos permite chegar a terapeutas e pacientes em qualquer lugar.',
      },
      {
        q: 'O EuthyCare está disponível fora de Portugal?',
        a: 'Sim. A plataforma está disponível em qualquer país. Aceitamos pagamentos em EUR, USD e BRL. O suporte é feito em português.',
      },
    ],
  },
  {
    label: 'App Euthy (SaaS)',
    faqs: [
      {
        q: 'Como funciona o período de teste gratuito?',
        a: 'Ao criar conta no App Euthy, tem 30 dias gratuitos sem precisar de cartão de crédito. No final do trial, escolhe o plano que mais se adapta à sua prática. Se não subscrever, o acesso é automaticamente suspenso.',
      },
      {
        q: 'Posso cancelar a qualquer momento?',
        a: 'Sim. O cancelamento é feito na área de conta, sem fidelidade nem penalizações. O acesso mantém-se até ao final do período já pago.',
      },
      {
        q: 'Posso fazer upgrade ou downgrade de plano?',
        a: 'Sim, a qualquer momento. O upgrade tem efeito imediato, com ajuste proporcional do valor. O downgrade entra em vigor no próximo ciclo de faturação.',
      },
      {
        q: 'Os dados dos meus pacientes estão seguros?',
        a: 'Sim. Os dados clínicos são encriptados em repouso (AES-256) e em trânsito (TLS). Nunca partilhamos dados de pacientes com terceiros. Seguimos o RGPD e boas práticas de segurança da informação clínica.',
      },
      {
        q: 'O que é a IA de apoio clínico?',
        a: 'Nos planos Profissional e Premium, a IA pode sugerir notas de sessão, gerar resumos clínicos e identificar padrões emocionais ao longo do tempo. Não substitui o julgamento clínico — é uma ferramenta de apoio.',
      },
      {
        q: 'O plano Clínica suporta quantos terapeutas?',
        a: 'O plano Clínica suporta até 10 terapeutas. Para equipas maiores, contacte-nos para um plano Enterprise personalizado.',
      },
      {
        q: 'Posso exportar os dados se sair da plataforma?',
        a: 'Sim. Os planos Premium e Clínica incluem exportação total dos dados em formato estruturado. No plano Essencial, o download está disponível por paciente.',
      },
    ],
  },
  {
    label: 'Loja de PDFs',
    faqs: [
      {
        q: 'Como funciona a compra de um PDF?',
        a: 'Escolha o produto, clique em "Comprar agora" e será redirecionado para o checkout seguro via Stripe. Após o pagamento, o download fica disponível imediatamente na página de confirmação.',
      },
      {
        q: 'Posso descarregar o PDF várias vezes?',
        a: 'Sim, cada compra permite até 10 downloads. Recomendamos guardar o ficheiro localmente após a primeira transferência.',
      },
      {
        q: 'Os PDFs têm reembolso?',
        a: 'Por se tratarem de produtos digitais com acesso imediato, não emitimos reembolsos após o download. Se o produto estiver com defeito ou diferente do descrito, contacte-nos em até 7 dias e analisamos o caso.',
      },
      {
        q: 'Posso partilhar os PDFs com colegas?',
        a: 'Não. A licença é pessoal e intransferível. A redistribuição ou partilha pública dos conteúdos viola os nossos Termos de Uso e direitos de autor.',
      },
    ],
  },
  {
    label: 'Pagamentos',
    faqs: [
      {
        q: 'Que métodos de pagamento aceitam?',
        a: 'Aceitamos cartões de crédito e débito (Visa, Mastercard, Amex) através da Stripe. Os pagamentos são processados de forma segura — não armazenamos dados de cartão nos nossos servidores.',
      },
      {
        q: 'Em que moeda posso pagar?',
        a: 'Os preços base são em euros (EUR). Também aceitamos pagamentos em USD e BRL. A conversão é feita automaticamente com base na moeda do seu método de pagamento.',
      },
      {
        q: 'Recebo fatura/recibo?',
        a: 'Sim. A Stripe envia automaticamente um recibo por e-mail após cada cobrança. Pode também aceder ao histórico de pagamentos na área de conta.',
      },
      {
        q: 'Os planos anuais têm desconto?',
        a: 'Sim, os planos anuais têm um desconto de 17% face à soma dos planos mensais equivalentes.',
      },
    ],
  },
  {
    label: 'Lista de Espera',
    faqs: [
      {
        q: 'O App Euthy já está disponível?',
        a: 'Estamos em fase de pré-lançamento. Pode entrar na lista de espera em /euthy-lancamento para garantir acesso antecipado e condições especiais de lançamento.',
      },
      {
        q: 'Ao entrar na lista de espera, crio uma conta?',
        a: 'Não. A lista de espera é apenas para captar interesse. Não cria nenhuma conta nem implica qualquer compromisso financeiro. Quando lançarmos, notificamos por e-mail.',
      },
      {
        q: 'Quais são os benefícios de entrar na lista de espera?',
        a: 'Acesso antecipado à plataforma, 30 dias gratuitos no lançamento, prioridade na abertura de inscrições, suporte direto da equipa fundadora e preço especial de lançamento.',
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
            Encontre respostas rápidas sobre o App Euthy, a Loja, pagamentos e mais.
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
