import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  )
}

export function DialogContent({
  children,
  className,
  title,
  footer,
}: {
  children: ReactNode
  className?: string
  title: string
  footer?: ReactNode
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#020914]/80 backdrop-blur-md" />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-1.5rem)] w-[min(920px,calc(100vw-1rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[#31516f] bg-[#11243a]/98 shadow-[0_32px_100px_rgba(0,8,20,0.65),0_0_0_1px_rgba(89,182,255,0.06)] sm:rounded-3xl',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line/60 px-4 py-3.5 sm:px-7 sm:py-5">
          <DialogPrimitive.Title className="text-xl font-extrabold tracking-[-0.02em] uppercase sm:text-2xl">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close className="-mr-1 rounded-md p-1 text-muted hover:bg-white/8 hover:text-white">
            <X className="size-5" />
          </DialogPrimitive.Close>
        </div>
        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-7 sm:py-6">{children}</div>
        {footer ? (
          <div className="border-t border-line/60 bg-[#0f2136] px-4 py-3.5 sm:px-7 sm:py-4">{footer}</div>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
