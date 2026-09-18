import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, ChevronDown, Plus, Sparkles } from 'lucide-react'
import { AddSnacksDialog } from '@/components/add-snacks-dialog'
import { EndSessionDialog } from '@/components/end-session-dialog'
import { StartSessionDialog } from '@/components/start-session-dialog'
import { StationCard } from '@/components/station-card'
import { StatusPill } from '@/components/status-pill'
import { formatMoney } from '@/lib/money'
import { reportSummary } from '@/lib/reports'
import {
  activeSessionForAsset,
  assetsForSession,
  occupiedAssetIds,
  sessionDisplayName,
} from '@/lib/store'
import { useAppData } from '@/lib/use-store'
import type { AppData, Asset, AssetType, GamingSession } from '@/lib/types'
import { cn } from '@/lib/utils'

export function FloorPage() {
  const data = useAppData()
  const navigate = useNavigate()
  const [startOpen, setStartOpen] = useState(false)
  const [presetAssetId, setPresetAssetId] = useState<string | null>(null)
  const [ending, setEnding] = useState<GamingSession | null>(null)
  const [snacking, setSnacking] = useState<GamingSession | null>(null)
  const [accessoriesOpen, setAccessoriesOpen] = useState(false)
  const today = useMemo(() => reportSummary(data, 'today'), [data])
  const occupied = occupiedAssetIds(data)
  const liveSessions = data.sessions.filter((session) => session.status === 'active')

  const stationTypes = data.assetTypes
    .filter((type) => type.status === 'active' && type.isStation)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const accessoryGroups = data.assetTypes
    .filter((type) => type.status === 'active' && !type.isStation)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((type) => {
      const units = data.assets
        .filter(
          (asset) =>
            asset.assetTypeId === type.id &&
            !asset.isDeleted &&
            asset.operationalStatus !== 'retired',
        )
        .map((asset) => {
          const session = activeSessionForAsset(asset.id, data)
          const station = session
            ? assetsForSession(session.id, data)
                .filter((row) => data.assetTypes.find((item) => item.id === row.assetTypeId)?.isStation)
                .map((row) => row.assetNameSnapshot)
                .join(', ')
            : ''
          const busy = occupied.has(asset.id)
          const free = asset.operationalStatus === 'available' && !busy
          return { asset, session, station, busy, free }
        })
        .sort((a, b) => Number(b.busy) - Number(a.busy) || a.asset.name.localeCompare(b.asset.name))
      const inUse = units.filter((row) => row.busy).length
      const available = units.filter((row) => row.free).length
      return { type, units, inUse, available }
    })
    .filter((group) => group.units.length > 0)

  return (
    <div className="space-y-5 md:space-y-7">
      <section className="esports-card relative overflow-hidden rounded-2xl md:rounded-3xl">
        <img
          src="/images/hero/arena.webp"
          alt=""
          aria-hidden
          width={1280}
          height={720}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[72%_50%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(175deg,rgba(9,21,37,0.86)_22%,rgba(9,21,37,0.5))] lg:bg-[linear-gradient(100deg,#091525_14%,rgba(9,21,37,0.88)_44%,rgba(9,21,37,0.45)_82%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_35%,rgba(35,136,237,0.22),transparent_36%)]" />
        <div className="blue-grid absolute inset-0 opacity-30" />
        <div className="relative grid items-center gap-3 p-3 sm:min-h-[220px] sm:gap-6 sm:p-7 lg:grid-cols-[1.2fr_1fr] lg:p-9">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-electric/25 bg-electric/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.15em] text-electric-soft uppercase sm:mb-4 sm:px-3">
              <Sparkles className="size-3" /> {data.settings.tagline}
            </div>
            <h1 className="max-w-2xl text-xl leading-[0.95] font-extrabold tracking-[-0.045em] uppercase sm:text-5xl">
              <span className="text-electric-soft">Phoenix</span>
              <br />Gaming Zone
            </h1>
            <p className="mt-2 hidden max-w-lg text-xs text-muted sm:mt-3 sm:block sm:text-sm">
              Your live floor at a glance. Start, extend, and settle every session without slowing down.
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#091727]/60 p-2 backdrop-blur-md sm:p-3">
            <div className="grid grid-cols-2 gap-1 sm:gap-2 lg:grid-cols-4">
              <HeroStat label="Revenue today" value={formatMoney(today.revenue)} />
              <HeroStat label="Live sessions" value={String(today.active)} accent />
              <HeroStat label="Assets free" value={String(today.available)} />
              <HeroStat label="In use" value={String(today.inUse)} />
            </div>
            <button
              type="button"
              onClick={() => {
                setPresetAssetId(null)
                setStartOpen(true)
              }}
              className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-[#142033] shadow-[0_8px_22px_rgba(255,209,65,0.18)] transition hover:-translate-y-0.5 sm:h-11"
            >
              <Plus className="size-4" /> New session
            </button>
          </div>
        </div>
      </section>

      {liveSessions.length > 0 ? (
        <button
          type="button"
          onClick={() => navigate('/active', { viewTransition: true })}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-crimson/35 bg-crimson/10 px-3 py-3 text-left md:hidden"
        >
          <div>
            <div className="text-sm font-extrabold">{liveSessions.length} live sessions</div>
            <div className="text-[11px] text-muted">Tap to view timers and end a session</div>
          </div>
          <span className="text-xs font-bold text-electric-soft">Active</span>
        </button>
      ) : null}

      {stationTypes.map((type) => {
        const stations = data.assets.filter(
          (asset) =>
            asset.assetTypeId === type.id &&
            !asset.isDeleted &&
            asset.operationalStatus !== 'retired',
        )
        if (stations.length === 0) return null
        return (
          <section key={type.id} className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <div className="section-title">{type.name} Floor</div>
              <span className="text-xs text-muted">{stations.length} stations</span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
              {stations.map((asset) => {
                const session = activeSessionForAsset(asset.id, data)
                return (
                  <StationCard
                    key={asset.id}
                    data={data}
                    asset={asset}
                    session={session}
                    onStart={() => {
                      setPresetAssetId(asset.id)
                      setStartOpen(true)
                    }}
                    onEnd={() => session && setEnding(session)}
                    onAddSnacks={() => session && setSnacking(session)}
                  />
                )
              })}
            </div>
          </section>
        )
      })}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="section-title">Accessories</div>
          {accessoryGroups.length > 0 ? (
            <button
              type="button"
              onClick={() => setAccessoriesOpen((value) => !value)}
              className="flex items-center gap-1 text-xs font-bold text-muted"
            >
              {accessoriesOpen ? 'Collapse all' : 'Expand all'}
              <ChevronDown className={cn('size-3 transition', accessoriesOpen && 'rotate-180')} />
            </button>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted">
              All equipment <ArrowUpRight className="size-3" />
            </span>
          )}
        </div>
        {accessoryGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">
            No accessories on the floor.
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {accessoryGroups.map((group) => (
              <AccessoryGroupCard
                key={group.type.id}
                data={data}
                group={group}
                open={accessoriesOpen}
                onToggle={() => setAccessoriesOpen((value) => !value)}
              />
            ))}
          </div>
        )}
      </section>

      <StartSessionDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        data={data}
        presetAssetId={presetAssetId}
      />
      <EndSessionDialog open={Boolean(ending)} onOpenChange={(open) => !open && setEnding(null)} data={data} session={ending} />
      <AddSnacksDialog open={Boolean(snacking)} onOpenChange={(open) => !open && setSnacking(null)} data={data} session={snacking} />
    </div>
  )
}

function HeroStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="px-2 py-3 text-center">
      <div className={accent ? 'text-2xl font-extrabold text-electric-soft' : 'text-2xl font-extrabold text-white'}>{value}</div>
      <div className="mt-1 text-[9px] font-bold tracking-wider text-muted uppercase">{label}</div>
    </div>
  )
}

