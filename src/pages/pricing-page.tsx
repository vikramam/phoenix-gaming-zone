import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FieldLabel, Input } from '@/components/ui/input'
import { formatMoney, paiseToRupees, rupeesToPaise } from '@/lib/money'
import { savePackage } from '@/lib/store'
import type { PackageItem, PackageStatus, PricingPackage } from '@/lib/types'
import { useAppData } from '@/lib/use-store'

const images = [
  { label: '1 PS5', path: '/images/packages/ps5.webp' },
  { label: 'PS5 + extra controller', path: '/images/packages/ps5-extra-controller.webp' },
  { label: 'PS5 + 2 extra controllers', path: '/images/packages/ps5-2-extra-controllers.webp' },
  { label: 'PS5 + 3 extra controllers', path: '/images/packages/ps5-3-extra-controllers.webp' },
  { label: 'PS5 + racing wheel', path: '/images/packages/ps5-racing-wheel.webp' },
  { label: 'Racing wheel + VR', path: '/images/packages/ps5-racing-wheel-vr2.webp' },
  { label: 'PS5 + VR', path: '/images/packages/ps5-vr2.webp' },
]

type Draft = {
  id?: string
  name: string
  rate: string
  status: PackageStatus
  imagePath: string | null
  items: PackageItem[]
}

const emptyDraft = (typeId: string): Draft => ({
  name: '',
  rate: '100',
  status: 'active',
  imagePath: images[0].path,
  items: typeId ? [{ assetTypeId: typeId, quantity: 1 }] : [],
})

