'use client'

import { CreditCard, Smartphone, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PaymentMethod = 'card' | 'mbway' | 'multibanco'

interface MethodOption {
  id: PaymentMethod
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  available: boolean
  badge?: string
}

const METHODS: MethodOption[] = [
  {
    id: 'card',
    label: 'Cartão',
    description: 'Crédito ou débito',
    icon: CreditCard,
    available: true,
  },
  {
    id: 'mbway',
    label: 'MBWay',
    description: 'Pagamento móvel',
    icon: Smartphone,
    available: process.env.NEXT_PUBLIC_ENABLE_MBWAY === 'true',
    badge: 'Portugal',
  },
  {
    id: 'multibanco',
    label: 'Multibanco',
    description: 'Referência ATM',
    icon: Building2,
    available: process.env.NEXT_PUBLIC_ENABLE_MULTIBANCO === 'true',
    badge: 'Portugal',
  },
]

interface PaymentMethodSelectorProps {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  const available = METHODS.filter((m) => m.available)

  if (available.length <= 1) return null  // Only card — no need for a selector

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Método de pagamento</p>
      <div className="grid grid-cols-3 gap-2">
        {available.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onChange(method.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center',
              value === method.id
                ? 'border-sage-400 bg-sage-50 shadow-soft'
                : 'border-cream-400 bg-cream-100 hover:border-sage-300 hover:bg-sage-50/50'
            )}
          >
            <method.icon className={cn('h-5 w-5', value === method.id ? 'text-sage-500' : 'text-gray-400')} />
            <span className={cn('text-xs font-medium', value === method.id ? 'text-sage-700' : 'text-gray-600')}>
              {method.label}
            </span>
            {method.badge && (
              <span className="text-[10px] text-gray-400">{method.badge}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
