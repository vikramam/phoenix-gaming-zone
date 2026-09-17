import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from './ui/button'
import { downloadInvoicePdf } from '@/lib/invoice-pdf'
import type { InvoiceModel } from '@/lib/invoice'
import { cn } from '@/lib/utils'

export function DownloadInvoiceButton({
  model,
  variant = 'outline',
  size = 'md',
  className,
  label = 'Download invoice',
}: {
  model: InvoiceModel | null
  variant?: 'gold' | 'electric' | 'crimson' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onClick() {
    if (!model) return
    setError('')
    setBusy(true)
    try {
      await downloadInvoicePdf(model)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download invoice.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={!model || busy}
        onClick={() => void onClick()}
      >
        <Download className="size-4" />
        {busy ? 'Preparing…' : label}
      </Button>
      {error ? <p className="text-xs text-crimson">{error}</p> : null}
    </div>
  )
}
