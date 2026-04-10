import type { Metadata } from 'next'
import { Users, Plus, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'

export const metadata: Metadata = { title: 'Pacientes' }

type Status = 'active' | 'pending' | 'inactive'

const pacientes: { id: string; name: string; email: string; status: Status; totalSessions: number; nextSession: string }[] = [
  { id: '1', name: 'Maria Silva',     email: 'maria@email.com',  status: 'active',   totalSessions: 12, nextSession: 'Amanhã, 14h' },
  { id: '2', name: 'João Fernandes',  email: 'joao@email.com',   status: 'active',   totalSessions: 6,  nextSession: 'Hoje, 16h' },
  { id: '3', name: 'Sofia Andrade',   email: 'sofia@email.com',  status: 'active',   totalSessions: 8,  nextSession: 'Sex, 10h' },
  { id: '4', name: 'Lucas Mendes',    email: 'lucas@email.com',  status: 'pending',  totalSessions: 1,  nextSession: '—' },
  { id: '5', name: 'Carla Ramos',     email: 'carla@email.com',  status: 'inactive', totalSessions: 20, nextSession: '—' },
  { id: '6', name: 'Pedro Alves',     email: 'pedro@email.com',  status: 'active',   totalSessions: 4,  nextSession: 'Seg, 11h' },
]

const statusMap = {
  active:   { label: 'Ativo',     variant: 'sage'  as const },
  pending:  { label: 'Pendente',  variant: 'amber' as const },
  inactive: { label: 'Inativo',   variant: 'cream' as const },
}

export default function PacientesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-400 mt-1">{pacientes.length} pacientes registados</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Novo paciente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Pesquisar paciente…"
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400"
        />
      </div>

      {/* Lista */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-300 bg-cream-200/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Paciente</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Próxima sessão</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Sessões</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-300">
            {pacientes.map((p) => (
              <tr key={p.id} className="hover:bg-cream-200/40 transition-colors cursor-pointer">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} size="sm" />
                    <div>
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell text-gray-600">{p.nextSession}</td>
                <td className="px-5 py-3.5 hidden lg:table-cell text-gray-600">{p.totalSessions}</td>
                <td className="px-5 py-3.5">
                  <Badge variant={statusMap[p.status].variant}>{statusMap[p.status].label}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