type AccessoryUnit = {
  asset: Asset
  session: GamingSession | null
  station: string
  busy: boolean
  free: boolean
}

function AccessoryGroupCard({
  data,
  group,
  open,
  onToggle,
}: {
  data: AppData
  group: { type: AssetType; units: AccessoryUnit[]; inUse: number; available: number }
  open: boolean
  onToggle: () => void
}) {
  const held = group.units.length - group.inUse - group.available

  return (
    <div className="esports-card rounded-2xl p-2.5 sm:p-3.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 text-left"
      >
        <div className="product-well flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:size-16">
          {group.type.imagePath ? (
            <img
              src={group.type.imagePath}
              alt={group.type.name}
              width={128}
              height={128}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-bold text-[#edf7ff] sm:text-base">{group.type.name}</div>
            <span className="text-xs text-muted">× {group.units.length}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {group.inUse > 0 ? <StatusPill status="in-use">{`${group.inUse} in use`}</StatusPill> : null}
            {group.available > 0 ? (
              <StatusPill status="available">{`${group.available} available`}</StatusPill>
            ) : null}
            {held > 0 ? <StatusPill status="maintenance">{`${held} held`}</StatusPill> : null}
          </div>
        </div>
        <ChevronDown className={cn('size-4 shrink-0 text-muted transition', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="mt-3 space-y-1.5">
          {group.units.map((row) => {
            const pill = row.busy
              ? { status: 'in-use' as const, label: 'In use' }
              : row.free
                ? { status: 'available' as const, label: 'Available' }
                : { status: row.asset.operationalStatus, label: row.asset.operationalStatus }
            return (
              <div
                key={row.asset.id}
                className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/4 px-2.5 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{row.asset.name}</div>
                  {row.busy ? (
                    <div className="truncate text-[11px] text-muted">
                      {row.station ? `on ${row.station}` : 'In session'}
                      {row.session ? ` · ${sessionDisplayName(row.session, data)}` : ''}
                    </div>
                  ) : null}
                </div>
                <StatusPill status={pill.status}>{pill.label}</StatusPill>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
