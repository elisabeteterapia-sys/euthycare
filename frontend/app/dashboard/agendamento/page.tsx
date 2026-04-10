'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Video, MapPin, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const mockEvents: Record<string, Array<{ time: string; patient: string; type: 'online' | 'presencial'; status: 'confirmada' | 'pendente' }>> = {
  '2026-04-08': [
    { time: '09:00', patient: 'Maria Silva', type: 'presencial', status: 'confirmada' },
    { time: '11:00', patient: 'João Fernandes', type: 'online', status: 'confirmada' },
    { time: '14:00', patient: 'Carla Ramos', type: 'presencial', status: 'pendente' },
  ],
  '2026-04-09': [
    { time: '10:00', patient: 'Lucas Mendes', type: 'online', status: 'confirmada' },
    { time: '15:00', patient: 'Sofia Andrade', type: 'presencial', status: 'confirmada' },
  ],
  '2026-04-15': [
    { time: '09:00', patient: 'Maria Silva', type: 'presencial', status: 'confirmada' },
  ],
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function AgendamentoPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState(today.toISOString().slice(0, 10))

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const selectedEvents = mockEvents[selected] ?? []

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function dateKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamento</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie suas sessões e disponibilidade</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nova sessão
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-800 text-lg">
                {MONTHS[month]} {year}
              </h2>
              <div className="flex gap-1">
                <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-cream-300 text-gray-500 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-cream-300 text-gray-500 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const key = dateKey(day)
                const isToday = key === today.toISOString().slice(0, 10)
                const isSelected = key === selected
                const hasEvents = !!mockEvents[key]

                return (
                  <button
                    key={day}
                    onClick={() => setSelected(key)}
                    className={cn(
                      'relative h-10 w-full rounded-xl text-sm font-medium transition-all duration-150',
                      isSelected && 'bg-sage-400 text-white shadow-soft',
                      !isSelected && isToday && 'border-2 border-sage-400 text-sage-700',
                      !isSelected && !isToday && 'hover:bg-cream-300 text-gray-700',
                    )}
                  >
                    {day}
                    {hasEvents && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-sage-400" />
                    )}
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Day detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {new Date(selected + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
            </CardTitle>
          </CardHeader>

          <div className="flex flex-col gap-3">
            {selectedEvents.length > 0 ? selectedEvents.map((ev, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-cream-200/60 hover:bg-cream-200 transition-colors">
                <div className="flex flex-col items-center pt-0.5">
                  <span className="text-xs font-semibold text-sage-600">{ev.time}</span>
                  <div className="flex-1 w-px bg-cream-400 mt-1" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar name={ev.patient} size="sm" />
                    <span className="text-sm font-medium text-gray-800">{ev.patient}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      {ev.type === 'online'
                        ? <><Video className="h-3 w-3" />Online</>
                        : <><MapPin className="h-3 w-3" />Presencial</>
                      }
                    </span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />50 min</span>
                  </div>
                  <Badge
                    variant={ev.status === 'confirmada' ? 'sage' : 'amber'}
                    className="mt-2"
                  >
                    {ev.status}
                  </Badge>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-sm text-gray-400">
                Nenhuma sessão neste dia.
                <br />
                <button className="text-sage-600 font-medium mt-2 hover:underline">+ Agendar</button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
