'use client'

/**
 * Admin /admin/neuroplasticidade
 * Vista read-only do cronograma + estudos publicados.
 * Conteúdo gerado pelo EuthyApp (clinica). Edição feita lá.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, ExternalLink, Sparkles, CalendarCheck, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Estudo {
  id: string
  titulo: string
  tema_principal: string
  data_publicacao: string
}
interface EstudoHoje extends Estudo {
  texto_referencia: string
}
interface Cronograma {
  id: string
  tema: string
  data_programada: string
  status: string
}
interface Payload {
  today: string
  estudo_hoje: EstudoHoje | null
  recentes: Estudo[]
  proximos: Cronograma[]
}

const EUTHY_APP_ADMIN = 'https://app.euthycare.com/admin/neuroplasticidade'

export default function AdminNeuroplasticidadePage() {
  const [data, setData]       = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/neuro/estudos')
      .then(r => r.json())
      .then(d => setData(d as Payload))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-sage-500" />
      </div>
    )
  }

  const estudoHoje = data?.estudo_hoje
  const recentes   = data?.recentes ?? []
  const proximos   = data?.proximos ?? []

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sage-500 to-lilac-500">
            <Brain className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Neuroplasticidade</h1>
            <p className="mt-1 text-sm text-gray-500">
              Conteúdo gerado pelo EuthyApp · {recentes.length} estudos publicados · {proximos.length} próximos
            </p>
          </div>
        </div>
        <a
          href={EUTHY_APP_ADMIN}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-sage-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-sage-700"
        >
          Editar no EuthyApp
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">Hoje</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{estudoHoje ? '1' : '0'}</p>
          <p className="mt-1 text-xs text-gray-400">
            {estudoHoje ? estudoHoje.tema_principal : 'sem estudo publicado'}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">Publicados</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{recentes.length}</p>
          <p className="mt-1 text-xs text-gray-400">últimos 12</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">Próximos</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{proximos.length}</p>
          <p className="mt-1 text-xs text-gray-400">no cronograma</p>
        </Card>
      </div>

      {/* Estudo de hoje */}
      {estudoHoje && (
        <Card className="border-sage-200 bg-sage-50/40 p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sage-700">
            <CalendarCheck className="h-4 w-4" /> Estudo de hoje · {new Date(estudoHoje.data_publicacao + 'T00:00:00').toLocaleDateString('pt-PT')}
          </div>
          <h2 className="text-lg font-bold text-gray-900">{estudoHoje.titulo}</h2>
          <Badge variant="sage" className="mt-2">{estudoHoje.tema_principal}</Badge>
          <p className="mt-3 line-clamp-3 text-sm text-gray-600">{estudoHoje.texto_referencia}</p>
          <Link
            href={`/neuroplasticidade/${estudoHoje.id}`}
            target="_blank"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-sage-700 hover:underline"
          >
            Ver no site público
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Card>
      )}

      {/* Próximos */}
      {proximos.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-lilac-700">
            <Sparkles className="h-4 w-4" />
            Próximos no cronograma
          </h3>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Tema</th>
                  <th className="px-4 py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {proximos.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 text-gray-600">
                      {new Date(p.data_programada + 'T00:00:00').toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900">{p.tema}</td>
                    <td className="px-4 py-2">
                      <Badge variant={p.status === 'publicado' ? 'sage' : 'lilac'}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Recentes */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Estudos publicados (últimos 12)
        </h3>
        {recentes.length === 0 ? (
          <p className="text-sm text-gray-400">Sem estudos ainda.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Título</th>
                  <th className="px-4 py-2">Tema</th>
                  <th className="px-4 py-2">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentes.map(e => (
                  <tr key={e.id}>
                    <td className="px-4 py-2 text-gray-600">
                      {new Date(e.data_publicacao + 'T00:00:00').toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900">{e.titulo}</td>
                    <td className="px-4 py-2">
                      <Badge variant="sage">{e.tema_principal}</Badge>
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/neuroplasticidade/${e.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-sage-700 hover:underline"
                      >
                        Ver <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Aviso */}
      <Card className="border-amber-200 bg-amber-50/40 p-4">
        <p className="text-sm text-amber-900">
          <strong>Como funciona:</strong> Os estudos são gerados diariamente pelo EuthyApp (clínica) usando IA Claude.
          Para alterar cronograma ou aprovar novos temas usa o painel admin do EuthyApp.
        </p>
      </Card>
    </div>
  )
}
