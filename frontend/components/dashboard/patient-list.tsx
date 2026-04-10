import { Avatar } from '@/components/ui/avatar'
import { Badge, StatusDot } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, MoreHorizontal } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export interface Patient {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive' | 'pending'
  nextSession?: string
  totalSessions: number
}

interface PatientListProps {
  patients: Patient[]
}

const statusLabel: Record<Patient['status'], string> = {
  active:   'Ativo',
  inactive: 'Inativo',
  pending:  'Pendente',
}

const statusBadge: Record<Patient['status'], 'sage' | 'cream' | 'amber'> = {
  active:   'sage',
  inactive: 'cream',
  pending:  'amber',
}

export function PatientList({ patients }: PatientListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pacientes</CardTitle>
        <Button size="sm" className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Novo paciente
        </Button>
      </CardHeader>

      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-300">
              {['Paciente', 'Status', 'Próxima sessão', 'Sessões', ''].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="border-b border-cream-300 last:border-0 hover:bg-cream-200/50 transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} size="sm" />
                    <div>
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={p.status} />
                    <Badge variant={statusBadge[p.status]}>{statusLabel[p.status]}</Badge>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-gray-600">
                  {p.nextSession ? formatDate(p.nextSession, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="px-6 py-3.5 text-gray-600">{p.totalSessions}</td>
                <td className="px-6 py-3.5">
                  <button className="p-1 rounded-lg hover:bg-cream-300 text-gray-400 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {patients.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Nenhum paciente cadastrado ainda.
          </div>
        )}
      </div>
    </Card>
  )
}
