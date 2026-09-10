import { formatDuration, secondsBetween } from '@/lib/time'
import { useNow } from '@/hooks/use-now'
import { cn } from '@/lib/utils'

export function LiveTimer({
  startedAt,
  className,
}: {
  startedAt: string
  className?: string
}) {
  const now = useNow()
  const seconds = secondsBetween(startedAt, new Date(now).toISOString())
  return <span className={cn('font-mono tabular-nums', className)}>{formatDuration(seconds)}</span>
}
