import Link from 'next/link'
import { ShoppingBag, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Loja — EuthyCare',
  description: 'PDFs terapêuticos para terapeutas e clientes. Ferramentas de apoio para a prática clínica.',
}

interface Produto {
  id: string
  nome: string
  descricao: string
  preco_cents: number
  capa_url: string | null
  tipo: string
}

async function getProdutos(): Promise<Produto[]> {
  const API = process.env.BACKEND_URL ?? 'http://localhost:3001'
  try {
    const res = await fetch(`${API}/loja/produtos`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.produtos ?? []
  } catch {
    return []
  }
}

function formatPreco(cents: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export default async function LojaPage() {
  const produtos = await getProdutos()

  return (
    <>
      {/* Hero */}
      <section className="page-section bg-gradient-to-b from-cream-100 to-white text-center">
        <div className="container-app max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <ShoppingBag className="h-4 w-4" />
            Loja digital
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Recursos terapêuticos digitais
          </h1>
          <p className="text-gray-500 leading-relaxed">
            PDFs de apoio para terapeutas e clientes — guias práticos, exercícios e
            ferramentas clínicas desenvolvidas com base em evidência.
          </p>
        </div>
      </section>

      {/* Product grid */}
      <section className="page-section pt-0">
        <div className="container-app">
          {produtos.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Produtos em breve</p>
              <p className="text-sm mt-1">Novos recursos serão publicados em breve.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {produtos.map((p) => (
                <Link key={p.id} href={`/produto/${p.id}`} className="group">
                  <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200 overflow-hidden p-0">
                    {/* Cover */}
                    <div className="aspect-[4/3] bg-sage-50 overflow-hidden">
                      {p.capa_url ? (
                        <img
                          src={p.capa_url}
                          alt={p.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="h-16 w-16 text-sage-200" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col flex-1 p-5">
                      <Badge variant="cream" className="self-start mb-3 text-xs">
                        {p.tipo.toUpperCase()}
                      </Badge>
                      <h2 className="font-semibold text-gray-900 mb-2 group-hover:text-sage-600 transition-colors leading-snug">
                        {p.nome}
                      </h2>
                      <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-4 line-clamp-3">
                        {p.descricao}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xl font-bold text-gray-900">
                          {formatPreco(p.preco_cents)}
                        </span>
                        <Button size="sm" variant="outline" className="group-hover:bg-sage-50">
                          Ver mais
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-12 border-t border-cream-200 bg-cream-50">
        <div className="container-app max-w-3xl text-center">
          <p className="text-sm text-gray-500 mb-4">
            Acesso imediato · Pagamento seguro via Stripe · Reembolso em 7 dias
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-400">
            <span>🔒 Pagamento encriptado</span>
            <span>📄 Download imediato após pagamento</span>
            <span>✅ Satisfação garantida</span>
          </div>
        </div>
      </section>
    </>
  )
}
