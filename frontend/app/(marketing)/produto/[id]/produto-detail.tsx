'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft, FileText, ShoppingCart, Loader2, CheckCircle2,
  Lock, Download, Star, BookOpen, ChevronRight, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppCurrency } from '@/lib/currency-context'

const COUNTDOWN_MINUTES = 15

// Contador de urgência — persiste em sessionStorage para não reiniciar ao recarregar
function useCountdown(produtoId: string) {
  const key = `countdown_${produtoId}`
  const [segundos, setSegundos] = useState<number>(COUNTDOWN_MINUTES * 60)

  useEffect(() => {
    const agora = Date.now()
    const salvo = sessionStorage.getItem(key)
    let expira: number

    if (salvo) {
      expira = Number(salvo)
      if (expira <= agora) {
        // Expirou — reinicia
        expira = agora + COUNTDOWN_MINUTES * 60 * 1000
        sessionStorage.setItem(key, String(expira))
      }
    } else {
      expira = agora + COUNTDOWN_MINUTES * 60 * 1000
      sessionStorage.setItem(key, String(expira))
    }

    const tick = () => {
      const restam = Math.max(0, Math.round((expira - Date.now()) / 1000))
      setSegundos(restam)
      if (restam <= 0) {
        expira = Date.now() + COUNTDOWN_MINUTES * 60 * 1000
        sessionStorage.setItem(key, String(expira))
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [key])

  const m = String(Math.floor(segundos / 60)).padStart(2, '0')
  const s = String(segundos % 60).padStart(2, '0')
  return { display: `${m}:${s}`, urgente: segundos < 120 }
}

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

export default function ProdutoDetail({ produto }: { produto: Produto }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { formatPrice }          = useAppCurrency()
  const t                        = useTranslations('shop')
  const { display: tempo, urgente } = useCountdown(produto.id)

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
      {/* Barra de navegação sticky */}
      <div className="sticky top-0 z-10 border-b border-cream-200 bg-white/90 backdrop-blur-md">
        <div className="container-app py-3 flex items-center justify-between">
          <Link href="/loja" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-sage-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('back_to_shop')}
          </Link>
          <Button size="sm" onClick={handleComprar} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
            {t('buy_now')} — {formatPrice(produto.preco_cents / 100)}
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

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { icon: Lock,     label: t('secure') },
                  { icon: Download, label: t('instant') },
                  { icon: Star,     label: t('guarantee') },
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
              <div className={`bg-white rounded-3xl border shadow-card p-6 mb-8 ${urgente ? 'border-red-300' : 'border-sage-200'}`}>

                {/* Contador de urgência */}
                <div className={`flex items-center justify-between rounded-2xl px-4 py-3 mb-5 ${urgente ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${urgente ? 'text-red-500 animate-pulse' : 'text-amber-600'}`} />
                    <span className={`text-sm font-medium ${urgente ? 'text-red-700' : 'text-amber-700'}`}>
                      {urgente ? 'Oferta a expirar!' : 'Oferta por tempo limitado'}
                    </span>
                  </div>
                  <span className={`text-2xl font-bold tabular-nums ${urgente ? 'text-red-600' : 'text-amber-700'}`}>
                    {tempo}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mb-5">
                  <span className="text-5xl font-bold text-gray-900">
                    {formatPrice(produto.preco_cents / 100)}
                  </span>
                  <span className="text-sm text-gray-400">{t('single_payment')}</span>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                    {error}
                  </p>
                )}

                <Button size="lg" className="w-full gap-2 mb-3 text-base py-6" onClick={handleComprar} disabled={loading}>
                  {loading
                    ? <><Loader2 className="h-5 w-5 animate-spin" /> {t('processing')}</>
                    : <><ShoppingCart className="h-5 w-5" /> {t('buy_now')}</>
                  }
                </Button>

                <p className="text-xs text-center text-gray-400 mb-5">
                  🔒 {t('secure_note')}
                </p>

                <div className="space-y-2 pt-4 border-t border-cream-200">
                  {[t('pdf_line'), t('limit_line'), t('use_line')].map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-sage-400 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Índice */}
              {linhasConteudo.length > 0 && (
                <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-soft">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-sage-500" />
                    {t('included')}
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
