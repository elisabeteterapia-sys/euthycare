'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Search, Loader2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

interface Utilizador {
  id: string
  nome: string | null
  email: string
  avatar_url: string | null
  created_at: string
  stripe_subscription_status: string | null
}

export default function UtilizadoresPage() {
  const [todos, setTodos]       = useState<Utilizador[]>([])
  const [filtro, setFiltro]     = useState('')
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [erro, setErro]         = useState('')

  useEffect(() => {
    fetch(`${API}/users/admin?limit=500`, {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setErro(d.error); return }
        setTodos(d.utilizadores ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(() => setErro('Erro ao carregar utilizadores.'))
      .finally(() => setLoading(false))
  }, [])

  const lista = filtro
    ? todos.filter(u =>
        (u.nome ?? '').toLowerCase().includes(filtro.toLowerCase()) ||
        u.email.toLowerCase().includes(filtro.toLowerCase())
      )
    : todos

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Utilizadores</h1>
        <p className="text-sm text-gray-400 mt-1">{total} contas registadas</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          placeholder="Pesquisar utilizador…"
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-12 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> A carregar…
        </div>
      )}

      {erro && <p className="text-red-500 text-sm">{erro}</p>}

      {!loading && !erro && (
        <Card className="p-0 overflow-hidden">
          {lista.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">
              {filtro ? 'Sem resultados.' : 'Sem utilizadores registados.'}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-300 bg-cream-200/50">
                  {['Utilizador', 'Estado', 'Registado'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {lista.map(u => (
                  <tr key={u.id} className="hover:bg-cream-200/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.nome ?? u.email} size="sm" />
                        <div>
                          <p className="font-medium text-gray-800">{u.nome ?? '—'}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={u.stripe_subscription_status === 'active' ? 'sage' : 'cream'}>
                        {u.stripe_subscription_status === 'active' ? 'Pro' : 'Free'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('pt-PT')}
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
