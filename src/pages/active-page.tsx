import { useState } from 'react'
import { EndSessionDialog } from '@/components/end-session-dialog'
import { StartSessionDialog } from '@/components/start-session-dialog'
import { StatusPill } from '@/components/status-pill'
import { LiveTimer } from '@/components/timer'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import { amountForDuration, billedSeconds } from '@/lib/billing'
import { assetsForSession, extendSession, sessionDisplayName } from '@/lib/store'
import { formatClock, formatDuration, secondsBetween } from '@/lib/time'
import { useAppData } from '@/lib/use-store'
import { useNow } from '@/hooks/use-now'
import type { GamingSession } from '@/lib/types'
import {
  warningCardClass,
  warningLevel,
  warningPeriod,
  warningPhotoClass,
  warningRibbonClass,
  warningTimerClass,
} from '@/lib/warning'
import { cn } from '@/lib/utils'

export function ActivePage() {
  const data = useAppData()
  const now = useNow()
  const [startOpen, setStartOpen] = useState(false)
  const [ending, setEnding] = useState<GamingSession | null>(null)
  const active = data.sessions.filter((session) => session.status === 'active')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Active sessions</h1>
          <p className="text-sm text-muted">{active.length} running now</p>
        </div>
        <Button className="flex-1 sm:flex-none" onClick={() => setStartOpen(true)}>
          New session
        </Button>
      </div>

      {active.length === 0 ? (
        <Empty title="No one is playing" body="Start a session from the floor when a customer sits down." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
          {active.map((session) => {
            const raw = secondsBetween(session.startedAt, new Date(now).toISOString())
            const billed = billedSeconds(
              raw,
              session.billingIncrementMinutes,
              session.minimumDurationMinutes,
              session.roundingMode,
            )
            const estimate = amountForDuration(session.hourlyRatePaise, billed)
            const allocations = assetsForSession(session.id, data)
            const stations = allocations.filter(
              (row) => data.assetTypes.find((type) => type.id === row.assetTypeId)?.isStation,
            )
            const extras = allocations.filter((row) => !stations.includes(row))
            const stationLabel =
              stations.map((row) => row.assetNameSnapshot).join(' + ') || session.packageNameSnapshot
            const image = data.packages.find((pkg) => pkg.id === session.pricingPackageId)?.imagePath
            const period = warningPeriod(session, data.settings, now)
            const warning = warningLevel(period.progress, data.settings)
            return (
              <article
                key={session.id}
                className={cn(
                  'esports-card flex h-full flex-col overflow-hidden rounded-2xl border',
                  warningCardClass[warning],
                )}
              >
                <div className={cn('product-well relative h-40 shrink-0 overflow-hidden sm:h-48', warningPhotoClass[warning])}>
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      width={640}
                      height={640}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain p-1.5 sm:p-2"
                    />
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 h-[46%] bg-[linear-gradient(180deg,transparent,rgba(6,15,28,0.72)_46%,rgba(6,15,28,0.96))]" />
                  <div className="absolute inset-0 flex flex-col">
                    {warning !== 'none' ? (
                      <div
                        className={cn(
                          'py-1 text-center text-[10px] font-black tracking-[0.14em] uppercase',
                          warningRibbonClass[warning],
                        )}
                      >
                        {warning === 'red' ? 'Time up' : warning === 'orange' ? 'Almost up' : 'Time warning'}
                      </div>
                    ) : null}
                    <div className="flex items-start justify-between gap-1 p-2">
                      <span className="max-w-[72%] truncate rounded-lg bg-[#060f1c]/85 px-2 py-1 text-sm font-extrabold text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                        {stationLabel}
                      </span>
                      <span className="live-pip mt-1 size-2.5 shrink-0 rounded-full bg-crimson shadow-[0_0_0_3px_rgba(6,15,28,0.7)] sm:hidden" />
                      <span className="hidden sm:inline-flex">
                        <StatusPill status="in-use">In use</StatusPill>
                      </span>
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-2.5 pb-1.5">
                    <LiveTimer
                      startedAt={session.startedAt}
                      className={cn('text-xl leading-none font-bold sm:text-2xl', warningTimerClass[warning])}
                    />
                    <span className="text-base leading-none font-extrabold text-white sm:text-lg">
                      {formatMoney(estimate)}
                    </span>
                  </div>
                </div>

                <div className="flex min-h-[108px] flex-1 flex-col gap-2 p-2.5 sm:min-h-[112px] sm:p-3">
                  <div className="min-w-0 truncate text-sm font-bold text-[#eef8ff]">
                    {sessionDisplayName(session, data)}
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">Started</div>
                      <div className="text-base font-extrabold tabular-nums text-white sm:text-lg">
                        {formatClock(session.startedAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">Time left</div>
                      <div
                        className={cn(
                          'text-base font-extrabold tabular-nums sm:text-lg',
                          warning === 'none' ? 'text-white' : warningTimerClass[warning],
                        )}
                      >
                        {warning === 'red' ? 'Extend' : formatDuration(period.remainingSeconds)}
                      </div>
                    </div>
                  </div>
                  <div className="truncate text-[10px] text-muted">
                    {[session.packageNameSnapshot, ...extras.map((row) => row.assetNameSnapshot)].join(' · ')}
                  </div>
                  <div className="mt-auto flex gap-1.5">
                    <Button
                      size="sm"
                      variant={warning === 'none' ? 'outline' : 'gold'}
                      className="flex-1 px-1 text-xs"
                      onClick={() => extendSession(session.id)}
                    >
                      +{data.settings.warningExtendMinutes}m
                    </Button>
                    <Button
                      size="sm"
                      variant="crimson"
                      className="flex-1 px-1 text-xs"
                      onClick={() => setEnding(session)}
                    >
                      End
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <StartSessionDialog open={startOpen} onOpenChange={setStartOpen} data={data} />
      <EndSessionDialog open={Boolean(ending)} onOpenChange={(open) => !open && setEnding(null)} data={data} session={ending} />
    </div>
  )
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <div className="text-xl font-bold">{title}</div>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </div>
  )
}
