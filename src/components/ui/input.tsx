import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-xl border border-line bg-[#0b1b2d]/85 px-3 text-white outline-none transition placeholder:text-muted/65 focus:border-electric-soft focus:ring-2 focus:ring-electric/15 disabled:cursor-not-allowed disabled:opacity-55',
        className,
      )}
      {...props}
    />
  )
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-xl border border-line bg-[#0b1b2d]/85 px-3 py-2 text-white outline-none transition placeholder:text-muted/65 focus:border-electric-soft focus:ring-2 focus:ring-electric/15 disabled:cursor-not-allowed disabled:opacity-55',
        className,
      )}
      {...props}
    />
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{children}</label>
}
