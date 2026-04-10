import type { Metadata } from 'next'
import { Users, CalendarDays, ShoppingBag, Mail, TrendingUp, Euro } from 'lucide-react'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Visão geral · Admin' }

const stats = [
  { label: 'Utilizadores registados', value: '142',  delta: '+12 este mês', icon: Users,       color: 'bg-sage-100 text-sage-600' },
  { label: 'Consultas agendadas',     value: '38',   delta: 'este mês',     icon: CalendarDays, color: 'bg-lilac-100 text-lilac-600' },
  { label: 'Lista de espera',         value: '89',   delta: '+23 esta semana', icon: Mail,      color: 'bg-amber-100 text-amber-600' },
  { label: 'Receita do mês',          value: '€1 240', delta: '+18% vs anterior', icon: Euro,  color: 'bg-sage-100 text-sage-600' },
  { label: 'Vendas na loja',          value: '34',   delta: 'downloads',    icon: ShoppingBag, color: 'bg-lilac-100 text-lilac-600' },
  { label: 'Taxa de conversão',       value: '6.2%', delta: 'waitlist→pago', icon: TrendingUp, color: 'bg-amber-100 text-amber-600' },
]

const atividade = [
  { acao: 'Novo agendamento',       detalhe: 'Maria Silva · 12 Abr 14h',      tempo: '2 min' },
  { acao: 'Compra na loja',         detalhe: 'Guia de Regulação Emocional',   tempo: '15 min' },
  { acao: 'Inscrição lista espera', detalhe: 'joao@email.com · terapeuta',    tempo: '1 h' },
  { acao: 'Pacote adquirido',       detalhe: 'Evolução · €240 · ana@…',       tempo: '2 h' },
  { acao: 'Consulta confirmada',    detalhe: 'João Fernandes · 11 Abr 16h',   tempo: '3 h' },
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão geral</h1>
        <p className="text-sm text-gray-400 mt-1">Resumo de actividade do site</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="flex items-start gap-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              <p className="text-xs text-sage-500 mt-1 font-medium">{s.delta}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-semibold text-gray-800 mb-4">Actividade recente</h2>
        <div className="space-y-3">
          {atividade.map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-cream-300 last:border-0">
              <div className="h-2 w-2 rounded-full bg-sage-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{a.acao}</p>
                <p className="text-xs text-gray-400 truncate">{a.detalhe}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{a.tempo}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
