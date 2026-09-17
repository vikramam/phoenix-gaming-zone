import { cn } from '@/lib/utils'

const styles = {
  available:
    'border-electric bg-electric text-white shadow-[0_0_0_1px_rgba(89,182,255,0.55),0_8px_20px_rgba(35,136,237,0.5)]',
  'in-use':
    'border-crimson bg-crimson text-white shadow-[0_0_0_1px_rgba(255,139,139,0.5),0_8px_20px_rgba(240,82,95,0.48)]',
  maintenance: 'border-amber-400/40 bg-amber-400/15 text-amber-200',
  disabled: 'border-white/15 bg-white/8 text-muted',
  retired: 'border-white/10 bg-white/5 text-muted',
  live: 'border-electric bg-electric text-white shadow-[0_0_0_1px_rgba(89,182,255,0.55),0_8px_20px_rgba(35,136,237,0.5)]',
}

export function StatusPill({
  status,
  children,
}: {
  status: keyof typeof styles
  children: string
}) {
  const lit = status === 'available' || status === 'in-use' || status === 'live'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold tracking-[0.14em] uppercase',
        styles[status],
      )}
    >
      {lit ? (
        <span
          className={cn(
            'size-1.5 rounded-full bg-white',
            (status === 'in-use' || status === 'live') && 'live-pip',
          )}
        />
      ) : null}
      {children}
    </span>
  )
}
