import { useMemo, useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { FieldLabel, Input, TextArea } from '@/components/ui/input'
import { formatMoney } from '@/lib/money'
import { customerStats } from '@/lib/reports'
import { activeSessionForCustomer, assetsForSession, saveCustomer, setCustomerDeleted } from '@/lib/store'
import { formatClock, formatDate, formatDurationShort } from '@/lib/time'
import type { AppData, Customer } from '@/lib/types'
import { canEditCustomers } from '@/lib/access'
import { useAppData, useAuthUser } from '@/lib/use-store'
import { cn } from '@/lib/utils'

export function CustomersPage() {
  const data = useAppData()
  const user = useAuthUser()
  const canEdit = canEditCustomers(user)
  const [query, setQuery] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)

  const deletedCount = data.customers.filter((customer) => customer.isDeleted).length
  const rows = data.customers.filter((customer) => {
    if (customer.isDeleted !== showDeleted) return false
    const q = query.toLowerCase()
    return customer.name.toLowerCase().includes(q) || customer.phone.includes(query)
  })
  const creating = selectedId === 'new'
  const selected = creating ? null : (rows.find((row) => row.id === selectedId) ?? rows[0] ?? null)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Customers</h1>
        <p className="text-sm text-muted">
          {canEdit
            ? 'Names entered at session start are saved here. Empty names stay walk-ins. Deleting a customer hides them from new sessions — visit history stays.'
            : 'View customer profiles and visit history. Only the owner can add, edit, or delete customers.'}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder={showDeleted ? 'Search deleted customers' : 'Search customers'}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button
          variant="outline"
          className="shrink-0"
          onClick={() => {
            setShowDeleted((value) => !value)
            setSelectedId(null)
            setMobileDetail(false)
            setQuery('')
          }}
        >
          {showDeleted ? 'Show active' : `Show deleted${deletedCount ? ` (${deletedCount})` : ''}`}
        </Button>
        {canEdit && !showDeleted ? (
          <Button
            className="shrink-0"
            onClick={() => {
              setSelectedId('new')
              setMobileDetail(true)
            }}
          >
            <Plus className="size-4" /> New customer
          </Button>
        ) : null}
      </div>

      {rows.length === 0 && !creating ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center text-muted">
          {showDeleted
            ? 'No deleted customers. Soft-deleted profiles appear here so you can restore them.'
            : canEdit
              ? 'No saved customers yet. Start a named session or add one here.'
              : 'No saved customers yet.'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,320px)_1fr] lg:items-start">
          <div className={cn('esports-card overflow-hidden rounded-2xl', mobileDetail && 'hidden lg:block')}>
            {rows.map((customer) => {
              const stats = customerStats(data, customer.id)
              const active = !creating && selected?.id === customer.id
              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(customer.id)
                    setMobileDetail(true)
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-line/60 px-3 py-3 text-left last:border-b-0',
                    active ? 'bg-electric/18' : 'hover:bg-white/4',
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric/18 text-sm font-extrabold text-electric-soft">
                    {customer.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{customer.name}</div>
                    <div className="truncate text-[11px] text-muted">
                      {customer.isDeleted ? 'Deleted' : customer.phone || 'No phone'}
                    </div>
                  </div>
                  <span className={cn('text-xs font-bold', active ? 'text-electric-soft' : 'text-muted')}>
                    {stats.sessions}
                  </span>
                </button>
              )
            })}
          </div>

          <div className={cn(!mobileDetail && rows.length > 0 && 'hidden lg:block')}>
            {mobileDetail ? (
              <button
                type="button"
                onClick={() => {
                  setMobileDetail(false)
                  if (creating) setSelectedId(null)
                }}
                className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-electric-soft lg:hidden"
              >
                <ArrowLeft className="size-4" /> Back to customers
              </button>
            ) : null}
            {creating && canEdit ? (
              <CustomerEditor
                key="new"
                data={data}
                canEdit
                onSaved={(customer) => {
                  setSelectedId(customer.id)
                  setMobileDetail(true)
                }}
              />
            ) : selected ? (
              <CustomerEditor
                key={selected.id}
                customer={selected}
                data={data}
                canEdit={canEdit}
                onDeleted={() => {
                  setShowDeleted(true)
                  setSelectedId(selected.id)
                  setMobileDetail(true)
                }}
                onRestored={() => {
                  setShowDeleted(false)
                  setSelectedId(selected.id)
                  setMobileDetail(true)
                }}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

function CustomerEditor({
  customer,
  data,
  canEdit,
  onSaved,
  onDeleted,
  onRestored,
}: {
  customer?: Customer
  data: AppData
  canEdit: boolean
  onSaved?: (customer: Customer) => void
  onDeleted?: () => void
  onRestored?: () => void
}) {
  const [name, setName] = useState(customer?.name ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [notes, setNotes] = useState(customer?.notes ?? '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState(false)

  const visits = useMemo(() => {
    if (!customer) return []
    return data.sessions
      .filter((session) => session.customerId === customer.id && session.status === 'completed')
      .sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? ''))
  }, [customer, data.sessions])

  const stats = customer ? customerStats(data, customer.id) : { sessions: 0, spent: 0 }
  const lastSeen = visits[0]?.endedAt
  const deleted = Boolean(customer?.isDeleted)
  const liveSession = customer ? activeSessionForCustomer(customer.id, data) : null
  const dirty =
    name !== (customer?.name ?? '') ||
    phone !== (customer?.phone ?? '') ||
    notes !== (customer?.notes ?? '')

  function save() {
    try {
      const next = saveCustomer({
        id: customer?.id,
        name,
        phone,
        notes,
      })
      setError('')
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1800)
      onSaved?.(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="esports-card rounded-2xl p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">{customer ? customer.name : 'New customer'}</h2>
            {deleted ? (
              <p className="mt-1 text-xs font-bold tracking-wider text-crimson uppercase">Deleted — history kept</p>
            ) : null}
          </div>
          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              {customer && !deleted ? (
                <Button size="sm" variant="outline" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              ) : null}
              {customer && deleted ? (
                <Button size="sm" variant="electric" onClick={() => setConfirmRestore(true)}>
                  Restore
                </Button>
              ) : null}
              {!deleted ? (
                <Button size="sm" disabled={!dirty && Boolean(customer)} onClick={save}>
                  {customer ? 'Save profile' : 'Create customer'}
                </Button>
              ) : null}
            </div>
          ) : (
            <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-bold tracking-wider text-muted uppercase">
              View only
            </span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Name</FieldLabel>
            <Input value={name} disabled={!canEdit || deleted} onChange={(event) => setName(event.target.value)} />
          </div>
          <div>
            <FieldLabel>Phone</FieldLabel>
            <Input
              value={phone}
              disabled={!canEdit || deleted}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Notes</FieldLabel>
            <TextArea
              value={notes}
              disabled={!canEdit || deleted}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-24"
            />
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-crimson">{error}</p> : null}
        {saved ? <p className="mt-3 text-sm text-electric-soft">Saved</p> : null}
        {canEdit && liveSession ? (
          <p className="mt-3 text-sm text-muted">This customer has an active session. End it before deleting.</p>
        ) : null}
      </div>

      {customer ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Lifetime" value={formatMoney(stats.spent)} />
            <MiniStat label="Visits" value={String(stats.sessions)} />
            <MiniStat label="Last seen" value={lastSeen ? formatDate(lastSeen) : '—'} />
          </div>

          <div className="esports-card rounded-2xl p-4 sm:p-5">
            <div className="section-title mb-3">Visit log</div>
            {visits.length === 0 ? (
              <p className="text-sm text-muted">No completed sessions yet.</p>
            ) : (
              <div>
                {visits.map((session) => {
                  const charge = data.charges.find((row) => row.sessionId === session.id)
                  const station = assetsForSession(session.id, data)
                    .filter((row) => data.assetTypes.find((type) => type.id === row.assetTypeId)?.isStation)
                    .map((row) => row.assetNameSnapshot)
                    .join(' + ')
                  return (
                    <div
                      key={session.id}
                      className="grid grid-cols-[1fr_auto] gap-2 border-b border-line/50 py-2.5 last:border-b-0 sm:grid-cols-[1.4fr_1fr_auto]"
                    >
                      <div>
                        <div className="text-sm font-bold">
                          {session.endedAt ? formatDate(session.endedAt) : ''} · {formatClock(session.startedAt)}
                        </div>
                        <div className="text-[11px] text-muted">{station || 'No station'}</div>
                      </div>
                      <div className="hidden text-sm text-muted sm:block">{session.packageNameSnapshot}</div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold">
                          {charge ? formatMoney(charge.finalAmountPaise) : '—'}
                        </div>
                        <div className="text-[11px] text-muted">
                          {charge ? formatDurationShort(charge.rawDurationSeconds) : ''}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : null}

      {customer && canEdit ? (
        <>
          <ConfirmDialog
            open={confirmDelete}
            title="Delete this customer?"
            body={`${customer.name} will be hidden from new sessions. Their visit log and past bills stay exactly as they are. You can restore them later.`}
            confirmLabel="Delete customer"
            onOpenChange={setConfirmDelete}
            onConfirm={() => {
              setCustomerDeleted(customer.id, true)
              onDeleted?.()
            }}
          />
          <ConfirmDialog
            open={confirmRestore}
            title="Restore this customer?"
            body={`${customer.name} will show up again in search and can start new sessions.`}
            confirmLabel="Restore"
            confirmVariant="electric"
            onOpenChange={setConfirmRestore}
            onConfirm={() => {
              setCustomerDeleted(customer.id, false)
              onRestored?.()
            }}
          />
        </>
      ) : null}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="esports-card rounded-2xl px-3 py-3">
      <div className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">{label}</div>
      <div className="truncate text-lg font-extrabold">{value}</div>
    </div>
  )
}
