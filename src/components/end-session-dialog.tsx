import { useMemo, useState } from 'react'
import { Dialog, DialogContent } from './ui/dialog'
import { Button } from './ui/button'
import { FieldLabel, Input } from './ui/input'
import { formatMoney, rupeesToPaise } from '@/lib/money'
import { completeSession, previewComplete, sessionDisplayName } from '@/lib/store'
import { formatClock, formatDuration, formatDurationShort } from '@/lib/time'
import type { AppData, GamingSession, PaymentMethod, PaymentStatus } from '@/lib/types'
import { useNow } from '@/hooks/use-now'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: AppData
  session: GamingSession | null
}

export function EndSessionDialog({ open, onOpenChange, data, session }: Props) {
  const now = useNow(1000)
  const [override, setOverride] = useState('')
  const [reason, setReason] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('collected')
  const [method, setMethod] = useState<PaymentMethod>('upi')
  const [error, setError] = useState('')

  const preview = useMemo(() => {
    if (!session) return null
    return previewComplete(session.id, new Date(now).toISOString())
  }, [session, now])

  if (!session || !preview) return null

  const overridePaise = override.trim() === '' ? null : rupeesToPaise(Number(override))
  const finalPaise = overridePaise ?? preview.computedAmountPaise

  function confirm() {
    if (!session) return
    if (overridePaise !== null && (Number.isNaN(Number(override)) || !reason.trim())) {
      setError('Add a reason when you override the amount.')
      return
    }
    try {
      completeSession({
        sessionId: session.id,
        overrideAmountPaise: overridePaise,
        overrideReason: reason,
        paymentStatus,
        paymentMethod: method,
      })
      setOverride('')
      setReason('')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not end session.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Confirm bill"
        className="max-w-lg"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Keep running
            </Button>
            <Button variant="electric" onClick={confirm}>
              Confirm & release
            </Button>
          </div>
        }
      >
        <div className="rounded-2xl border border-line/70 bg-[#0c1d30]/65 px-4 py-2 text-sm">
          <Row label="Customer" value={sessionDisplayName(session, data)} />
          <Row label="Package" value={session.packageNameSnapshot} />
          <Row
            label="Time"
            value={`${formatClock(session.startedAt)} → ${formatClock(new Date(now).toISOString())}`}
          />
          <Row label="Played" value={formatDuration(preview.rawDurationSeconds)} />
          <Row
            label="Billed"
            value={`${formatDurationShort(preview.billedDurationSeconds)} · min 1h, +30 min`}
          />
          <Row label="Rate" value={`${formatMoney(preview.hourlyRatePaise)} / hr`} />
          <Row label="Computed" value={formatMoney(preview.computedAmountPaise)} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Override amount (₹)</FieldLabel>
            <Input
              inputMode="decimal"
              placeholder="Leave empty"
              value={override}
              onChange={(event) => setOverride(event.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Override reason</FieldLabel>
            <Input
              placeholder="Comp / adjust"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Payment</FieldLabel>
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}
              className="h-11 w-full rounded-xl border border-line bg-[#0b1b2d] px-3"
            >
              <option value="collected">Collected</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <FieldLabel>Method</FieldLabel>
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value as PaymentMethod)}
              className="h-11 w-full rounded-xl border border-line bg-[#0b1b2d] px-3"
            >
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-electric/35 bg-[linear-gradient(120deg,rgba(35,136,237,0.18),rgba(35,136,237,0.04))] p-4">
          <div className="text-xs tracking-[0.16em] text-muted uppercase">Final amount</div>
          <div className="text-3xl font-extrabold text-white">{formatMoney(finalPaise)}</div>
        </div>
        {error ? <p className="mt-3 text-sm text-crimson">{error}</p> : null}
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line/70 py-2 last:border-b-0">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  )
}
