import { cn } from '@/lib/utils'

type BadgeVariant = 'sage' | 'lilac' | 'cream' | 'red' | 'amber'

const variants: Record<BadgeVariant, string> = {
  sage:  'bg-sage-100 text-sage-700 border-sage-200',
  lilac: 'bg-lilac-100 text-lilac-700 border-lilac-200',
  cream: 'bg-cream-300 text-gray-600 border-cream-400',
  red:   'bg-red-50 text-red-600 border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'sage', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusDot({ status }: { status: 'active' | 'inactive' | 'pending' }) {
  const colors = {
    active:   'bg-sage-400',
    inactive: 'bg-gray-300',
    pending:  'bg-amber-400',
  }
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', colors[status])}
      aria-hidden="true"
    />
  )
}