export function PricingPage() {
  const data = useAppData()
  const defaultType = data.assetTypes[0]?.id ?? ''
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(defaultType))
  const [typeId, setTypeId] = useState(defaultType)
  const [qty, setQty] = useState(1)
  const [error, setError] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)
  const [quickRates, setQuickRates] = useState<Record<string, string>>({})

  const editing = Boolean(draft.id)

  function loadPackage(pkg: PricingPackage) {
    setDraft({
      id: pkg.id,
      name: pkg.name,
      rate: String(paiseToRupees(pkg.hourlyRatePaise)),
      status: pkg.status,
      imagePath: pkg.imagePath,
      items: pkg.items.map((item) => ({ ...item })),
    })
    setError('')
    setSavedId(null)
  }

  function resetDraft() {
    setDraft(emptyDraft(defaultType))
    setError('')
    setSavedId(null)
  }

  function saveDraft() {
    const rateNumber = Number(draft.rate)
    if (!draft.name.trim()) {
      setError('Give the package a name, for example “1 PS5”.')
      return
    }
    if (!Number.isFinite(rateNumber) || rateNumber <= 0) {
      setError('Enter an hourly rate in rupees, for example 150.')
      return
    }
    if (draft.items.length === 0) {
      setError('Add the equipment this price needs — at least one PS5.')
      return
    }
    try {
      savePackage({
        id: draft.id,
        name: draft.name,
        hourlyRatePaise: rupeesToPaise(rateNumber),
        status: draft.status,
        imagePath: draft.imagePath,
        items: draft.items,
      })
      setError('')
      setSavedId(draft.id ?? 'new')
      if (!draft.id) resetDraft()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save package.')
    }
  }

  function saveQuickRate(pkg: PricingPackage) {
    const typed = quickRates[pkg.id] ?? String(paiseToRupees(pkg.hourlyRatePaise))
    const rateNumber = Number(typed)
    if (!Number.isFinite(rateNumber) || rateNumber <= 0) {
      setError('Hourly rate must be a number greater than 0.')
      return
    }
    savePackage({
      ...pkg,
      hourlyRatePaise: rupeesToPaise(rateNumber),
    })
    setQuickRates((current) => {
      const next = { ...current }
      delete next[pkg.id]
      return next
    })
    setError('')
    setSavedId(pkg.id)
  }

  return (
    <div>
      <h1 className="page-title">Pricing</h1>
      <p className="mb-2 text-sm text-muted">
        These are billable setups, not individual machines. Change a rate whenever you want — completed
        sessions keep the amount they were charged that day.
      </p>
      <p className="mb-5 text-sm text-electric-soft">
        Intro now: 1 PS5 ₹100/hr · extra controller ₹150 · VR2 ₹150 · racing wheel ₹150 · wheel + VR ₹200.
        Later you can raise those, or add “PS5 + Racing Wheel ₹200” as a new package.
      </p>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <section className="space-y-3">
          {data.packages.map((pkg) => {
            const rateValue = quickRates[pkg.id] ?? String(paiseToRupees(pkg.hourlyRatePaise))
            const dirty = rateValue !== String(paiseToRupees(pkg.hourlyRatePaise))
            return (
              <article
                key={pkg.id}
                className={`esports-card rounded-2xl p-3 ${
                  draft.id === pkg.id ? 'border-electric' : 'border-line'
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white sm:size-20">
                    {pkg.imagePath ? (
                      <img
                        src={pkg.imagePath}
                        alt=""
                        width={160}
                        height={160}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-extrabold">{pkg.name}</div>
                      <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                        {pkg.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted">
                      {pkg.items
                        .map((item) => {
                          const type = data.assetTypes.find((row) => row.id === item.assetTypeId)
                          return `${item.quantity}× ${type?.name ?? 'asset'}`
                        })
                        .join(' · ')}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted">₹</span>
                  <Input
                    inputMode="decimal"
                    value={rateValue}
                    onChange={(event) =>
                      setQuickRates((current) => ({ ...current, [pkg.id]: event.target.value }))
                    }
                    className="h-10 w-20"
                  />
                  <span className="text-sm text-muted">/ hour</span>
                  <Button size="sm" disabled={!dirty} onClick={() => saveQuickRate(pkg)}>
                    Update rate
                  </Button>
                  {savedId === pkg.id && !dirty ? (
                    <span className="text-xs text-gold">Saved</span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => loadPackage(pkg)}>
                    Edit package
                  </Button>
                  <select
                    value={pkg.status}
                    onChange={(event) =>
                      savePackage({
                        ...pkg,
                        status: event.target.value as PackageStatus,
                      })
                    }
                    className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-bg px-2 text-sm sm:flex-none"
                  >
                    <option value="active">Active — offered at start</option>
                    <option value="disabled">Disabled — hidden for now</option>
                    <option value="retired">Retired — keep history only</option>
                  </select>
                </div>
              </article>
            )
          })}
        </section>

        <section className="esports-card rounded-2xl p-4">
          <h2 className="mb-1 font-extrabold">{editing ? 'Edit package' : 'Add a new package'}</h2>
          <p className="mb-4 text-xs text-muted">
            Example later: name “PS5 + Racing Wheel”, rate 200, require 1 PS5 + 1 Racing Wheel.
          </p>
          <FieldLabel>Name</FieldLabel>
          <Input
            className="mb-3"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="1 PS5 + Extra Controller"
          />
          <FieldLabel>Hourly rate (₹)</FieldLabel>
          <Input
            className="mb-3"
            inputMode="decimal"
            value={draft.rate}
            onChange={(event) => setDraft({ ...draft, rate: event.target.value })}
          />
          <FieldLabel>Status</FieldLabel>
          <select
            value={draft.status}
            onChange={(event) => setDraft({ ...draft, status: event.target.value as PackageStatus })}
            className="mb-3 h-11 w-full rounded-lg border border-line bg-bg px-3"
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="retired">Retired</option>
          </select>
          <FieldLabel>Card image</FieldLabel>
          <select
            value={draft.imagePath ?? ''}
            onChange={(event) => setDraft({ ...draft, imagePath: event.target.value || null })}
            className="mb-3 h-11 w-full rounded-lg border border-line bg-bg px-3"
          >
            {images.map((image) => (
              <option key={image.path} value={image.path}>
                {image.label}
              </option>
            ))}
          </select>
          <FieldLabel>Required equipment</FieldLabel>
          <div className="mb-3 flex gap-2">
            <select
              value={typeId}
              onChange={(event) => setTypeId(event.target.value)}
              className="h-11 flex-1 rounded-lg border border-line bg-bg px-3"
            >
              {data.assetTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(event) => setQty(Number(event.target.value))}
              className="w-20"
            />
            <Button
              variant="outline"
              onClick={() => {
                if (!typeId) return
                setDraft((current) => {
                  const existing = current.items.find((row) => row.assetTypeId === typeId)
                  const items = existing
                    ? current.items.map((row) =>
                        row.assetTypeId === typeId ? { ...row, quantity: qty } : row,
                      )
                    : [...current.items, { assetTypeId: typeId, quantity: qty }]
                  return { ...current, items }
                })
              }}
            >
              Add
            </Button>
          </div>
          <div className="mb-3 space-y-1">
            {draft.items.length === 0 ? (
              <p className="text-sm text-muted">No equipment listed yet.</p>
            ) : (
              draft.items.map((item) => (
                <div key={item.assetTypeId} className="flex items-center justify-between text-sm">
                  <span>
                    {item.quantity}× {data.assetTypes.find((row) => row.id === item.assetTypeId)?.name}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-crimson"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        items: current.items.filter((row) => row.assetTypeId !== item.assetTypeId),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
          {error ? <p className="mb-3 text-sm text-crimson">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveDraft}>{editing ? 'Save changes' : 'Create package'}</Button>
            {editing ? (
              <Button variant="ghost" onClick={resetDraft}>
                New package
              </Button>
            ) : null}
          </div>
          {savedId && editing ? (
            <p className="mt-3 text-xs text-gold">
              Saved {formatMoney(rupeesToPaise(Number(draft.rate) || 0))} / hr. New sessions use this rate.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  )
}
