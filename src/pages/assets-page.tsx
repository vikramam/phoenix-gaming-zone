import { useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { StatusPill } from '@/components/status-pill'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { FieldLabel, Input } from '@/components/ui/input'
import { occupiedAssetIds, saveAsset, saveAssetType, setAssetDeleted } from '@/lib/store'
import type { Asset, AssetType, OperationalStatus } from '@/lib/types'
import { useAppData } from '@/lib/use-store'
import { cn } from '@/lib/utils'

export function AssetsPage() {
  const data = useAppData()
  const occupied = occupiedAssetIds(data)
  const [typeName, setTypeName] = useState('')
  const [isStation, setIsStation] = useState(true)
  const [assetTypeId, setAssetTypeId] = useState(data.assetTypes[0]?.id ?? '')
  const [assetName, setAssetName] = useState('')
  const [assetCode, setAssetCode] = useState('')
  const [status, setStatus] = useState<OperationalStatus>('available')
  const [error, setError] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Asset | null>(null)
  const [pendingRestore, setPendingRestore] = useState<Asset | null>(null)

  const deletedCount = data.assets.filter((asset) => asset.isDeleted).length
  const visibleAssets = data.assets.filter((asset) => asset.isDeleted === showDeleted)
  const types = [...data.assetTypes].sort((a, b) => a.sortOrder - b.sortOrder)

  function updateStatus(assetId: string, operationalStatus: OperationalStatus) {
    const asset = data.assets.find((row) => row.id === assetId)
    if (!asset) return
    try {
      saveAsset({
        id: asset.id,
        assetTypeId: asset.assetTypeId,
        name: asset.name,
        code: asset.code,
        description: asset.description,
        operationalStatus,
      })
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : (err as { message?: string }).message || 'Blocked')
    }
  }

  return (
    <div>
      <h1 className="page-title">Assets</h1>
      <p className="mb-5 text-sm text-muted">
        Add types and units from here. Deleting a unit hides it from the floor — session history
        still names it. Restore deleted units any time.
      </p>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {types.map((type) => {
          const units = data.assets.filter((asset) => asset.assetTypeId === type.id && !asset.isDeleted)
          const inUse = units.filter((asset) => occupied.has(asset.id)).length
          return (
            <article key={type.id} className="esports-card overflow-hidden rounded-2xl">
              <AssetMockup src={type.imagePath} alt={type.name} className="h-36 sm:h-40" />
              <div className="flex items-start justify-between gap-2 p-3">
                <div className="min-w-0">
                  <div className="truncate font-extrabold">{type.name}</div>
                  <div className="text-[11px] text-muted">
                    {units.length} {units.length === 1 ? 'unit' : 'units'}
                    {inUse ? ` · ${inUse} in use` : ''}
                  </div>
                </div>
                <StatusPill status={type.isStation ? 'live' : 'available'}>
                  {type.isStation ? 'Station' : 'Accessory'}
                </StatusPill>
              </div>
            </article>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="esports-card rounded-2xl p-4">
          <h2 className="mb-3 font-extrabold">New asset type</h2>
          <FieldLabel>Name</FieldLabel>
          <Input value={typeName} onChange={(event) => setTypeName(event.target.value)} placeholder="Xbox" />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isStation} onChange={(event) => setIsStation(event.target.checked)} />
            Show as a floor station
          </label>
          <Button
            className="mt-4"
            onClick={() => {
              try {
                saveAssetType({ name: typeName, isStation, imagePath: null })
                setTypeName('')
                setError('')
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not save type.')
              }
            }}
          >
            Add type
          </Button>
        </section>

        <section className="esports-card rounded-2xl p-4">
          <h2 className="mb-3 font-extrabold">New asset</h2>
          <FieldLabel>Type</FieldLabel>
          <select
            value={assetTypeId}
            onChange={(event) => setAssetTypeId(event.target.value)}
            className="mb-3 h-11 w-full rounded-lg border border-line bg-bg px-3"
          >
            {data.assetTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <FieldLabel>Name</FieldLabel>
          <Input className="mb-3" value={assetName} onChange={(event) => setAssetName(event.target.value)} placeholder="Xbox #1" />
          <FieldLabel>Code</FieldLabel>
          <Input className="mb-3" value={assetCode} onChange={(event) => setAssetCode(event.target.value)} placeholder="XBOX-001" />
          <FieldLabel>Status</FieldLabel>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as OperationalStatus)}
            className="h-11 w-full rounded-lg border border-line bg-bg px-3"
          >
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
            <option value="disabled">Disabled</option>
            <option value="retired">Retired</option>
          </select>
          <Button
            className="mt-4"
            onClick={() => {
              try {
                saveAsset({
                  assetTypeId,
                  name: assetName,
                  code: assetCode,
                  description: '',
                  operationalStatus: status,
                })
                setAssetName('')
                setAssetCode('')
                setError('')
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not save asset.')
              }
            }}
          >
            Add asset
          </Button>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-extrabold">{showDeleted ? 'Deleted assets' : 'Live assets'}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowDeleted((value) => !value)
            setError('')
          }}
        >
          {showDeleted ? 'Show live assets' : `Show deleted${deletedCount ? ` (${deletedCount})` : ''}`}
        </Button>
      </div>

      {error ? <p className="mt-4 text-sm text-crimson">{error}</p> : null}

      {visibleAssets.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line px-6 py-12 text-center text-sm text-muted">
          {showDeleted
            ? 'No deleted assets. Hidden units appear here so you can restore them.'
            : 'No assets yet. Add a type and a unit above.'}
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          {types.map((type) => {
            const units = visibleAssets.filter((asset) => asset.assetTypeId === type.id)
            if (units.length === 0) return null
            return (
              <section key={type.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <AssetMockup src={type.imagePath} alt="" className="size-11 rounded-xl" />
                  <div>
                    <div className="section-title">{type.name}</div>
                    <div className="text-[11px] text-muted">
                      {units.length} {showDeleted ? 'deleted' : 'on the floor'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {units.map((asset) => (
                    <AssetUnitCard
                      key={asset.id}
                      asset={asset}
                      type={type}
                      busy={occupied.has(asset.id)}
                      onStatus={(next) => updateStatus(asset.id, next)}
                      onEdit={() => setEditing(asset)}
                      onDelete={() => setPendingDelete(asset)}
                      onRestore={() => setPendingRestore(asset)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {editing ? (
        <EditAssetDialog
          key={editing.id}
          asset={editing}
          types={data.assetTypes}
          occupied={occupied.has(editing.id)}
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          onError={setError}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this asset?"
        body={
          pendingDelete
            ? `${pendingDelete.name} will leave the floor and stop being allocatable. Past sessions still show “${pendingDelete.name}”. Restore it from the deleted list if you need it again.`
            : ''
        }
        confirmLabel="Delete asset"
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (!pendingDelete) return
          setAssetDeleted(pendingDelete.id, true)
          setError('')
        }}
      />
      <ConfirmDialog
        open={Boolean(pendingRestore)}
        title="Restore this asset?"
        body={
          pendingRestore
            ? `${pendingRestore.name} will show on the floor again if its status is available.`
            : ''
        }
        confirmLabel="Restore"
        confirmVariant="electric"
        onOpenChange={(open) => {
          if (!open) setPendingRestore(null)
        }}
        onConfirm={() => {
          if (!pendingRestore) return
          setAssetDeleted(pendingRestore.id, false)
          setError('')
        }}
      />
    </div>
  )
}

function AssetMockup({
  src,
  alt,
  className,
}: {
  src: string | null | undefined
  alt: string
  className?: string
}) {
  return (
    <div className={cn('product-well relative overflow-hidden', className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(35,136,237,0.14),transparent_52%)]" />
      {src ? (
        <img
          src={src}
          alt={alt}
          width={640}
          height={640}
          loading="lazy"
          decoding="async"
          className="relative h-full w-full object-contain p-2"
        />
      ) : (
        <div className="relative flex h-full items-center justify-center px-3 text-center text-[10px] font-bold tracking-[0.16em] text-[#7a8ea3] uppercase">
          No mockup
        </div>
      )}
    </div>
  )
}

function AssetUnitCard({
  asset,
  type,
  busy,
  onStatus,
  onEdit,
  onDelete,
  onRestore,
}: {
  asset: Asset
  type: AssetType
  busy: boolean
  onStatus: (status: OperationalStatus) => void
  onEdit: () => void
  onDelete: () => void
  onRestore: () => void
}) {
  const pillStatus = asset.isDeleted ? 'disabled' : busy ? 'in-use' : asset.operationalStatus

  return (
    <article className="esports-card flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="relative">
        <AssetMockup src={type.imagePath} alt={asset.name} className="h-36 sm:h-40" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,rgba(6,15,28,0.78))]" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
          <span className="max-w-[70%] truncate rounded-lg bg-[#060f1c]/85 px-1.5 py-0.5 text-xs font-extrabold text-white backdrop-blur-sm">
            {asset.name}
          </span>
          <StatusPill status={pillStatus}>
            {asset.isDeleted ? 'Deleted' : busy ? 'In use' : asset.operationalStatus}
          </StatusPill>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-2.5 pb-1.5 text-[11px] font-semibold tracking-wider text-white/80 uppercase">
          {asset.code}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        {!asset.isDeleted ? (
          <select
            value={asset.operationalStatus}
            onChange={(event) => onStatus(event.target.value as OperationalStatus)}
            className="h-10 w-full rounded-lg border border-line bg-bg px-2 text-sm"
          >
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
            <option value="disabled">Disabled</option>
            <option value="retired">Retired</option>
          </select>
        ) : null}
        <div className="mt-auto flex flex-wrap gap-1.5">
          {!asset.isDeleted ? (
            <>
              <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
                Edit
              </Button>
              <Button size="sm" variant="crimson" className="flex-1" onClick={onDelete}>
                Delete
              </Button>
            </>
          ) : (
            <Button size="sm" variant="electric" className="w-full" onClick={onRestore}>
              Restore
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

function EditAssetDialog({
  asset,
  types,
  occupied,
  onOpenChange,
  onError,
}: {
  asset: Asset
  types: { id: string; name: string }[]
  occupied: boolean
  onOpenChange: (open: boolean) => void
  onError: (message: string) => void
}) {
  const [name, setName] = useState(asset.name)
  const [code, setCode] = useState(asset.code)
  const [assetTypeId, setAssetTypeId] = useState(asset.assetTypeId)
  const [operationalStatus, setOperationalStatus] = useState<OperationalStatus>(asset.operationalStatus)
  const [localError, setLocalError] = useState('')

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        title={`Edit ${asset.name}`}
        className="max-w-lg"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                try {
                  saveAsset({
                    id: asset.id,
                    assetTypeId,
                    name,
                    code,
                    description: asset.description,
                    operationalStatus,
                  })
                  onError('')
                  onOpenChange(false)
                } catch (err) {
                  setLocalError(
                    err instanceof Error ? err.message : (err as { message?: string }).message || 'Could not save.',
                  )
                }
              }}
            >
              Save changes
            </Button>
          </div>
        }
      >
        <FieldLabel>Name</FieldLabel>
        <Input className="mb-3" value={name} onChange={(event) => setName(event.target.value)} />
        <FieldLabel>Code</FieldLabel>
        <Input className="mb-3" value={code} onChange={(event) => setCode(event.target.value)} />
        <FieldLabel>Type</FieldLabel>
        <select
          value={assetTypeId}
          disabled={occupied}
          onChange={(event) => setAssetTypeId(event.target.value)}
          className="mb-3 h-11 w-full rounded-lg border border-line bg-bg px-3"
        >
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        <FieldLabel>Status</FieldLabel>
        <select
          value={operationalStatus}
          onChange={(event) => setOperationalStatus(event.target.value as OperationalStatus)}
          className="h-11 w-full rounded-lg border border-line bg-bg px-3"
        >
          <option value="available">Available</option>
          <option value="maintenance">Maintenance</option>
          <option value="disabled">Disabled</option>
          <option value="retired">Retired</option>
        </select>
        {occupied ? (
          <p className="mt-3 text-sm text-muted">This unit is in a live session. End it before changing type or status.</p>
        ) : null}
        {localError ? <p className="mt-3 text-sm text-crimson">{localError}</p> : null}
      </DialogContent>
    </Dialog>
  )
}
