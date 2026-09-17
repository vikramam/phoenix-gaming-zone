import { useMemo, useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import { chargeGamingPaise, chargeSnacksPaise } from '@/lib/snacks'
import { reportSummary } from '@/lib/reports'
import { assetsForSession, sessionDisplayName } from '@/lib/store'
import { formatClock, formatDate, formatDurationShort } from '@/lib/time'
import type { AppData, DatePreset, GamingSession } from '@/lib/types'
import { useAppData } from '@/lib/use-store'

const PAGE_SIZE = 15

const presets: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'custom', label: 'Custom' },
]

export function ReportsPage() {
  const data = useAppData()
  const [preset, setPreset] = useState<DatePreset>('today')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)
  const report = useMemo(() => reportSummary(data, preset, from, to), [data, preset, from, to])
  const snackWindows = useMemo(
    () => ({
      today: reportSummary(data, 'today').snacksRevenue,
      week: reportSummary(data, 'week').snacksRevenue,
      month: reportSummary(data, 'month').snacksRevenue,
    }),
    [data],
  )
  const usageMax = Math.max(...report.usageByType.map((row) => row.seconds), 1)
  const totalPages = Math.max(1, Math.ceil(report.sessions.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pageStart = currentPage * PAGE_SIZE
  const pageRows = report.sessions.slice(pageStart, pageStart + PAGE_SIZE)
  const showingFrom = report.sessions.length === 0 ? 0 : pageStart + 1
  const showingTo = pageStart + pageRows.length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">{report.range.label}</h1>
          <p className="text-sm text-muted">Export downloads the filtered range currently on screen.</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" onClick={() => downloadCsv(data, report)}>
            <FileSpreadsheet className="size-4" /> CSV
          </Button>
          <Button onClick={() => window.print()}>
            <FileText className="size-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        {presets.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setPreset(item.id)
              setPage(0)
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              preset === item.id ? 'bg-electric text-white' : 'border border-line bg-[#0b1b2d]/60 text-muted'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {preset === 'custom' ? (
        <div className="flex flex-wrap gap-3 print:hidden">
          <input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(0) }} className="h-11 min-w-[9rem] flex-1 rounded-lg border border-line bg-bg px-3 sm:flex-none" />
          <input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(0) }} className="h-11 min-w-[9rem] flex-1 rounded-lg border border-line bg-bg px-3 sm:flex-none" />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Gaming revenue" value={formatMoney(report.gamingRevenue)} />
        <Kpi label="Snacks revenue" value={formatMoney(report.snacksRevenue)} />
        <Kpi label="Total revenue" value={formatMoney(report.revenue)} />
        <Kpi label="Sessions" value={String(report.completed)} />
      </div>

      <section className="esports-card rounded-2xl p-5">
        <h2 className="mb-1 text-base font-extrabold tracking-wide uppercase">Snacks revenue</h2>
        <p className="mb-4 text-sm text-muted">One snacks total — Coke and Chips are not reported separately.</p>
        <div className="grid grid-cols-3 gap-3">
          <Kpi label="Today" value={formatMoney(snackWindows.today)} />
          <Kpi label="This week" value={formatMoney(snackWindows.week)} />
          <Kpi label="This month" value={formatMoney(snackWindows.month)} />
        </div>
      </section>

      <section className="esports-card overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 px-4 py-3">
          <h2 className="text-base font-extrabold tracking-wide uppercase">Sessions in this range</h2>
          <span className="text-sm text-muted">CSV exports every session in this range</span>
        </div>
        {report.sessions.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">No completed sessions in this range.</p>
        ) : (
          <div className="scroll-slim overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/5 text-xs font-bold tracking-[0.12em] text-muted uppercase">
                <tr>
                  {['When', 'Customer', 'Station', 'Package', 'Played', 'Gaming', 'Snacks', 'Total', 'Method'].map((head) => (
                    <th key={head} className="px-4 py-3">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((session) => {
                  const charge = data.charges.find((row) => row.sessionId === session.id)
                  return (
                    <tr key={session.id} className="border-t border-line/60">
                      <td className="whitespace-nowrap px-4 py-3">
                        {session.endedAt ? `${formatDate(session.endedAt)} · ${formatClock(session.startedAt)}` : '—'}
                      </td>
                      <td className="px-4 py-3">{sessionDisplayName(session, data)}</td>
                      <td className="px-4 py-3">{stationLabel(session, data)}</td>
                      <td className="px-4 py-3">{session.packageNameSnapshot}</td>
                      <td className="px-4 py-3">
                        {charge ? formatDurationShort(charge.rawDurationSeconds) : '—'}
                      </td>
                      <td className="px-4 py-3">{charge ? formatMoney(chargeGamingPaise(charge)) : '—'}</td>
                      <td className="px-4 py-3">{charge ? formatMoney(chargeSnacksPaise(charge)) : '—'}</td>
                      <td className="px-4 py-3 font-extrabold text-white">
                        {charge ? formatMoney(charge.finalAmountPaise) : '—'}
                      </td>
                      <td className="px-4 py-3 uppercase">{charge?.paymentMethod ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {report.sessions.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 px-4 py-3 print:hidden">
            <p className="text-sm text-muted">
              Showing {showingFrom}–{showingTo} of {report.sessions.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage <= 0}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm font-semibold">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="esports-card rounded-2xl p-5">
          <h2 className="mb-4 text-base font-extrabold tracking-wide uppercase">By package</h2>
          {report.byPackage.length === 0 ? (
            <p className="text-sm text-muted">No completed sessions yet.</p>
          ) : (
            report.byPackage.map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between gap-3 border-b border-line/50 py-2.5 last:border-b-0"
              >
                <div>
                  <div className="text-sm font-bold sm:text-base">{row.name}</div>
                  <div className="text-sm text-muted">
                    {row.sessions} {row.sessions === 1 ? 'session' : 'sessions'}
                  </div>
                </div>
                <div className="text-lg font-extrabold">{formatMoney(row.revenue)}</div>
              </div>
            ))
          )}
        </section>

        <section className="esports-card rounded-2xl p-5">
          <h2 className="mb-1 text-base font-extrabold tracking-wide uppercase">Asset usage</h2>
          <p className="mb-4 text-sm text-muted">Grouped by type, then each physical unit.</p>
          {report.usageByType.length === 0 ? (
            <p className="text-sm text-muted">Usage appears after sessions are completed.</p>
          ) : (
            <div className="space-y-5">
              {report.usageByType.map((group) => (
                <div key={group.type.id}>
                  <div className="mb-1.5 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <div className="text-base font-extrabold">{group.type.name}</div>
                      <div className="text-sm text-muted">
                        {group.unitCount} {group.unitCount === 1 ? 'unit' : 'units'}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {group.sessions} {group.sessions === 1 ? 'session' : 'sessions'} · {group.hoursLabel} played ·{' '}
                      {Math.round(group.utilization)}% utilised
                    </div>
                  </div>
                  <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full bg-electric"
                      style={{ width: `${Math.min(100, Math.max(8, (group.seconds / usageMax) * 100))}%` }}
                    />
                  </div>
                  {group.units.map((row) => (
                    <div key={row.asset.id} className="flex justify-between py-1 text-sm">
                      <span>{row.asset.name}</span>
                      <span className="font-semibold text-muted">
                        {row.sessions} {row.sessions === 1 ? 'session' : 'sessions'} · {row.hoursLabel} played
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="esports-card rounded-2xl px-4 py-4">
      <div className="text-xs font-bold tracking-[0.16em] text-muted uppercase">{label}</div>
      <div className="mt-1 text-3xl font-extrabold text-white">{value}</div>
    </div>
  )
}

function stationLabel(session: GamingSession, data: AppData) {
  const names = assetsForSession(session.id, data)
    .filter((row) => data.assetTypes.find((type) => type.id === row.assetTypeId)?.isStation)
    .map((row) => row.assetNameSnapshot)
  return names.join(' + ') || '—'
}

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

function downloadCsv(data: AppData, report: ReturnType<typeof reportSummary>) {
  const sessionLines = [
    ['When', 'Customer', 'Station', 'Package', 'Played', 'Gaming', 'Snacks', 'Total', 'Method', 'Payment'].map(csvCell).join(','),
    ...report.sessions.map((session) => {
      const charge = data.charges.find((row) => row.sessionId === session.id)
      const when = session.endedAt
        ? `${formatDate(session.endedAt)} ${formatClock(session.startedAt)}`
        : ''
      return [
        when,
        sessionDisplayName(session, data),
        stationLabel(session, data),
        session.packageNameSnapshot,
        charge ? formatDurationShort(charge.rawDurationSeconds) : '',
        charge ? formatMoney(chargeGamingPaise(charge)) : '',
        charge ? formatMoney(chargeSnacksPaise(charge)) : '',
        charge ? formatMoney(charge.finalAmountPaise) : '',
        charge?.paymentMethod ?? '',
        charge?.paymentStatus ?? '',
      ]
        .map((cell) => csvCell(String(cell)))
        .join(',')
    }),
  ]

  const usageLines = [
    '',
    ['Asset type', 'Unit', 'Sessions', 'Hours', 'Utilization %'].map(csvCell).join(','),
    ...report.usageByType.flatMap((group) =>
      group.units.map((row) =>
        [
          group.type.name,
          row.asset.name,
          String(row.sessions),
          row.hoursLabel,
          String(Math.round(row.utilization)),
        ]
          .map((cell) => csvCell(cell))
          .join(','),
      ),
    ),
  ]

  const blob = new Blob([[...sessionLines, ...usageLines].join('\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = report.range.label.toLowerCase().replaceAll(' ', '-')
  link.href = url
  link.download = `phoenix-report-${stamp}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
