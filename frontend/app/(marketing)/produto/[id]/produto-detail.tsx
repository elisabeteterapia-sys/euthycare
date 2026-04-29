'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, FileText, ShoppingCart, Loader2, CheckCircle2,
  Lock, Download, Star, BookOpen, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Produto {
  id: string
  nome: string
  descricao: string
  conteudo: string
  preco_cents: number
  capa_url: string | null
  tipo: string
}

function formatPreco(cents: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export default function ProdutoDetail({ produto }: { produto: Produto }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleComprar() {
    if (loading) return
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API_URL}/loja/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id: produto.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Erro ao iniciar pagamento. Tente novamente.')
        setLoading(false); return
      }
      window.location.href = data.url
    } catch {
      setError('Erro de ligação. Tente novamente.')
      setLoading(false)
    }
  }

  const linhasConteudo = produto.conteudo
    ? produto.conteudo.split('\n').filter(Boolean)
    : []

  return (
    <>
      {/* Barra de navegação */}
      <div className="sticky top-0 z-10 border-b border-cream-200 bg-white/90 backdrop-blur-md">
        <div className="container-app py-3 flex items-center justify-between">
          <Link href="/loja" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-sage-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar à loja
          </Link>
          <Button size="sm" onClick={handleComprar} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
            Comprar — {formatPreco(produto.preco_cents)}
          </Button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <section className="py-12 bg-cream-100">
        <div className="container-app max-w-5xl">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 items-start">

            {/* ── Esquerda: capa + garantias ───────────── */}
            <div className="lg:sticky lg:top-20">
              <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-sage-50 to-lilac-50 aspect-[3/4] flex items-center justify-center shadow-card">
                {produto.capa_url ? (
                  <img src={produto.capa_url} alt={produto.nome} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="h-24 w-24 text-sage-200" />
                )}
              </div>

              {/* Garantias */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { icon: Lock,         label: 'Pagamento seguro' },
                  { icon: Download,     label: 'Acesso imediato' },
                  { icon: Star,         label: '7 dias garantia' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="rounded-2xl bg-white border border-cream-200 p-3 text-center shadow-soft">
                    <Icon className="h-4 w-4 text-sage-500 mx-auto mb-1.5" />
                    <p className="text-[11px] text-gray-500 leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Direita: info e compra ────────────────── */}
            <div>
              {/* Tipo */}
              <div className="inline-flex items-center gap-1.5 bg-sage-100 text-sage-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                <BookOpen className="h-3.5 w-3.5" />
                {produto.tipo}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {produto.nome}
              </h1>

              <p className="text-base text-gray-600 leading-relaxed mb-8">
                {produto.descricao}
              </p>

              {/* Box de compra */}
              <div className="bg-white rounded-3xl border border-sage-200 shadow-card p-6 mb-8">
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="text-5xl font-bold text-gray-900">
                    {formatPreco(produto.preco_cents)}
                  </span>
                  <span className="text-sm text-gray-400">pagamento único</span>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                    {error}
                  </p>
                )}

                <Button size="lg" className="w-full gap-2 mb-3 text-base py-6" onClick={handleComprar} disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> A processar…</>
                  ) : (
                    <><ShoppingCart className="h-5 w-5" /> Comprar agora</>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-400">
                  🔒 Pagamento seguro via Stripe · Download imediato · 7 dias de garantia
                </p>

                {/* O que recebe */}
                <div className="mt-5 pt-5 border-t border-cream-200 space-y-2">
                  {[
                    'Download em PDF — acesso imediato após pagamento',
                    'Até 10 downloads · link válido 7 dias',
                    'Uso pessoal e profissional incluído',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-sage-400 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Índice / conteúdo */}
              {linhasConteudo.length > 0 && (
                <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-soft">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-sage-500" />
                    O que está incluído
                  </h2>
                  <div className="space-y-2">
                    {linhasConteudo.map((linha, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <ChevronRight className="h-4 w-4 text-sage-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 leading-relaxed">{linha}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
