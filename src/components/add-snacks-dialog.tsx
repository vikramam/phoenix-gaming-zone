import { useState } from 'react'
import { Dialog, DialogContent } from './ui/dialog'
import { Button } from './ui/button'
import { FieldLabel, Input } from './ui/input'
import { formatMoney, rupeesToPaise } from '@/lib/money'
import { sessionSnacksPaise, snackQuickItems } from '@/lib/snacks'
import { addSessionSnacks } from '@/lib/store'
import type { AppData, GamingSession } from '@/lib/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: AppData
  session: GamingSession | null
}

export function AddSnacksDialog({ open, onOpenChange, data, session }: Props) {
  const [custom, setCustom] = useState('')
  const [error, setError] = useState('')

  if (!session) return null

  const snacks = sessionSnacksPaise(session)
  const items = snackQuickItems(data.settings)

  function add(amountPaise: number) {
    if (!session) return
    try {
      addSessionSnacks(session.id, amountPaise)
      setCustom('')
      setError('')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : (err as { message?: string }).message || 'Could not add snacks.')
    }
  }

  function addCustom() {
    const rupees = Number(custom)
    if (!Number.isFinite(rupees) || rupees <= 0) {
      setError('Enter a custom amount greater than zero.')
      return
    }
    add(rupeesToPaise(rupees))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setCustom('')
          setError('')
        }
        onOpenChange(next)
      }}
    >
      <DialogContent title="Add Snacks" className="max-w-md">
        <p className="mb-4 text-sm text-muted">
          Tap a quick item or enter a custom amount. This adds to snacks only — the timer keeps running.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => add(item.amountPaise)}
              className="rounded-2xl border border-line/70 bg-[#0c1d30]/80 px-3 py-4 text-left transition hover:border-electric/50 hover:bg-electric/10"
            >
              <div className="text-2xl">{item.emoji}</div>
              <div className="mt-1 text-sm font-extrabold">{item.label}</div>
              <div className="text-lg font-extrabold text-electric-soft">{formatMoney(item.amountPaise)}</div>
            </button>
          ))}
        </div>
        <div className="mt-4">
          <FieldLabel>Custom amount (₹)</FieldLabel>
          <div className="flex gap-2">
            <Input
              inputMode="decimal"
              placeholder="e.g. 35"
              value={custom}
              onChange={(event) => {
                setCustom(event.target.value)
                setError('')
              }}
            />
            <Button variant="electric" onClick={addCustom}>
              Add
            </Button>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-electric/30 bg-electric/10 px-4 py-3">
          <div className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">Snacks on this session</div>
          <div className="text-2xl font-extrabold text-white">{formatMoney(snacks)}</div>
        </div>
        {error ? <p className="mt-3 text-sm text-crimson">{error}</p> : null}
      </DialogContent>
    </Dialog>
  )
}
