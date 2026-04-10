import { Users, CalendarDays, TrendingUp, Clock } from 'lucide-react'
import { Card, CardTitle, CardDescription } from '@/components/ui/card'
import { PatientList, type Patient } from '@/components/dashboard/patient-list'
import { SessionList, type Session } from '@/components/dashboard/session-list'
import { PlanStatus } from '@/components/dashboard/plan-status'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

// Mock data — substituir por chamadas à API
const patients: Patient[] = [
  { id: '1', name: 'Maria Silva', email: 'maria@email.com', status: 'active', nextSession: '2026-04-09T14:00:00', totalSessions: 12 },
  { id: '2', name: 'João Fernandes', email: 'joao@email.com', status: 'active', nextSession: '2026-04-09T16:00:00', totalSessions: 6 },
  { id: '3', name: 'Lucas Mendes', email: 'lucas@email.com', status: 'pending', totalSessions: 1 },
  { id: '4', name: 'Carla Ramos', email: 'carla@email.com', status: 'inactive', totalSessions: 20 },
]

const sessions: Session[] = [
  { id: 's1', patientName: 'Maria Silva', date: '2026-04-09T14:00:00', duration: 50, type: 'presencial', status: 'confirmada' },
  { id: 's2', patientName: 'João Fernandes', date: '2026-04-09T16:00:00', duration: 50, type: 'online', status: 'pendente' },
  { id: 's3', patientName: 'Sofia Andrade', date: '2026-04-09T17:30:00', duration: 50, type: 'presencial', status: 'confirmada' },
]

const stats = [
  { label: 'Pacientes ativos', value: '24', delta: '+3 este mês', icon: Users, color: 'text-sage-500 bg-sage-100' },
  { label: 'Sessões este mês', value: '68', delta: '+12 vs anterior', icon: CalendarDays, color: 'text-lilac-600 bg-lilac-100' },
  { label: 'Taxa de comparecimento', value: '91%', delta: '+4% vs anterior', icon: TrendingUp, color: 'text-sage-500 bg-sage-100' },
  { label: 'Horas em sessão', value: '56h', delta: 'este mês', icon: Clock, color: 'text-lilac-600 bg-lilac-100' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bom dia, Dra. Ana 🌿</h1>
        <p className="text-gray-400 text-sm mt-1">Quarta-feira, 8 de abril de 2026</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-start gap-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 leading-tight mt-0.5">{stat.label}</p>
              <p className="text-xs text-sage-500 mt-1 font-medium">{stat.delta}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SessionList sessions={sessions} />
          <PatientList patients={patients} />
        </div>
        <div>
          <PlanStatus plan="pro" renewalDate="9 de maio de 2026" />
        </div>
      </div>
    </div>
  )
}
