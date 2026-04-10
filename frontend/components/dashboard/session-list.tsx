import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Clock, Video, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export interface Session {
  id: string
  patientName: string
  date: string
  duration: number    // minutes
  type: 'presencial' | 'online'
  status: 'confirmada' | 'pendente' | 'cancelada' | 'realizada'
}

const statusVariant: Record<Session['status'], 'sage' | 'amber' | 'red' | 'cream'> = {
  confirmada: 'sage',
  pendente:   'amber',
  cancelada:  'red',
  realizada:  'cream',
}

export function SessionList({ sessions }: { sessions: Session[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessões de hoje</CardTitle>
      </CardHeader>

      <div className="flex flex-col gap-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-cream-200/60 transition-colors"
          >
            <Avatar name={s.patientName} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{s.patientName}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(s.date, { hour: '2-digit', minute: '2-digit' })} · {s.duration}min
                </span>
                <span className="flex items-center gap-1">
                  {s.type === 'online'
                    ? <><Video className="h-3 w-3" />Online</>
                    : <><MapPin className="h-3 w-3" />Presencial</>
                  }
                </span>
              </div>
            </div>
            <Badge variant={statusVariant[s.status]} className="capitalize">
              {s.status}
            </Badge>
          </div>
        ))}

        {sessions.length === 0 && (
          <p className="text-center py-6 text-sm text-gray-400">Nenhuma sessão agendada para hoje.</p>
        )}
      </div>
    </Card>
  )
}
