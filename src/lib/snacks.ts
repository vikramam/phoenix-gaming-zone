import { rupeesToPaise } from './money'
import type { BusinessSettings } from './types'

export const DEFAULT_SNACK_COKE_PAISE = rupeesToPaise(40)
export const DEFAULT_SNACK_CHIPS_PAISE = rupeesToPaise(20)

export type SnackQuickItem = {
  id: 'coke' | 'chips'
  label: string
  emoji: string
  amountPaise: number
}

export function snackCokePaise(settings: Pick<BusinessSettings, 'snackCokePaise'>) {
  return settings.snackCokePaise ?? DEFAULT_SNACK_COKE_PAISE
}

export function snackChipsPaise(settings: Pick<BusinessSettings, 'snackChipsPaise'>) {
  return settings.snackChipsPaise ?? DEFAULT_SNACK_CHIPS_PAISE
}

export function snackQuickItems(settings: Pick<BusinessSettings, 'snackCokePaise' | 'snackChipsPaise'>): SnackQuickItem[] {
  return [
    { id: 'coke', label: 'Coke', emoji: '🥤', amountPaise: snackCokePaise(settings) },
    { id: 'chips', label: 'Chips', emoji: '🍟', amountPaise: snackChipsPaise(settings) },
  ]
}

export function sessionSnacksPaise(session: { snacksAmountPaise?: number } | null | undefined) {
  return Math.max(0, session?.snacksAmountPaise ?? 0)
}

export function chargeSnacksPaise(charge: { snacksAmountPaise?: number } | null | undefined) {
  return Math.max(0, charge?.snacksAmountPaise ?? 0)
}

export function chargeGamingPaise(charge: { finalAmountPaise: number; snacksAmountPaise?: number }) {
  return Math.max(0, charge.finalAmountPaise - chargeSnacksPaise(charge))
}
