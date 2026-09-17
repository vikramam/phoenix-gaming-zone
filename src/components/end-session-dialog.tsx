import { useMemo, useState } from 'react'
import { DownloadInvoiceButton } from './download-invoice-button'
import { Dialog, DialogContent } from './ui/dialog'
import { Button } from './ui/button'
import { FieldLabel, Input } from './ui/input'
import { invoiceFromSession } from '@/lib/invoice'
import { formatMoney, rupeesToPaise } from '@/lib/money'
import { sessionSnacksPaise } from '@/lib/snacks'
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
  const snacksPaise = sessionSnacksPaise(session)
  const gamingPaise = overridePaise ?? preview.computedAmountPaise
  const finalPaise = gamingPaise + snacksPaise
  const endedAt = new Date(now).toISOString()
  const invoice = invoiceFromSession(
    data,
    session,
    {
      ...preview,
      overrideAmountPaise: overridePaise,
      snacksAmountPaise: snacksPaise,
      finalAmountPaise: finalPaise,
      paymentStatus,
      paymentMethod: method,
    },
    endedAt,
  )

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
        title="Session Summary"
        className="max-w-xl"
        dense
        footer={
          <div className="flex items-center gap-2">
            <DownloadInvoiceButton model={invoice} size="sm" label="Invoice" className="shrink-0" />
            <div className="ml-auto flex min-w-0 items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
                <span className="sm:hidden">Keep</span>
                <span className="hidden sm:inline">Keep running</span>
              </Button>
              <Button size="sm" variant="electric" onClick={confirm}>
                Confirm
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-x-4 rounded-xl border border-line/70 bg-[#0c1d30]/65 px-3 py-1 text-sm">
          <Row label="Customer" value={sessionDisplayName(session, data)} />
          <Row label="Package" value={session.packageNameSnapshot} />
          <Row
            label="Time"
            value={`${formatClock(session.startedAt)} → ${formatClock(new Date(now).toISOString())}`}
          />
          <Row label="Played" value={formatDuration(preview.rawDurationSeconds)} />
          <Row label="Billed" value={formatDurationShort(preview.billedDurationSeconds)} />
          <Row label="Rate" value={`${formatMoney(preview.hourlyRatePaise)} / hr`} />
          <Row label="Gaming" value={formatMoney(gamingPaise)} />
          <Row label="Snacks" value={formatMoney(snacksPaise)} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>Override ₹</FieldLabel>
            <Input
              className="h-9"
              inputMode="decimal"
              placeholder="Leave empty"
              value={override}
              onChange={(event) => setOverride(event.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Reason</FieldLabel>
            <Input
              className="h-9"
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
              className="h-9 w-full rounded-xl border border-line bg-[#0b1b2d] px-3 text-sm"
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
              className="h-9 w-full rounded-xl border border-line bg-[#0b1b2d] px-3 text-sm"
            >
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-electric/35 bg-[linear-gradient(120deg,rgba(35,136,237,0.18),rgba(35,136,237,0.04))] px-3 py-2">
          <div>
            <div className="text-[10px] tracking-[0.16em] text-muted uppercase">Collectable</div>
            <div className="text-[11px] text-muted">
              Gaming {formatMoney(gamingPaise)} + Snacks {formatMoney(snacksPaise)}
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{formatMoney(finalPaise)}</div>
        </div>
        {error ? <p className="mt-2 text-sm text-crimson">{error}</p> : null}
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 border-b border-line/70 py-1.5 [&:nth-last-child(-n+2)]:border-b-0">
      <span className="shrink-0 text-xs text-muted">{label}</span>
      <span className="truncate text-right text-sm font-semibold">{value}</span>
    </div>
  )
}
