import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Search } from 'lucide-react'

export const metadata: Metadata = { title: 'Utilizadores · Admin' }

type Plano = 'free' | 'pro' | 'enterprise'

const utilizadores: { id: string; nome: string; email: string; plano: Plano; sessoes: number; registado: string; status: 'ativo' | 'inativo' }[] = [
  { id: '1', nome: 'Ana Lima',        email: 'ana@consultorio.com', plano: 'pro',        sessoes: 68, registado: '12 Jan 2026', status: 'ativo' },
  { id: '2', nome: 'Bruno Ferreira',  email: 'bruno@terapia.pt',   plano: 'enterprise', sessoes: 120, registado: '3 Fev 2026', status: 'ativo' },
  { id: '3', nome: 'Catarina Neves',  email: 'cat@email.com',      plano: 'free',       sessoes: 2,  registado: '28 Mar 2026', status: 'ativo' },
  { id: '4', nome: 'Daniel Costa',    email: 'daniel@psico.pt',    plano: 'pro',        sessoes: 31, registado: '5 Mar 2026',  status: 'ativo' },
  { id: '5', nome: 'Eva Santos',      email: 'eva@email.com',      plano: 'free',       sessoes: 0,  registado: '1 Abr 2026',  status: 'inativo' },
]

const planoVariant: Record<Plano, 'sage' | 'lilac' | 'cream'> = {
  free: 'cream', pro: 'sage', enterprise: 'lilac',
}

export default function UtilizadoresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Utilizadores</h1>
        <p className="text-sm text-gray-400 mt-1">{utilizadores.length} contas registadas</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input placeholder="Pesquisar utilizador…" className="w-full h-10 pl-10 pr-4 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400" />
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-300 bg-cream-200/50">
              {['Utilizador', 'Plano', 'Sessões', 'Registado', 'Estado'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-300">
            {utilizadores.map(u => (
              <tr key={u.id} className="hover:bg-cream-200/40 transition-colors cursor-pointer">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.nome} size="sm" />
                    <div>
                      <p className="font-medium text-gray-800">{u.nome}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={planoVariant[u.plano]} className="capitalize">{u.plano}</Badge>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{u.sessoes}</td>
                <td className="px-5 py-3.5 text-gray-500">{u.registado}</td>
                <td className="px-5 py-3.5">
                  <Badge variant={u.status === 'ativo' ? 'sage' : 'cream'}>{u.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
