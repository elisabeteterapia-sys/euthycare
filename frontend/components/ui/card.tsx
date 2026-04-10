import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: React.ReactNode
  hover?: boolean
}

export function Card({ className, children, hover, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card-base p-6 transition-shadow duration-200',
        hover && 'hover:shadow-lg cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn('text-lg font-semibold text-gray-800', className)}>{children}</h3>
}

export function CardDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn('text-sm text-gray-500 mt-1', className)}>{children}</p>
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn(className)}>{children}</div>
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mt-4 pt-4 border-t border-cream-300', className)}>{children}</div>
}
