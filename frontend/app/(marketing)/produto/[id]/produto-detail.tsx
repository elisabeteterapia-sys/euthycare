'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, ShoppingCart, Loader2, CheckCircle2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
  const [error, setError] = useState('')

  async function handleComprar() {
    if (loading) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/loja/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id: produto.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Erro ao iniciar pagamento. Tente novamente.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Erro de ligação. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Back */}
      <div className="border-b border-cream-200 bg-white">
        <div className="container-app py-4">
          <Link
            href="/loja"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-sage-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar à loja
          </Link>
        </div>
      </div>

      <section className="page-section">
        <div className="container-app max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* Left: cover */}
            <div>
              <div className="rounded-3xl overflow-hidden bg-sage-50 aspect-[3/4] flex items-center justify-center shadow-sm">
                {produto.capa_url ? (
                  <img
                    src={produto.capa_url}
                    alt={produto.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="h-24 w-24 text-sage-200" />
                )}
              </div>

              {/* Trust badges */}
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: Lock,         label: 'Pagamento seguro' },
                  { icon: FileText,     label: 'Acesso imediato' },
                  { icon: CheckCircle2, label: '7 dias de garantia' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="rounded-xl bg-cream-50 border border-cream-200 p-3">
                    <Icon className="h-5 w-5 text-sage-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: info + buy */}
            <div>
              <Badge variant="cream" className="mb-4">{produto.tipo.toUpperCase()}</Badge>

              <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {produto.nome}
              </h1>

              <p className="text-gray-600 leading-relaxed mb-6">
                {produto.descricao}
              </p>

              {/* Price + CTA */}
              <div className="rounded-2xl bg-cream-50 border border-cream-200 p-6 mb-8">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPreco(produto.preco_cents)}
                  </span>
                  <span className="text-sm text-gray-400">pagamento único</span>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 mb-4">
                    {error}
                  </p>
                )}

                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleComprar}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      A redirecionar…
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Comprar agora
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-400 mt-3">
                  Pagamento seguro via Stripe · Download imediato após confirmação
                </p>
              </div>

              {/* Content / TOC */}
              {produto.conteudo && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    O que está incluído
                  </h2>
                  <div className="prose prose-sm prose-gray max-w-none">
                    {produto.conteudo.split('\n').filter(Boolean).map((line, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-sage-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{line}</span>
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
