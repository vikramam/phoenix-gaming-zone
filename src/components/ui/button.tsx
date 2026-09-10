import { Slot } from '@radix-ui/react-slot'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'gold' | 'electric' | 'crimson' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  asChild?: boolean
}

export function Button({
  className,
  variant = 'gold',
  size = 'md',
  asChild = false,
  ...props
}: Props) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-bold tracking-wide whitespace-nowrap transition duration-200 disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-11 px-4 text-sm',
        size === 'lg' && 'h-12 px-5 text-base',
        variant === 'gold' && 'bg-gold text-[#142033] shadow-[0_8px_22px_rgba(255,209,65,0.18)] hover:bg-[#ffdb6b] hover:-translate-y-0.5',
        variant === 'electric' && 'bg-electric text-white shadow-[0_8px_22px_rgba(35,136,237,0.22)] hover:bg-[#3b9cf3] hover:-translate-y-0.5',
        variant === 'crimson' && 'bg-crimson text-white hover:bg-[#ef5252]',
        variant === 'ghost' && 'bg-transparent text-white hover:bg-white/8',
        variant === 'outline' && 'border border-line bg-[#0c1c2e]/55 text-white hover:border-electric-soft/70 hover:bg-electric/10',
        className,
      )}
      {...props}
    />
  )
}
