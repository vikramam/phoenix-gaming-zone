import { chargeGamingPaise, chargeSnacksPaise } from './snacks'
import { formatDurationShort, openHoursInRange, secondsBetween } from './time'
import type { AppData, DatePreset } from './types'
import { rangeForPreset } from './time'
import { occupiedAssetIds } from './store'

export function completedInRange(data: AppData, from: string, to: string) {
  return data.sessions.filter((session) => {
    if (session.status !== 'completed' || !session.endedAt) return false
    return session.endedAt >= from && session.endedAt <= to
  })
}

export function reportSummary(data: AppData, preset: DatePreset, customFrom?: string, customTo?: string) {
  const range = rangeForPreset(preset, customFrom, customTo)
  const sessions = completedInRange(data, range.from, range.to)
  const charges = sessions
    .map((session) => data.charges.find((row) => row.sessionId === session.id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))

  const gamingRevenue = charges.reduce((sum, row) => sum + chargeGamingPaise(row), 0)
  const snacksRevenue = charges.reduce((sum, row) => sum + chargeSnacksPaise(row), 0)
  const revenue = charges.reduce((sum, row) => sum + row.finalAmountPaise, 0)
  const gamingSeconds = charges.reduce((sum, row) => sum + row.rawDurationSeconds, 0)
  const occupied = occupiedAssetIds(data)
  const liveAssets = data.assets.filter((asset) => asset.operationalStatus !== 'retired' && !asset.isDeleted)
  const inUse = liveAssets.filter((asset) => occupied.has(asset.id)).length
  const available = liveAssets.filter(
    (asset) => asset.operationalStatus === 'available' && !occupied.has(asset.id),
  ).length

  const byPackage = new Map<string, { name: string; revenue: number; sessions: number }>()
  for (const charge of charges) {
    const current = byPackage.get(charge.packageName) ?? {
      name: charge.packageName,
      revenue: 0,
      sessions: 0,
    }
    current.revenue += chargeGamingPaise(charge)
    current.sessions += 1
    byPackage.set(charge.packageName, current)
  }

  const openHours = openHoursInRange(
    range.from,
    range.to,
    data.settings.openTime,
    data.settings.closeTime,
    data.settings.closesNextDay,
  )

  const assetUsage = data.assets
    .filter((asset) => asset.operationalStatus !== 'retired' || sessions.some((session) =>
      data.sessionAssets.some((row) => row.sessionId === session.id && row.assetId === asset.id),
    ))
    .map((asset) => {
      const rows = sessions.flatMap((session) =>
        data.sessionAssets.filter((row) => row.sessionId === session.id && row.assetId === asset.id),
      )
      const hoursSeconds = rows.reduce((sum, row) => {
        const session = sessions.find((item) => item.id === row.sessionId)
        if (!session?.endedAt) return sum
        return sum + secondsBetween(session.startedAt, session.endedAt)
      }, 0)
      const utilization = openHours > 0 ? (hoursSeconds / 3600 / openHours) * 100 : 0
      return {
        asset,
        sessions: rows.length,
        seconds: hoursSeconds,
        hoursLabel: formatDurationShort(hoursSeconds),
        utilization,
      }
    })
    .sort((a, b) => b.seconds - a.seconds)

  const usageByType = data.assetTypes
    .filter((type) => type.status === 'active')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((type) => {
      const units = assetUsage.filter((row) => row.asset.assetTypeId === type.id)
      const liveCount = data.assets.filter(
        (asset) =>
          asset.assetTypeId === type.id &&
          asset.operationalStatus !== 'retired' &&
          !asset.isDeleted,
      ).length
      const seconds = units.reduce((sum, row) => sum + row.seconds, 0)
      const sessionCount = units.reduce((sum, row) => sum + row.sessions, 0)
      const capacityHours = openHours * Math.max(1, liveCount)
      const utilization = capacityHours > 0 ? (seconds / 3600 / capacityHours) * 100 : 0
      return {
        type,
        units,
        unitCount: liveCount,
        sessions: sessionCount,
        seconds,
        hoursLabel: formatDurationShort(seconds),
        utilization,
      }
    })
    .filter((group) => group.unitCount > 0 || group.sessions > 0)

  return {
    range,
    revenue,
    gamingRevenue,
    snacksRevenue,
    completed: sessions.length,
    gamingSeconds,
    active: data.sessions.filter((session) => session.status === 'active').length,
    available,
    inUse,
    byPackage: [...byPackage.values()].sort((a, b) => b.revenue - a.revenue),
    assetUsage,
    usageByType,
    sessions,
    charges,
  }
}

export function customerStats(data: AppData, customerId: string) {
  const sessions = data.sessions.filter((row) => row.customerId === customerId && row.status === 'completed')
  const spent = sessions.reduce((sum, session) => {
    const charge = data.charges.find((row) => row.sessionId === session.id)
    return sum + (charge?.finalAmountPaise ?? 0)
  }, 0)
  return { sessions: sessions.length, spent }
}
