import { useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { FieldLabel, Input } from '@/components/ui/input'
import { occupiedAssetIds, saveAsset, saveAssetType, setAssetDeleted } from '@/lib/store'
import type { Asset, OperationalStatus } from '@/lib/types'
import { useAppData } from '@/lib/use-store'

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
          <div className="mt-4 space-y-2">
            {data.assetTypes.map((type) => (
              <div key={type.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                <span>{type.name}</span>
                <span className="text-muted">{type.isStation ? 'Station' : 'Accessory'}</span>
              </div>
            ))}
          </div>
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
        <>
          <div className="mt-4 space-y-2.5 md:hidden">
            {visibleAssets.map((asset) => {
              const type = data.assetTypes.find((row) => row.id === asset.assetTypeId)
              const busy = occupied.has(asset.id)
              return (
                <div key={asset.id} className="esports-card rounded-2xl p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-bold">{asset.name}</div>
                      <div className="text-xs text-muted">
                        {asset.code} · {type?.name}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] font-bold tracking-wider text-muted uppercase">
                      {asset.isDeleted ? 'Deleted' : busy ? 'In use' : asset.operationalStatus}
                    </span>
                  </div>
                  {!asset.isDeleted ? (
                    <select
                      value={asset.operationalStatus}
                      onChange={(event) => updateStatus(asset.id, event.target.value as OperationalStatus)}
                      className="mt-3 h-10 w-full rounded-lg border border-line bg-bg px-2 text-sm"
                    >
                      <option value="available">Available</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="disabled">Disabled</option>
                      <option value="retired">Retired</option>
                    </select>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!asset.isDeleted ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setEditing(asset)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="crimson" onClick={() => setPendingDelete(asset)}>
                          Delete
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="electric" onClick={() => setPendingRestore(asset)}>
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="esports-card scroll-slim mt-4 hidden overflow-x-auto rounded-2xl md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/5 text-xs tracking-[0.14em] text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleAssets.map((asset) => {
                  const type = data.assetTypes.find((row) => row.id === asset.assetTypeId)
                  const busy = occupied.has(asset.id)
                  return (
                    <tr key={asset.id} className="border-t border-line">
                      <td className="px-4 py-3">
                        <div className="font-bold">{asset.name}</div>
                        <div className="text-xs text-muted">{asset.code}</div>
                      </td>
                      <td className="px-4 py-3">{type?.name}</td>
                      <td className="px-4 py-3">
                        {asset.isDeleted ? 'Deleted' : busy ? 'In use' : asset.operationalStatus}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {!asset.isDeleted ? (
                            <>
                              <select
                                value={asset.operationalStatus}
                                onChange={(event) =>
                                  updateStatus(asset.id, event.target.value as OperationalStatus)
                                }
                                className="h-9 rounded-lg border border-line bg-bg px-2"
                              >
                                <option value="available">Available</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="disabled">Disabled</option>
                                <option value="retired">Retired</option>
                              </select>
                              <Button size="sm" variant="outline" onClick={() => setEditing(asset)}>
                                Edit
                              </Button>
                              <Button size="sm" variant="crimson" onClick={() => setPendingDelete(asset)}>
                                Delete
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="electric" onClick={() => setPendingRestore(asset)}>
                              Restore
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
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
