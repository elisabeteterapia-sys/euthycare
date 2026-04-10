import { cn, initials } from '@/lib/utils'

interface AvatarProps {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full font-semibold',
        'bg-gradient-to-br from-sage-300 to-lilac-400 text-white flex-shrink-0',
        sizes[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  )
}
