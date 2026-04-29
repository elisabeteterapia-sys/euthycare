import Link from 'next/link'
import { ShoppingBag, FileText, Download, Shield, Star, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CountdownBanner } from '@/components/ui/countdown-banner'
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
    const res = await fetch(`${API}/loja/produtos`, { next: { revalidate: 60 } })
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
  const [destaque, ...restantes] = produtos

  return (
    <>
      {/* ── Countdown banner ─────────────────────────── */}
      <CountdownBanner buyHref={destaque ? `/produto/${destaque.id}` : '#'} />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-sage-50 via-cream-100 to-lilac-50 py-16 text-center border-b border-cream-300">
        <div className="container-app max-w-xl">
          <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
            <ShoppingBag className="h-4 w-4" />
            Loja digital
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Recursos para a<br /><span className="text-gradient">sua prática terapêutica</span>
          </h1>
          <p className="text-gray-500 mb-6">PDFs práticos, metáforas e ferramentas clínicas prontas a usar.</p>
          <div className="flex flex-wrap justify-center gap-5 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-sage-500" /> Pagamento seguro</span>
            <span className="flex items-center gap-1.5"><Download className="h-4 w-4 text-sage-500" /> Download imediato</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-sage-500" /> Satisfação garantida</span>
          </div>
        </div>
      </section>

      {/* ── Sem produtos ─────────────────────────────── */}
      {!destaque && (
        <section className="py-24 text-center">
          <FileText className="h-14 w-14 mx-auto mb-5 text-gray-200" />
          <p className="text-xl font-semibold text-gray-500">Em breve</p>
        </section>
      )}

      {/* ── Produto destaque (grande) ─────────────────── */}
      {destaque && (
        <section className="py-16 bg-cream-100">
          <div className="container-app max-w-5xl">
            <Link href={`/produto/${destaque.id}`} className="group block">
              <div className="bg-white rounded-3xl border border-cream-200 shadow-card hover:shadow-xl hover:border-sage-200 transition-all duration-300 overflow-hidden">
                <div className="grid md:grid-cols-[360px_1fr] gap-0">

                  {/* Capa grande */}
                  <div className="relative bg-gradient-to-br from-sage-50 to-lilac-50 aspect-[3/4] md:aspect-auto min-h-[420px] flex items-center justify-center overflow-hidden">
                    {destaque.capa_url ? (
                      <img
                        src={destaque.capa_url}
                        alt={destaque.nome}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    ) : (
                      <FileText className="h-24 w-24 text-sage-200" />
                    )}
                    <span className="absolute top-4 left-4 bg-lilac-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm">
                      ✦ Novo
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <span className="inline-block bg-sage-100 text-sage-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-5 w-fit">
                      {destaque.tipo}
                    </span>

                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight group-hover:text-sage-700 transition-colors">
                      {destaque.nome}
                    </h2>

                    <p className="text-gray-500 leading-relaxed mb-8 text-base line-clamp-4">
                      {destaque.descricao}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mb-8">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPreco(destaque.preco_cents)}
                      </span>
                      <span className="text-sm text-gray-400">pagamento único</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mb-8">
                      <Button size="lg" className="gap-2 text-base px-8 py-6">
                        <ShoppingBag className="h-5 w-5" />
                        Comprar agora
                      </Button>
                      <Button size="lg" variant="outline" className="gap-2">
                        Ver detalhes
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-5 border-t border-cream-200">
                      <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Pagamento seguro via Stripe</span>
                      <span className="flex items-center gap-1.5"><Download className="h-3.5 w-3.5" /> Download em PDF imediato</span>
                      <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> 7 dias de garantia</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── Outros produtos (grelha) ──────────────────── */}
      {restantes.length > 0 && (
        <section className="pb-16 bg-cream-100">
          <div className="container-app max-w-5xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Mais recursos</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {restantes.map(p => (
                <Link key={p.id} href={`/produto/${p.id}`} className="group">
                  <div className="bg-white rounded-3xl border border-cream-200 shadow-soft hover:shadow-card hover:border-sage-200 transition-all duration-300 overflow-hidden flex flex-col h-full">
                    <div className="aspect-[3/4] bg-gradient-to-br from-sage-50 to-lilac-50 overflow-hidden">
                      {p.capa_url ? (
                        <img src={p.capa_url} alt={p.nome} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="h-16 w-16 text-sage-200" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-sage-700 line-clamp-2">{p.nome}</h3>
                      <p className="text-sm text-gray-500 flex-1 mb-4 line-clamp-3">{p.descricao}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-cream-200">
                        <span className="text-xl font-bold">{formatPreco(p.preco_cents)}</span>
                        <Button size="sm" className="gap-1"><ShoppingBag className="h-3.5 w-3.5" /> Comprar</Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Garantias ────────────────────────────────── */}
      <section className="py-12 bg-white border-t border-cream-200">
        <div className="container-app max-w-3xl">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: Shield,   title: 'Pagamento seguro',   desc: 'Processado por Stripe com encriptação SSL.' },
              { icon: Download, title: 'Download imediato',  desc: 'PDF disponível logo após confirmação do pagamento.' },
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
