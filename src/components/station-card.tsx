import { LiveTimer } from './timer'
import { StatusPill } from './status-pill'
import { Button } from './ui/button'
import { formatMoney } from '@/lib/money'
import { sessionSnacksPaise } from '@/lib/snacks'
import { amountForDuration, billedSeconds } from '@/lib/billing'
import { assetsForSession, extendSession, sessionDisplayName } from '@/lib/store'
import { formatDuration, secondsBetween } from '@/lib/time'
import { useNow } from '@/hooks/use-now'
import type { AppData, Asset, GamingSession } from '@/lib/types'
import {
  warningCardClass,
  warningLevel,
  warningPeriod,
  warningPhotoClass,
  warningRibbonClass,
  warningTimerClass,
} from '@/lib/warning'
import { cn } from '@/lib/utils'

export function StationCard({
  data,
  asset,
  session,
  onStart,
  onEnd,
  onAddSnacks,
}: {
  data: AppData
  asset: Asset
  session: GamingSession | null
  onStart: () => void
  onEnd: () => void
  onAddSnacks?: () => void
}) {
  const now = useNow()
  const type = data.assetTypes.find((row) => row.id === asset.assetTypeId)
  const allocations = session ? assetsForSession(session.id, data) : []
  const extras = allocations.filter((row) => row.assetId !== asset.id)
  const image = session
    ? data.packages.find((pkg) => pkg.id === session.pricingPackageId)?.imagePath || type?.imagePath
    : type?.imagePath

  let estimate = 0
  if (session) {
    const raw = secondsBetween(session.startedAt, new Date(now).toISOString())
    const billed = billedSeconds(
      raw,
      session.billingIncrementMinutes,
      session.minimumDurationMinutes,
      session.roundingMode,
    )
    estimate = amountForDuration(session.hourlyRatePaise, billed)
  }
  const snacks = sessionSnacksPaise(session)
  const total = estimate + snacks

  const status =
    asset.operationalStatus === 'maintenance'
      ? 'maintenance'
      : asset.operationalStatus === 'disabled'
        ? 'disabled'
        : asset.operationalStatus === 'retired'
          ? 'retired'
          : session
            ? 'in-use'
            : 'available'

  const period = session ? warningPeriod(session, data.settings, now) : null
  const warning = period ? warningLevel(period.progress, data.settings) : 'none'
  const remainingLabel =
    warning === 'red' ? 'Extend or end' : `${formatDuration(period?.remainingSeconds ?? 0)} left`

  return (
    <article
      className={cn(
        'esports-card group flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:border-electric/45',
        warningCardClass[warning],
      )}
    >
      <div className={cn('product-well relative h-40 shrink-0 overflow-hidden sm:h-48', warningPhotoClass[warning])}>
        {image ? (
          <img
            src={image}
            alt={asset.name}
            width={640}
            height={640}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-1.5 transition duration-300 group-hover:scale-[1.03] sm:p-2"
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
            <span className="max-w-[70%] truncate rounded-lg bg-[#060f1c]/85 px-1.5 py-0.5 text-xs font-extrabold text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)] backdrop-blur-sm">
              {asset.name}
            </span>
            {session ? (
              <StatusPill status="in-use">In use</StatusPill>
            ) : (
              <StatusPill status={status}>{status === 'available' ? 'Available' : asset.operationalStatus}</StatusPill>
            )}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-2.5 pb-1.5">
          {session ? (
            <>
              <LiveTimer
                startedAt={session.startedAt}
                className={cn('text-xl leading-none font-bold sm:text-2xl', warningTimerClass[warning])}
              />
              <span className="text-base leading-none font-extrabold text-white sm:text-lg">
                {formatMoney(total)}
              </span>
            </>
          ) : (
            <span className="text-[11px] font-semibold tracking-wider text-white/70 uppercase">{asset.code}</span>
          )}
        </div>
      </div>

      <div className="flex min-h-[108px] flex-1 flex-col gap-2 p-2.5 sm:min-h-[112px] sm:p-3">
        {session ? (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-bold text-[#eef8ff]">
                {sessionDisplayName(session, data)}
              </span>
              <span
                className={cn(
                  'shrink-0 text-[10px] font-semibold',
                  warning === 'none' ? 'text-muted' : warningTimerClass[warning],
                )}
              >
                {remainingLabel}
              </span>
            </div>
            {extras.length > 0 ? (
              <div className="truncate text-[10px] text-muted">
                {extras.map((row) => row.assetNameSnapshot).join(' · ')}
              </div>
            ) : null}
            <div className="space-y-0.5 text-[11px] leading-tight">
              <div className="flex justify-between gap-2 text-muted">
                <span>Gaming</span>
                <span className="font-semibold text-white">{formatMoney(estimate)}</span>
              </div>
              <div className="flex justify-between gap-2 text-muted">
                <span>Snacks</span>
                <span className="font-semibold text-white">{formatMoney(snacks)}</span>
              </div>
              <div className="flex justify-between gap-2 font-extrabold text-white">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>
            <div className="mt-auto space-y-1.5">
              {onAddSnacks ? (
                <Button size="sm" variant="outline" className="w-full px-1 text-xs" onClick={onAddSnacks}>
                  + Add Snacks
                </Button>
              ) : null}
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant={warning === 'none' ? 'outline' : 'gold'}
                  className="flex-1 px-1 text-xs"
                  onClick={() => extendSession(session.id)}
                >
                  +{data.settings.warningExtendMinutes}m
                </Button>
                <Button size="sm" variant="crimson" className="flex-1 px-1 text-xs" onClick={onEnd}>
                  End
                </Button>
              </div>
            </div>
          </>
        ) : status === 'available' ? (
          <Button size="sm" variant="electric" className="mt-auto w-full" onClick={onStart}>
            Start session
          </Button>
        ) : (
          <p className="mt-auto text-xs text-muted">Not available for allocation.</p>
        )}
      </div>
    </article>
  )
}
