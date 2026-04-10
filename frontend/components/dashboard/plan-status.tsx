import { Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PlanStatusProps {
  plan: 'free' | 'pro' | 'enterprise'
  renewalDate?: string
}

const planConfig = {
  free:       { label: 'Gratuito', variant: 'cream' as const, color: 'text-gray-600' },
  pro:        { label: 'Pro',      variant: 'sage' as const,  color: 'text-sage-700' },
  enterprise: { label: 'Clínica', variant: 'lilac' as const, color: 'text-lilac-700' },
}

export function PlanStatus({ plan, renewalDate }: PlanStatusProps) {
  const config = planConfig[plan]
  const isPaid = plan !== 'free'

  return (
    <Card className="bg-gradient-to-br from-sage-50 to-lilac-50 border-sage-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Plano atual</p>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sage-400" />
            <span className={`font-bold text-xl ${config.color}`}>{config.label}</span>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </div>
      </div>

      {isPaid ? (
        <div className="space-y-2">
          {renewalDate && (
            <p className="text-sm text-gray-500">
              Próxima renovação: <span className="font-medium text-gray-700">{renewalDate}</span>
            </p>
          )}
          <Link href="/dashboard/billing">
            <Button variant="ghost" size="sm" className="px-0 text-sage-600">
              Gerenciar assinatura <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            Desbloqueie pacientes ilimitados, agendamento avançado e muito mais.
          </p>
          <Link href="/venda">
            <Button size="sm" className="gap-1">
              Fazer upgrade <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}
