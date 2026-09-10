import type { DatePreset } from './types'

export const IST_OFFSET = '+05:30'

export function nowIso() {
  return new Date().toISOString()
}

export function formatClock(iso: string, timeZone = 'Asia/Kolkata') {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

export function formatDate(iso: string, timeZone = 'Asia/Kolkata') {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatDateTime(iso: string, timeZone = 'Asia/Kolkata') {
  return `${formatDate(iso, timeZone)} · ${formatClock(iso, timeZone)}`
}

export function ymdInZone(date: Date, timeZone = 'Asia/Kolkata') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function startOfDayIso(ymd: string) {
  return new Date(`${ymd}T00:00:00${IST_OFFSET}`).toISOString()
}

export function endOfDayIso(ymd: string) {
  return new Date(`${ymd}T23:59:59.999${IST_OFFSET}`).toISOString()
}

export function addDaysYmd(ymd: string, days: number) {
  const date = new Date(`${ymd}T12:00:00${IST_OFFSET}`)
  date.setUTCDate(date.getUTCDate() + days)
  return ymdInZone(date)
}

export function startOfWeekYmd(ymd: string) {
  const date = new Date(`${ymd}T12:00:00${IST_OFFSET}`)
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
  }).format(date)
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  const offset = map[weekday] ?? 0
  return addDaysYmd(ymd, -offset)
}

export function startOfMonthYmd(ymd: string) {
  return `${ymd.slice(0, 7)}-01`
}

export function rangeForPreset(preset: DatePreset, customFrom?: string, customTo?: string) {
  const today = ymdInZone(new Date())
  if (preset === 'today') {
    return { from: startOfDayIso(today), to: endOfDayIso(today), label: 'Today' }
  }
  if (preset === 'yesterday') {
    const y = addDaysYmd(today, -1)
    return { from: startOfDayIso(y), to: endOfDayIso(y), label: 'Yesterday' }
  }
  if (preset === 'week') {
    const start = startOfWeekYmd(today)
    return { from: startOfDayIso(start), to: endOfDayIso(today), label: 'This week' }
  }
  if (preset === 'month') {
    return { from: startOfDayIso(startOfMonthYmd(today)), to: endOfDayIso(today), label: 'This month' }
  }
  const from = customFrom || today
  const to = customTo || today
  return { from: startOfDayIso(from), to: endOfDayIso(to), label: 'Custom' }
}

export function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

export function formatDurationShort(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  if (hours <= 0) return `${minutes}m`
  if (minutes <= 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function secondsBetween(startIso: string, endIso: string) {
  return Math.max(0, Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000))
}

export function parseTimeToMinutes(value: string) {
  const [h, m] = value.split(':').map((part) => Number(part))
  return (h || 0) * 60 + (m || 0)
}

export function openHoursInRange(
  fromIso: string,
  toIso: string,
  openTime: string,
  closeTime: string,
  closesNextDay: boolean,
) {
  const from = new Date(fromIso)
  const to = new Date(toIso)
  let hours = 0
  const cursor = new Date(from)
  while (cursor <= to) {
    const ymd = ymdInZone(cursor)
    const open = new Date(`${ymd}T${openTime}:00${IST_OFFSET}`)
    const closeYmd = closesNextDay ? addDaysYmd(ymd, 1) : ymd
    const close = new Date(`${closeYmd}T${closeTime}:00${IST_OFFSET}`)
    const overlapStart = Math.max(open.getTime(), from.getTime())
    const overlapEnd = Math.min(close.getTime(), to.getTime())
    if (overlapEnd > overlapStart) {
      hours += (overlapEnd - overlapStart) / 3_600_000
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return hours
}
