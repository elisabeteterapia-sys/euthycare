'use client'

/**
 * Página pública /blog/neuroplasticidade
 * Lê estudos publicados pelo EuthyApp (tabelas app_neuro_* via /neuro/estudos).
 * Sem auth — qualquer visitante vê estudo de hoje + recentes + próximos temas.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, ChevronRight, Lock, Sparkles, CalendarCheck, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Route local Next.js (Vercel) — Supabase directo, sem passar pelo backend Express

interface EstudoResumo {
  id: string
  titulo: string
  tema_principal: string
  data_publicacao: string
}
interface EstudoHoje extends EstudoResumo {
  texto_referencia: string
}
interface Cronograma {
  id: string
  tema: string
  data_programada: string
  status: string
}
interface NeuroPayload {
  today: string
  estudo_hoje: EstudoHoje | null
  recentes: EstudoResumo[]
  proximos: Cronograma[]
}

export default function NeuroplasticidadePage() {
  const [data, setData]       = useState<NeuroPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/neuro/estudos')
      .then(r => r.json())
      .then(d => setData(d as NeuroPayload))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-sage-500" />
      </div>
    )
  }

  const estudoHoje = data?.estudo_hoje
  const recentes   = data?.recentes ?? []
  const proximos   = data?.proximos ?? []

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">
      {/* Cabeçalho */}
      <header className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sage-500 to-lilac-500 shadow">
          <Brain className="h-6 w-6 text-white" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Neuroplasticidade Aplicada</h1>
          <p className="mt-1 text-sm text-gray-500">
            Estudos diários para desenvolvimento clínico e pessoal.
          </p>
        </div>
      </header>

      {/* Estudo de hoje */}
      {estudoHoje ? (
        <Card className="border-sage-200 bg-gradient-to-br from-sage-50 to-lilac-50">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base text-sage-700">
                <CalendarCheck className="h-5 w-5" />
                Estudo de hoje
              </CardTitle>
              <Badge variant="sage">{estudoHoje.tema_principal}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h2 className="mb-2 text-xl font-bold text-gray-900">{estudoHoje.titulo}</h2>
            <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600">
              {estudoHoje.texto_referencia}
            </p>
            <Link
              href={`/blog/neuroplasticidade/${estudoHoje.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sage-700"
            >
              Ler estudo completo
              <ChevronRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-gray-500">Ainda não há estudo publicado para hoje.</p>
          </CardContent>
        </Card>
      )}

      {/* Em breve */}
      {proximos.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-lilac-700">
            <Sparkles className="h-4 w-4" />
            Em breve
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {proximos.map(p => {
              const dt   = new Date(p.data_programada + 'T00:00:00')
              const dias = Math.ceil((dt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return (
                <div
                  key={p.id}
                  className="relative cursor-not-allowed select-none rounded-lg border border-dashed border-lilac-200 bg-gradient-to-br from-lilac-50/40 to-gray-50/40 px-4 py-3"
                  title="Disponível na data programada"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 shrink-0 text-center">
                      <p className="text-[10px] uppercase leading-none text-lilac-400">
                        {dt.toLocaleDateString('pt-PT', { month: 'short' })}
                      </p>
                      <p className="text-base font-bold leading-tight text-lilac-600">{dt.getDate()}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-700">{p.tema}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-lilac-500">
                        <Lock className="h-3 w-3" />
                        {dias === 1 ? 'amanhã' : `daqui a ${dias} dias`}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Recentes */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Estudos recentes
        </h3>
        {recentes.length === 0 ? (
          <p className="text-sm text-gray-400">Sem estudos ainda.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {recentes.map(e => (
              <Link
                key={e.id}
                href={`/blog/neuroplasticidade/${e.id}`}
                className="block rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-sage-300 hover:bg-sage-50/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{e.titulo}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(e.data_publicacao + 'T00:00:00').toLocaleDateString('pt-PT', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <Badge variant="sage" className="shrink-0">{e.tema_principal}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
