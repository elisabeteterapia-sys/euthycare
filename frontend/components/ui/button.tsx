import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'lilac'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary:   'bg-sage-400 text-white hover:bg-sage-500 shadow-soft active:bg-sage-600',
  secondary: 'bg-cream-300 text-sage-800 hover:bg-cream-400 active:bg-cream-500',
  outline:   'border border-sage-400 text-sage-600 hover:bg-sage-50 active:bg-sage-100',
  ghost:     'text-sage-600 hover:bg-sage-50 active:bg-sage-100',
  lilac:     'bg-lilac-400 text-white hover:bg-lilac-500 shadow-lilac active:bg-lilac-600',
}

const sizes = {
  sm: 'h-8 px-3 text-sm rounded-xl',
  md: 'h-10 px-5 text-sm rounded-xl',
  lg: 'h-12 px-7 text-base rounded-2xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

export { Button }
