import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Plus, User } from 'lucide-react'
import { Dialog, DialogContent } from './ui/dialog'
import { Button } from './ui/button'
import { FieldLabel, Input } from './ui/input'
import { formatMoney } from '@/lib/money'
import {
  activeSessionForCustomer,
  allocatableOfType,
  canFulfillPackage,
  occupiedAssetIds,
  startSession,
} from '@/lib/store'
import type { AppData, Customer } from '@/lib/types'
import { cn, createId } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: AppData
  presetAssetId?: string | null
}

export function StartSessionDialog({ open, onOpenChange, data, presetAssetId }: Props) {
  const [name, setName] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const [packageId, setPackageId] = useState<string | null>(null)
  const [assetIds, setAssetIds] = useState<string[]>([])
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const occupied = occupiedAssetIds(data)
  const liveCustomers = useMemo(
    () => data.customers.filter((customer) => !customer.isDeleted),
    [data.customers],
  )
  const query = name.trim().toLowerCase()
  const matches = useMemo(() => {
    const sorted = [...liveCustomers].sort((a, b) => a.name.localeCompare(b.name))
    if (!query) return sorted.slice(0, 8)
    return sorted.filter((customer) => customer.name.toLowerCase().includes(query)).slice(0, 8)
  }, [liveCustomers, query])
  const exactMatch = liveCustomers.find((customer) => customer.name.toLowerCase() === query)
  const busyIds = new Set(
    data.sessions
      .filter((session) => session.status === 'active' && session.customerId)
      .map((session) => session.customerId as string),
  )
  const selectedBusy = exactMatch ? Boolean(activeSessionForCustomer(exactMatch.id, data)) : false

  const availablePackages = data.packages
    .filter((pkg) => pkg.status === 'active')
    .map((pkg) => ({
      pkg,
      picks: canFulfillPackage(pkg, occupied, presetAssetId ? [presetAssetId] : [], data),
    }))

  useEffect(() => {
    if (!open) return
    const first = availablePackages.find((row) => row.picks)
    if (first) {
      setPackageId(first.pkg.id)
      setAssetIds(first.picks ?? [])
    }
  }, [open, presetAssetId])

  function selectPackage(id: string) {
    const found = availablePackages.find((row) => row.pkg.id === id)
    setPackageId(id)
    setAssetIds(found?.picks ?? [])
    setError('')
  }

  function toggleAsset(typeId: string, assetId: string, quantity: number) {
    const ofType = data.assets.filter((asset) => asset.assetTypeId === typeId).map((asset) => asset.id)
    const others = assetIds.filter((id) => !ofType.includes(id))
    const current = assetIds.filter((id) => ofType.includes(id))
    const next = current.includes(assetId)
      ? current.filter((id) => id !== assetId)
      : [...current, assetId].slice(-quantity)
    setAssetIds([...others, ...next])
  }

  function submit() {
    if (selectedBusy) {
      setError(`${exactMatch?.name} already has an active session. End it before starting another.`)
      return
    }
    if (!packageId) {
      setError('Pick a setup first.')
      return
    }
    setPending(true)
    try {
      startSession({
        clientRequestId: createId(),
        packageId,
        assetIds,
        customerName: name,
      })
      setName('')
      setPackageId(null)
      setAssetIds([])
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : (err as { message?: string }).message || 'Could not start.')
    } finally {
      setPending(false)
    }
  }

  const selected = data.packages.find((pkg) => pkg.id === packageId)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setError('')
          setPackageId(null)
          setAssetIds([])
          setName('')
          setListOpen(false)
        }
      }}
    >
      <DialogContent
        title="Start session"
        dense
        className="w-[min(40rem,calc(100vw-1rem))]"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={pending || selectedBusy} onClick={submit}>
              Start session
            </Button>
          </div>
        }
      >
        <FieldLabel>Customer</FieldLabel>
        <CustomerPicker
          name={name}
          open={listOpen}
          customers={matches}
          busyIds={busyIds}
          exactMatch={Boolean(exactMatch)}
          selectedBusy={selectedBusy}
          hasSavedCustomers={liveCustomers.length > 0}
          onOpenChange={setListOpen}
          onChange={setName}
        />

        <p className="mt-4 mb-2 text-[11px] font-bold tracking-[0.16em] text-muted uppercase">Setup</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {availablePackages.map(({ pkg, picks }) => {
            const disabled = !picks
            const active = packageId === pkg.id
            return (
              <button
                key={pkg.id}
                type="button"
                disabled={disabled}
                onClick={() => selectPackage(pkg.id)}
                className={cn(
                  'grid gap-1 overflow-hidden rounded-xl border bg-[#0d2034] p-1.5 text-left',
                  active ? 'border-electric shadow-[0_0_0_1px_#2388ed]' : 'border-line hover:border-electric/45',
                  disabled && 'opacity-40',
                )}
              >
                <span className="product-well flex h-[72px] items-center justify-center overflow-hidden rounded-lg sm:h-[88px]">
                  {pkg.imagePath ? (
                    <img
                      src={pkg.imagePath}
                      alt=""
                      width={160}
                      height={160}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain p-1.5"
                    />
                  ) : (
                    <span className="text-black/40">{pkg.name}</span>
                  )}
                </span>
                <span className="line-clamp-2 text-xs font-extrabold leading-tight">{pkg.name}</span>
                {disabled ? (
                  <span className="text-[11px] font-semibold text-crimson">No free gear</span>
                ) : (
                  <span className="text-[11px] font-semibold text-muted">
                    {formatMoney(pkg.hourlyRatePaise)} / hr
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {selected ? (
          <div className="mt-4 space-y-2.5">
            {selected.items.map((item) => {
              const type = data.assetTypes.find((row) => row.id === item.assetTypeId)
              const options = allocatableOfType(item.assetTypeId, occupied, data)
              const selectedOfType = assetIds.filter((id) =>
                data.assets.some((asset) => asset.id === id && asset.assetTypeId === item.assetTypeId),
              )
              return (
                <div key={item.assetTypeId}>
                  <p className="mb-2 text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
                    Gear · {type?.name ?? 'Asset'} · pick {item.quantity}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {options.map((asset) => {
                      const on = selectedOfType.includes(asset.id)
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => toggleAsset(item.assetTypeId, asset.id, item.quantity)}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-bold',
                            on
                              ? 'border-electric bg-electric text-white'
                              : 'border-line bg-[#0b1b2d] text-muted',
                          )}
                        >
                          {asset.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-crimson">{error}</p> : null}
      </DialogContent>
    </Dialog>
  )
}

function CustomerPicker({
  name,
  open,
  customers,
  busyIds,
  exactMatch,
  selectedBusy,
  hasSavedCustomers,
  onOpenChange,
  onChange,
}: {
  name: string
  open: boolean
  customers: Customer[]
  busyIds: Set<string>
  exactMatch: boolean
  selectedBusy: boolean
  hasSavedCustomers: boolean
  onOpenChange: (open: boolean) => void
  onChange: (name: string) => void
}) {
  const query = name.trim()
  const showCreate = query.length > 0 && !exactMatch

  return (
    <div className="relative">
      <div className="relative">
        <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={name}
          autoComplete="off"
          placeholder={hasSavedCustomers ? 'Search or type a new name' : 'Name — or leave empty for walk-in'}
          className="h-10 pr-10 pl-10"
          onChange={(event) => {
            onChange(event.target.value)
            onOpenChange(true)
          }}
          onFocus={() => onOpenChange(true)}
          onBlur={() => window.setTimeout(() => onOpenChange(false), 120)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onOpenChange(false)
          }}
        />
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
      </div>
      <p className={cn('mt-1.5 text-xs', selectedBusy ? 'text-crimson' : 'text-muted')}>
        {!query
          ? 'Walk-in — no customer profile will be saved. Multiple walk-ins can play at once.'
          : selectedBusy
            ? 'This customer already has an active session. End it first.'
            : exactMatch
              ? 'Existing customer will be reused.'
              : 'New customer will be created.'}
      </p>
      {open ? (
        <div className="scroll-slim absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-[#10253b] shadow-[0_16px_40px_rgba(0,8,20,0.45)]">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-white/6"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange('')
              onOpenChange(false)
            }}
          >
            <span className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-muted uppercase">
              Walk-in
            </span>
            <span className="text-muted">Leave blank — no profile saved</span>
          </button>
          {customers.map((customer) => {
            const busy = busyIds.has(customer.id)
            return (
              <button
                key={customer.id}
                type="button"
                disabled={busy}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left',
                  busy ? 'cursor-not-allowed opacity-55' : 'hover:bg-white/6',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (busy) return
                  onChange(customer.name)
                  onOpenChange(false)
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-white">{customer.name}</span>
                  <span className="block truncate text-xs text-muted">{customer.phone || 'No phone'}</span>
                </span>
                {busy ? (
                  <span className="text-[10px] font-bold tracking-wider text-crimson uppercase">In session</span>
                ) : (
                  <span className="text-[10px] font-bold tracking-wider text-electric-soft uppercase">Select</span>
                )}
              </button>
            )
          })}
          {showCreate ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 border-t border-line/70 px-3 py-2.5 text-left text-sm hover:bg-white/6"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onOpenChange(false)}
            >
              <Plus className="size-4 text-electric-soft" />
              <span>
                Create <span className="font-bold text-white">“{query}”</span>
              </span>
            </button>
          ) : null}
          {!showCreate && customers.length === 0 && hasSavedCustomers ? (
            <p className="px-3 py-2.5 text-sm text-muted">No names match that search.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
