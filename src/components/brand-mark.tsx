import { cn } from '@/lib/utils'

export function BrandMark({
  compact = false,
  className,
  markClassName,
}: {
  compact?: boolean
  className?: string
  markClassName?: string
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img
        src="/new_logo.jpg"
        alt="Phoenix Gaming Zone"
        width={1024}
        height={1024}
        decoding="async"
        className={cn('object-contain mix-blend-screen', compact ? 'h-14 w-auto' : 'h-28 w-auto md:h-36', markClassName)}
      />
    </div>
  )
}
