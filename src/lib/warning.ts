import type { BusinessSettings, GamingSession } from './types'

export type WarningLevel = 'none' | 'yellow' | 'orange' | 'red'

export function warningPeriod(
  session: GamingSession,
  settings: BusinessSettings,
  nowMs = Date.now(),
) {
  const firstSeconds = Math.max(1, settings.warningFirstPeriodMinutes) * 60
  const extendSeconds = Math.max(1, settings.warningExtendMinutes) * 60
  const extensions = session.extensionCount ?? 0
  const startMs = new Date(session.startedAt).getTime()
  const periodSeconds = extensions === 0 ? firstSeconds : extendSeconds
  const periodStart =
    startMs + (extensions === 0 ? 0 : (firstSeconds + (extensions - 1) * extendSeconds) * 1000)
  const periodEnd = periodStart + periodSeconds * 1000
  const elapsed = (nowMs - periodStart) / 1000
  const progress = elapsed / periodSeconds
  return {
    extensions,
    periodSeconds,
    periodStart,
    periodEnd,
    elapsed,
    progress,
    remainingSeconds: Math.max(0, Math.ceil((periodEnd - nowMs) / 1000)),
  }
}

export function warningLevel(progress: number, settings: BusinessSettings): WarningLevel {
  if (progress < 0) return 'none'
  const yellow = settings.warningYellowPercent / 100
  const orange = settings.warningOrangePercent / 100
  const red = settings.warningRedPercent / 100
  if (progress >= red) return 'red'
  if (progress >= orange) return 'orange'
  if (progress >= yellow) return 'yellow'
  return 'none'
}

export const warningCardClass: Record<WarningLevel, string> = {
  none: 'border-line',
  yellow: 'warn-card-yellow border-4',
  orange: 'warn-card-orange border-4',
  red: 'warn-card-red border-4',
}

export const warningPhotoClass: Record<WarningLevel, string> = {
  none: '',
  yellow: 'warn-photo-yellow',
  orange: 'warn-photo-orange',
  red: 'warn-photo-red',
}

export const warningRibbonClass: Record<WarningLevel, string> = {
  none: 'hidden',
  yellow: 'bg-yellow-300 text-black',
  orange: 'bg-orange-500 text-black',
  red: 'bg-red-600 text-white',
}

export const warningTimerClass: Record<WarningLevel, string> = {
  none: 'text-white',
  yellow: 'text-yellow-300',
  orange: 'text-orange-400',
  red: 'text-red-400',
}
