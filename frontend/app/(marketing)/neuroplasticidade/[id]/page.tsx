'use client'

/**
 * Detalhe público /neuroplasticidade/[id]
 * Mostra os 7 blocos do estudo. Sem favoritos/reflexões (público sem login).
 * Estudos com data futura devolvem 403 → mensagem "ainda não disponível".
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Brain, ChevronLeft, BookOpen, Clock, Activity, Heart, Sparkles, Library, ListChecks, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Route local Next.js (Vercel) — Supabase directo, sem passar pelo backend Express

interface Estudo {
  id: string
  titulo: string
  tema_principal: string
  data_publicacao: string
  texto_referencia: string
  contexto_historico: string
  analise_neuroplasticidade: string
  analise_psicologica: string
  analise_psicanalitica: string
  referencias_bibliograficas: string
  exercicio_terapeutico: string
}

const blocos = [
  { key: 'texto_referencia',           label: 'Texto de referência',          icon: BookOpen,   color: 'text-amber-600' },
  { key: 'contexto_historico',         label: 'Contexto histórico',           icon: Clock,      color: 'text-gray-600' },
  { key: 'analise_neuroplasticidade',  label: 'Análise · Neuroplasticidade',  icon: Activity,   color: 'text-sage-600' },
  { key: 'analise_psicologica',        label: 'Análise · Psicologia',         icon: Heart,      color: 'text-rose-600' },
  { key: 'analise_psicanalitica',      label: 'Análise · Psicanálise',        icon: Sparkles,   color: 'text-lilac-600' },
  { key: 'referencias_bibliograficas', label: 'Referências bibliográficas',   icon: Library,    color: 'text-gray-500' },
  { key: 'exercicio_terapeutico',      label: 'Exercício terapêutico',        icon: ListChecks, color: 'text-emerald-600' },
] as const

export default function NeuroEstudoDetalhePage() {
  const params = useParams<{ id: string }>()
  const [estudo, setEstudo]   = useState<Estudo | null>(null)
  const [errorInfo, setError] = useState<{ message: string; futureDate?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params?.id) return
    fetch(`/api/neuro/estudos/${params.id}`)
      .then(async r => {
        const body = await r.json()
        if (r.ok) {
          setEstudo(body as Estudo)
        } else if (r.status === 403) {
          setError({ message: 'Ainda não disponível', futureDate: body.data_publicacao })
        } else {
          setError({ message: 'Estudo não encontrado' })
        }
      })
      .catch(() => setError({ message: 'Erro ao carregar estudo' }))
      .finally(() => setLoading(false))
  }, [params?.id])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-sage-500" />
      </div>
    )
  }

  if (errorInfo) {
    const dias = errorInfo.futureDate
      ? Math.ceil((new Date(errorInfo.futureDate + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Link
          href="/neuroplasticidade"
          className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-sage-600"
        >
          <ChevronLeft className="h-4 w-4" />
          Neuroplasticidade
        </Link>
        <div className="rounded-xl border border-dashed border-lilac-200 bg-gradient-to-br from-lilac-50/40 to-gray-50/40 p-8 text-center">
          <Brain className="mx-auto mb-3 h-10 w-10 text-lilac-400" strokeWidth={1.5} />
          <h1 className="text-lg font-semibold text-gray-900">{errorInfo.message}</h1>
          {dias !== null && (
            <p className="mt-2 text-sm text-gray-500">
              Este estudo é libertado {dias === 1 ? 'amanhã' : `daqui a ${dias} dias`}.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!estudo) return null

  const dataFormatada = new Date(estudo.data_publicacao + 'T00:00:00').toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/neuroplasticidade" className="flex items-center gap-1 text-gray-500 hover:text-sage-600">
          <ChevronLeft className="h-4 w-4" />
          Neuroplasticidade
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-gray-700">Detalhe do estudo</span>
      </div>

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sage-500 to-lilac-500 shadow">
            <Brain className="h-6 w-6 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{estudo.titulo}</h1>
            <p className="mt-1 text-sm capitalize text-gray-500">{dataFormatada}</p>
          </div>
        </div>
        <Badge variant="sage">{estudo.tema_principal}</Badge>
      </div>

      {/* Blocos */}
      <div className="space-y-4">
        {blocos.map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className={`h-4 w-4 ${color}`} />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {estudo[key]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA — fora do app, leva à versão completa do EuthyApp */}
      <Card className="border-sage-200 bg-sage-50/30">
        <CardContent className="py-6 text-center">
          <p className="mb-3 text-sm text-gray-700">
            Quer guardar reflexões, marcar favoritos e acompanhar a sua evolução?
          </p>
          <Link
            href="/euthy-lancamento"
            className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sage-700"
          >
            Conhecer o EuthyApp
            <Sparkles className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
