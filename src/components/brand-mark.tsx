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
        src="/images/brand/logo.webp"
        alt="Phoenix Gaming Zone"
        width={480}
        height={348}
        decoding="async"
        className={cn('object-contain', compact ? 'h-12 w-auto' : 'h-28 w-auto md:h-36', markClassName)}
      />
      {compact ? (
        <div className="leading-tight">
          <div className="text-sm font-extrabold tracking-[0.14em]">PHOENIX</div>
          <div className="text-[9px] tracking-[0.2em] text-electric-soft">GAMING ZONE</div>
        </div>
      ) : null}
    </div>
  )
}
