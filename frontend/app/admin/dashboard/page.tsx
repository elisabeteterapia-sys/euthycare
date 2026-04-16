'use client'

import { useEffect, useState } from 'react'
import { Users, CalendarDays, Mail, Euro } from 'lucide-react'
import { Card } from '@/components/ui/card'

const API           = process.env.NEXT_PUBLIC_API_URL    ?? 'http://localhost:3001'
const ADMIN_SECRET  = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

interface Stats {
  utilizadores: number | null
  agendamentos: number | null
  waitlist:     number | null
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ utilizadores: null, agendamentos: null, waitlist: null })

  useEffect(() => {
    const h = { 'x-admin-secret': ADMIN_SECRET }

    Promise.all([
      fetch(`${API}/users/admin?limit=1`,         { headers: h }).then(r => r.json()).catch(() => null),
      fetch(`${API}/agendamento/admin`,            { headers: h }).then(r => r.json()).catch(() => null),
      fetch(`${API}/waitlist/admin/count`,         { headers: h }).then(r => r.json()).catch(() => null),
    ]).then(([users, agend, wl]) => {
      setStats({
        utilizadores: users?.total   ?? null,
        agendamentos: Array.isArray(agend) ? agend.length : (agend?.total ?? null),
        waitlist:     wl?.count      ?? null,
      })
    })
  }, [])

  const fmt = (v: number | null) => v === null ? '—' : String(v)

  const cards = [
    { label: 'Utilizadores registados', value: fmt(stats.utilizadores), icon: Users,       color: 'bg-sage-100 text-sage-600' },
    { label: 'Consultas agendadas',     value: fmt(stats.agendamentos), icon: CalendarDays, color: 'bg-lilac-100 text-lilac-600' },
    { label: 'Lista de espera',         value: fmt(stats.waitlist),     icon: Mail,         color: 'bg-amber-100 text-amber-600' },
    { label: 'Receita do mês',          value: '—',                     icon: Euro,         color: 'bg-sage-100 text-sage-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão geral</h1>
        <p className="text-sm text-gray-400 mt-1">Resumo de actividade do site</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(s => (
          <Card key={s.label} className="flex items-start gap-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
