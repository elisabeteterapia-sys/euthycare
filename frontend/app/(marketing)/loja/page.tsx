import Link from 'next/link'
import { ShoppingBag, FileText, Download, Shield, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Loja — EuthyCare',
  description: 'Recursos terapêuticos digitais — guias práticos, metáforas e ferramentas clínicas.',
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
  const API = process.env.NEXT_PUBLIC_API_URL ?? process.env.BACKEND_URL ?? 'http://localhost:3001'
  try {
    const res = await fetch(`${API}/loja/produtos`, { next: { revalidate: 300 } })
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
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-sage-50 via-cream-100 to-lilac-50 py-20 text-center border-b border-cream-300">
        <div className="container-app max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <ShoppingBag className="h-4 w-4" />
            Loja digital
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5 leading-tight">
            Recursos terapêuticos<br />
            <span className="text-gradient">para a sua prática</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl mx-auto">
            PDFs desenvolvidos por terapeutas, para terapeutas e clientes.
            Guias práticos, metáforas e ferramentas prontas a usar.
          </p>
          {/* Trust mini badges */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-sage-500" /> Pagamento seguro</span>
            <span className="flex items-center gap-1.5"><Download className="h-4 w-4 text-sage-500" /> Download imediato</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-sage-500" /> Satisfação garantida</span>
          </div>
        </div>
      </section>

      {/* ── Produtos ─────────────────────────────────────── */}
      <section className="py-16 bg-cream-100">
        <div className="container-app">
          {produtos.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <FileText className="h-14 w-14 mx-auto mb-5 opacity-25" />
              <p className="text-xl font-semibold text-gray-600 mb-2">Em breve</p>
              <p className="text-sm">Novos recursos serão publicados muito em breve.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {produtos.map((p, idx) => (
                <Link key={p.id} href={`/produto/${p.id}`} className="group block">
                  <div className="bg-white rounded-3xl border border-cream-200 shadow-soft hover:shadow-card hover:border-sage-200 transition-all duration-300 overflow-hidden flex flex-col h-full">

                    {/* Capa */}
                    <div className="relative aspect-[3/4] bg-gradient-to-br from-sage-50 to-lilac-50 overflow-hidden">
                      {p.capa_url ? (
                        <img
                          src={p.capa_url}
                          alt={p.nome}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                          <FileText className="h-16 w-16 text-sage-200" />
                          <span className="text-xs text-sage-300 font-medium uppercase tracking-widest">PDF</span>
                        </div>
                      )}
                      {/* Badge destaque */}
                      {idx === 0 && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-lilac-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                            ✦ Novo
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col flex-1 p-5">
                      <Badge variant="sage" className="self-start mb-3 text-[10px] uppercase tracking-wider">
                        {p.tipo}
                      </Badge>
                      <h2 className="font-bold text-gray-900 text-base mb-2 leading-snug group-hover:text-sage-700 transition-colors line-clamp-2">
                        {p.nome}
                      </h2>
                      <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-5 line-clamp-3">
                        {p.descricao}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-cream-200">
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPreco(p.preco_cents)}
                        </span>
                        <Button size="sm" className="gap-1.5">
                          <ShoppingBag className="h-3.5 w-3.5" />
                          Comprar
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Garantias ────────────────────────────────────── */}
      <section className="py-14 bg-white border-t border-cream-200">
        <div className="container-app max-w-3xl">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: Shield,   title: 'Pagamento seguro',   desc: 'Processado por Stripe com encriptação SSL.' },
              { icon: Download, title: 'Download imediato',  desc: 'Acesso ao PDF logo após a confirmação do pagamento.' },
              { icon: Star,     title: '7 dias de garantia', desc: 'Satisfação garantida ou reembolso sem perguntas.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-sage-100 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-sage-600" />
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
