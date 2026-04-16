'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

interface Lead {
  id: string
  nome: string
  email: string
  tipo_usuario: string
  source: string
  criado_em: string
}

export default function WaitlistPage() {
  const [leads, setLeads]   = useState<Lead[]>([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]     = useState('')

  useEffect(() => {
    fetch(`${API}/waitlist/admin?limit=500`, {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setErro(d.error); return }
        setLeads(d.leads ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(() => setErro('Erro ao carregar lista.'))
      .finally(() => setLoading(false))
  }, [])

  function exportCSV() {
    const header = 'Nome,E-mail,Perfil,Fonte,Data'
    const rows = leads.map(l =>
      `"${l.nome}","${l.email}","${l.tipo_usuario}","${l.source ?? ''}","${new Date(l.criado_em).toLocaleDateString('pt-PT')}"`
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'waitlist.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const terapeutas = leads.filter(l => l.tipo_usuario === 'terapeuta').length
  const clinicas   = leads.filter(l => l.tipo_usuario === 'clinica').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista de espera</h1>
          <p className="text-sm text-gray-400 mt-1">{total} inscritos</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV} disabled={leads.length === 0}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total inscritos', value: total },
          { label: 'Terapeutas',      value: terapeutas },
          { label: 'Clínicas',        value: clinicas },
        ].map(s => (
          <Card key={s.label} className="text-center">
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> A carregar…
        </div>
      )}

      {erro && <p className="text-red-500 text-sm">{erro}</p>}

      {!loading && !erro && (
        <Card className="p-0 overflow-hidden">
          {leads.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">Sem inscrições ainda.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-300 bg-cream-200/50">
                  {['Nome', 'E-mail', 'Perfil', 'Fonte', 'Data'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {leads.map(l => (
                  <tr key={l.id} className="hover:bg-cream-200/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{l.nome}</td>
                    <td className="px-5 py-3.5">
                      <a href={`mailto:${l.email}`} className="text-sage-600 hover:underline flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" /> {l.email}
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={l.tipo_usuario === 'clinica' ? 'lilac' : 'sage'} className="capitalize">{l.tipo_usuario}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{l.source ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {new Date(l.criado_em).toLocaleDateString('pt-PT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  )
}
