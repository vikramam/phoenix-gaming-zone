import { cn } from '@/lib/utils'

const styles = {
  available: 'border-electric/40 bg-electric/15 text-electric-soft',
  'in-use': 'border-crimson/40 bg-crimson/15 text-[#ff8b8b]',
  maintenance: 'border-amber-400/40 bg-amber-400/15 text-amber-200',
  disabled: 'border-white/15 bg-white/8 text-muted',
  retired: 'border-white/10 bg-white/5 text-muted',
  live: 'border-electric/40 bg-electric/15 text-electric-soft',
}

export function StatusPill({
  status,
  children,
}: {
  status: keyof typeof styles
  children: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-[0.14em] uppercase',
        styles[status],
      )}
    >
      {status === 'in-use' || status === 'live' ? (
        <span className="live-pip size-1.5 rounded-full bg-current" />
      ) : null}
      {children}
    </span>
  )
}
