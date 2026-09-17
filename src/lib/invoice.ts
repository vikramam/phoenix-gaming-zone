import { assetsForSession, sessionDisplayName } from './store'
import { chargeGamingPaise, chargeSnacksPaise } from './snacks'
import { formatClock, formatDurationShort } from './time'
import type { AppData, GamingSession, PaymentMethod, PaymentStatus, SessionCharge } from './types'

export type InvoiceModel = {
  invoiceNumber: string
  issuedAt: string
  companyName: string
  tagline: string
  customerName: string
  stationName: string
  packageName: string
  startedAt: string
  endedAt: string
  playedLabel: string
  billedLabel: string
  gamingPaise: number
  snacksPaise: number
  totalPaise: number
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod | null
}

export function invoiceNumber(sessionId: string) {
  const compact = sessionId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()
  return `PZ-${compact.padStart(6, '0')}`
}

export function formatInvoiceDate(iso: string, timeZone = 'Asia/Kolkata') {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatInvoiceMoney(paise: number) {
  return `₹${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100)}`
}

export function paymentLine(status: PaymentStatus, method: PaymentMethod | null) {
  const methodLabel =
    method === 'upi' ? 'UPI' : method === 'card' ? 'Card' : method === 'other' ? 'Other' : method === 'cash' ? 'Cash' : '—'
  return `${methodLabel} · ${status === 'pending' ? 'Pending' : 'Collected'}`
}

export function sessionStationName(session: GamingSession, data: AppData) {
  const names = assetsForSession(session.id, data)
    .filter((row) => data.assetTypes.find((type) => type.id === row.assetTypeId)?.isStation)
    .map((row) => row.assetNameSnapshot)
  return names.join(' + ') || session.packageNameSnapshot || 'Station'
}

export function invoiceFromSession(
  data: AppData,
  session: GamingSession,
  charge: Pick<
    SessionCharge,
    | 'rawDurationSeconds'
    | 'billedDurationSeconds'
    | 'snacksAmountPaise'
    | 'finalAmountPaise'
    | 'computedAmountPaise'
    | 'overrideAmountPaise'
    | 'paymentStatus'
    | 'paymentMethod'
  >,
  endedAt: string,
): InvoiceModel {
  return {
    invoiceNumber: invoiceNumber(session.id),
    issuedAt: endedAt,
    companyName: data.settings.name,
    tagline: data.settings.tagline.replace(/\s*\|\s*/g, ' · '),
    customerName: sessionDisplayName(session, data),
    stationName: sessionStationName(session, data),
    packageName: session.packageNameSnapshot,
    startedAt: session.startedAt,
    endedAt,
    playedLabel: formatDurationShort(charge.rawDurationSeconds),
    billedLabel: formatDurationShort(charge.billedDurationSeconds),
    gamingPaise: chargeGamingPaise(charge),
    snacksPaise: chargeSnacksPaise(charge),
    totalPaise: charge.finalAmountPaise,
    paymentStatus: charge.paymentStatus,
    paymentMethod: charge.paymentMethod,
  }
}

export function invoiceClock(iso: string, timeZone = 'Asia/Kolkata') {
  return formatClock(iso, timeZone)
}
