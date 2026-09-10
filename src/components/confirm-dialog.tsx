import { useState } from 'react'
import { Dialog, DialogContent } from './ui/dialog'
import { Button } from './ui/button'

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Delete',
  confirmVariant = 'crimson',
  onConfirm,
  onOpenChange,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  confirmVariant?: 'crimson' | 'electric' | 'gold'
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}) {
  const [error, setError] = useState('')

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError('')
        onOpenChange(next)
      }}
    >
      <DialogContent
        title={title}
        className="max-w-md"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant={confirmVariant}
              onClick={() => {
                try {
                  onConfirm()
                  onOpenChange(false)
                } catch (err) {
                  setError(err instanceof Error ? err.message : (err as { message?: string }).message || 'Could not continue.')
                }
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted">{body}</p>
        {error ? <p className="mt-3 text-sm text-crimson">{error}</p> : null}
      </DialogContent>
    </Dialog>
  )
}
