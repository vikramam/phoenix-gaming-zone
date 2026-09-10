import type { RoundingMode, SessionCharge } from './types'
import { secondsBetween } from './time'

export function billedSeconds(
  rawSeconds: number,
  incrementMinutes: number,
  minimumMinutes: number,
  roundingMode: RoundingMode,
) {
  const increment = Math.max(1, incrementMinutes) * 60
  const minimum = Math.max(0, minimumMinutes) * 60
  const raw = Math.max(0, rawSeconds)
  let blocks: number
  const exact = raw / increment
  if (roundingMode === 'down') {
    blocks = Math.floor(exact)
  } else if (roundingMode === 'nearest') {
    blocks = Math.round(exact)
  } else {
    blocks = Math.ceil(exact)
  }
  if (raw > 0 && blocks === 0) blocks = 1
  return Math.max(minimum, blocks * increment)
}

export function amountForDuration(hourlyRatePaise: number, durationSeconds: number) {
  return Math.round((hourlyRatePaise * durationSeconds) / 3600)
}

export function computeCharge(input: {
  sessionId: string
  packageId: string | null
  packageName: string
  hourlyRatePaise: number
  incrementMinutes: number
  minimumMinutes: number
  roundingMode: RoundingMode
  startedAt: string
  endedAt: string
  overrideAmountPaise?: number | null
  overrideReason?: string
  paymentStatus?: SessionCharge['paymentStatus']
  paymentMethod?: SessionCharge['paymentMethod']
}): SessionCharge {
  const rawDurationSeconds = secondsBetween(input.startedAt, input.endedAt)
  const billedDurationSeconds = billedSeconds(
    rawDurationSeconds,
    input.incrementMinutes,
    input.minimumMinutes,
    input.roundingMode,
  )
  const computedAmountPaise = amountForDuration(input.hourlyRatePaise, billedDurationSeconds)
  const override = input.overrideAmountPaise ?? null
  return {
    sessionId: input.sessionId,
    packageId: input.packageId,
    packageName: input.packageName,
    hourlyRatePaise: input.hourlyRatePaise,
    billingIncrementMinutes: input.incrementMinutes,
    minimumDurationMinutes: input.minimumMinutes,
    roundingMode: input.roundingMode,
    rawDurationSeconds,
    billedDurationSeconds,
    computedAmountPaise,
    overrideAmountPaise: override,
    overrideReason: input.overrideReason?.trim() ?? '',
    finalAmountPaise: override ?? computedAmountPaise,
    paymentStatus: input.paymentStatus ?? 'collected',
    paymentMethod: input.paymentMethod ?? 'cash',
  }
}
