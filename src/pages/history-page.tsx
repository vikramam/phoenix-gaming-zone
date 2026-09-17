import { useMemo, useState } from 'react'
import { ArrowLeft, User } from 'lucide-react'
import { DownloadInvoiceButton } from '@/components/download-invoice-button'
import { invoiceFromSession } from '@/lib/invoice'
import { formatMoney } from '@/lib/money'
import { chargeGamingPaise, chargeSnacksPaise } from '@/lib/snacks'
import { completedInRange } from '@/lib/reports'
import { assetsForSession, sessionDisplayName } from '@/lib/store'
import { formatClock, formatDate, formatDurationShort, rangeForPreset } from '@/lib/time'
import type { DatePreset, GamingSession, SessionCharge } from '@/lib/types'
import { useAppData } from '@/lib/use-store'
import { cn } from '@/lib/utils'

const presets: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'custom', label: 'Custom' },
]

export function HistoryPage() {
  const data = useAppData()
  const [preset, setPreset] = useState<DatePreset>('today')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [customer, setCustomer] = useState('')
  const [packageId, setPackageId] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)

  const range = rangeForPreset(preset, from, to)
  const rows = useMemo(() => {
    return completedInRange(data, range.from, range.to).filter((session) => {
      const name = sessionDisplayName(session, data).toLowerCase()
      if (customer && !name.includes(customer.toLowerCase())) return false
      if (packageId && session.pricingPackageId !== packageId) return false
      return true
    })
  }, [data, range.from, range.to, customer, packageId])

  const selected = rows.find((row) => row.id === selectedId) ?? rows[0] ?? null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Session history</h1>
        <p className="text-sm text-muted">Completed sessions stay intact even if prices or assets change.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPreset(item.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              preset === item.id ? 'bg-electric text-white' : 'border border-line bg-[#0b1b2d]/60 text-muted'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {preset === 'custom' ? (
        <div className="flex flex-wrap gap-3">
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-11 min-w-[9rem] flex-1 rounded-lg border border-line bg-bg px-3 sm:flex-none" />
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-11 min-w-[9rem] flex-1 rounded-lg border border-line bg-bg px-3 sm:flex-none" />
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <input
          placeholder="Filter by customer"
          value={customer}
          onChange={(event) => setCustomer(event.target.value)}
          className="h-11 rounded-lg border border-line bg-bg px-3"
        />
        <select
          value={packageId}
          onChange={(event) => setPackageId(event.target.value)}
          className="h-11 rounded-lg border border-line bg-bg px-3"
        >
          <option value="">All packages</option>
          {data.packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center text-muted">
          No completed sessions in this range.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_1fr] lg:items-start">
          <div className={cn('space-y-2', mobileDetail && 'hidden lg:block')}>
            {rows.map((session) => {
              const charge = data.charges.find((row) => row.sessionId === session.id)
              const station = stationNames(session, data)
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(session.id)
                    setMobileDetail(true)
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition',
                    selected?.id === session.id
                      ? 'border-electric bg-electric/18 text-white shadow-[0_0_0_1px_#2388ed,0_10px_24px_rgba(35,136,237,0.18)]'
                      : 'border-line/70 bg-[#10253b]/80 hover:border-electric/45 hover:bg-white/4',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className={cn('truncate text-sm font-bold', selected?.id === session.id ? 'text-white' : 'text-[#eef8ff]')}>
                      {sessionDisplayName(session, data)}
                    </div>
                    <div className={cn('truncate text-[11px]', selected?.id === session.id ? 'text-white/70' : 'text-muted')}>
                      {session.endedAt ? formatDate(session.endedAt) : ''} · {formatClock(session.startedAt)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'max-w-24 truncate rounded-lg px-2 py-0.5 text-[10px] font-bold',
                      selected?.id === session.id ? 'bg-white/15 text-white' : 'bg-white/8 text-muted',
                    )}
                  >
                    {station}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-sm font-extrabold',
                      selected?.id === session.id ? 'text-electric-soft' : 'text-white',
                    )}
                  >
                    {charge ? formatMoney(charge.finalAmountPaise) : '—'}
                  </span>
                </button>
              )
            })}
          </div>

          {selected ? (
            <div className={cn(!mobileDetail && 'hidden lg:block')}>
              <button
                type="button"
                onClick={() => setMobileDetail(false)}
                className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-electric-soft lg:hidden"
              >
                <ArrowLeft className="size-4" /> Back to sessions
              </button>
              <HistoryDetail session={selected} data={data} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function stationNames(session: GamingSession, data: ReturnType<typeof useAppData>) {
  const allocations = assetsForSession(session.id, data)
  const names = allocations
    .filter((row) => data.assetTypes.find((type) => type.id === row.assetTypeId)?.isStation)
    .map((row) => row.assetNameSnapshot)
  return names.join(' + ') || 'No station'
}

function HistoryDetail({
  session,
  data,
}: {
  session: GamingSession
  data: ReturnType<typeof useAppData>
}) {
  const charge = data.charges.find((row) => row.sessionId === session.id)
  const allocations = assetsForSession(session.id, data)
  const stations = stationNames(session, data)
  const extras = allocations.filter(
    (row) => !data.assetTypes.find((type) => type.id === row.assetTypeId)?.isStation,
  )
  const customer = session.customerId
    ? data.customers.find((row) => row.id === session.customerId)
    : null
  const customerSessions = session.customerId
    ? data.sessions.filter((row) => row.customerId === session.customerId && row.status === 'completed')
    : [session]
  const lifetimePaise = customerSessions.reduce((sum, row) => {
    return sum + (data.charges.find((chargeRow) => chargeRow.sessionId === row.id)?.finalAmountPaise ?? 0)
  }, 0)
  const invoice =
    charge && session.endedAt ? invoiceFromSession(data, session, charge, session.endedAt) : null

  return (
    <article className="esports-card overflow-hidden rounded-2xl">
      <div className="border-b border-line/60 bg-[linear-gradient(120deg,rgba(35,136,237,0.22),rgba(9,21,37,0.1))] p-4 sm:p-5">
        <div className="text-[10px] font-bold tracking-[0.18em] text-electric-soft uppercase">
          {session.endedAt ? formatDate(session.endedAt) : ''} · {session.packageNameSnapshot}
        </div>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold">{sessionDisplayName(session, data)}</h2>
            <div className="text-sm text-muted">
              {formatClock(session.startedAt)} → {session.endedAt ? formatClock(session.endedAt) : '—'}
              {charge ? ` · ${formatDurationShort(charge.rawDurationSeconds)} played` : ''}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
              {charge?.paymentStatus === 'pending' ? 'Pending' : 'Collected'}
            </div>
            <div className="text-4xl leading-none font-extrabold text-white">
              {charge ? formatMoney(charge.finalAmountPaise) : '—'}
            </div>
            <div className="text-[11px] text-muted">{paymentLabel(charge)}</div>
            <div className="mt-3 sm:flex sm:justify-end">
              <DownloadInvoiceButton model={invoice} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {charge ? (
        <div className="grid gap-px bg-line/60 sm:grid-cols-3">
          <DetailTile
            label="Played"
            value={formatDurationShort(charge.rawDurationSeconds)}
            sub={`${formatClock(session.startedAt)} → ${session.endedAt ? formatClock(session.endedAt) : '—'}`}
          />
          <DetailTile
            label="Billed"
            value={formatDurationShort(charge.billedDurationSeconds)}
            sub={`min ${charge.minimumDurationMinutes}m, then +${charge.billingIncrementMinutes}m`}
          />
          <DetailTile
            label="Rate"
            value={`${formatMoney(charge.hourlyRatePaise)} / hr`}
            sub={`Computed ${formatMoney(charge.computedAmountPaise)}`}
          />
        </div>
      ) : null}

      {charge ? (
        <div className="grid gap-px bg-line/60 sm:grid-cols-3">
          <DetailTile label="Gaming" value={formatMoney(chargeGamingPaise(charge))} sub="Session charges" />
          <DetailTile label="Snacks" value={formatMoney(chargeSnacksPaise(charge))} sub="Food and drinks" />
          <DetailTile label="Collectable" value={formatMoney(charge.finalAmountPaise)} sub="Gaming + snacks" />
        </div>
      ) : null}

      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <div className="section-title mb-2">Gear used</div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-electric/40 bg-electric/12 px-2.5 py-1 text-xs font-bold text-electric-soft">
              {stations}
            </span>
            {extras.map((item) => (
              <span key={item.id} className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-muted">
                {item.assetNameSnapshot}
              </span>
            ))}
          </div>
        </div>

        {charge?.overrideAmountPaise !== null && charge?.overrideAmountPaise !== undefined ? (
          <div className="rounded-xl border border-gold/35 bg-gold/10 px-3 py-2 text-xs text-gold">
            Override applied · {charge.overrideReason || 'No reason recorded'} · computed{' '}
            {formatMoney(charge.computedAmountPaise)}
          </div>
        ) : null}

        {session.notes ? (
          <div className="rounded-xl border border-line/70 bg-[#0c1d30]/65 px-3 py-2 text-xs text-muted">
            Notes · {session.notes}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <User className="size-3.5 text-electric-soft" />
          {customer ? (
            <>
              {customerSessions.length} visits · {formatMoney(lifetimePaise)} lifetime
              {customer.phone ? ` · ${customer.phone}` : ''}
            </>
          ) : (
            'Walk-in session · no customer profile'
          )}
        </div>
      </div>
    </article>
  )
}

function paymentLabel(charge?: SessionCharge) {
  if (!charge) return 'No charge'
  if (charge.paymentStatus === 'pending') return 'Payment pending'
  if (!charge.paymentMethod) return 'Method not recorded'
  return charge.paymentMethod.toUpperCase()
}

function DetailTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-[#132a43] px-4 py-3">
      <div className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">{label}</div>
      <div className="text-lg font-extrabold text-white">{value}</div>
      <div className="text-[11px] text-muted">{sub}</div>
    </div>
  )
}
