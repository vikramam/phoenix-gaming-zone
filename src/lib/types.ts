export type OperationalStatus = 'available' | 'maintenance' | 'disabled' | 'retired'
export type PackageStatus = 'active' | 'disabled' | 'retired'
export type SessionStatus = 'active' | 'completed'
export type PaymentStatus = 'pending' | 'collected'
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'other'
export type RoundingMode = 'up' | 'nearest' | 'down'
export type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom'

export type AssetType = {
  id: string
  name: string
  slug: string
  isStation: boolean
  iconKey: string
  imagePath: string | null
  sortOrder: number
  status: 'active' | 'archived'
}

export type Asset = {
  id: string
  assetTypeId: string
  code: string
  name: string
  description: string
  operationalStatus: OperationalStatus
  retiredAt: string | null
  isDeleted: boolean
}

export type Customer = {
  id: string
  name: string
  phone: string
  notes: string
  createdAt: string
  isDeleted: boolean
}

export type PackageItem = {
  assetTypeId: string
  quantity: number
}

export type PricingPackage = {
  id: string
  name: string
  hourlyRatePaise: number
  status: PackageStatus
  imagePath: string | null
  items: PackageItem[]
}

export type SessionAsset = {
  id: string
  sessionId: string
  assetId: string
  assetTypeId: string
  assetNameSnapshot: string
  assetCodeSnapshot: string
  allocatedAt: string
  releasedAt: string | null
}

export type SessionCharge = {
  sessionId: string
  packageId: string | null
  packageName: string
  hourlyRatePaise: number
  billingIncrementMinutes: number
  minimumDurationMinutes: number
  roundingMode: RoundingMode
  rawDurationSeconds: number
  billedDurationSeconds: number
  computedAmountPaise: number
  overrideAmountPaise: number | null
  overrideReason: string
  finalAmountPaise: number
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod | null
}

export type GamingSession = {
  id: string
  customerId: string | null
  walkInName: string | null
  status: SessionStatus
  pricingPackageId: string | null
  packageNameSnapshot: string
  hourlyRatePaise: number
  billingIncrementMinutes: number
  minimumDurationMinutes: number
  roundingMode: RoundingMode
  startedAt: string
  endedAt: string | null
  extensionCount: number
  clientRequestId: string
  notes: string
}

export type BusinessSettings = {
  name: string
  tagline: string
  currencyCode: string
  currencySymbol: string
  timezone: string
  billingIncrementMinutes: number
  minimumDurationMinutes: number
  roundingMode: RoundingMode
  openTime: string
  closeTime: string
  closesNextDay: boolean
  warningYellowPercent: number
  warningOrangePercent: number
  warningRedPercent: number
  warningFirstPeriodMinutes: number
  warningExtendMinutes: number
}

export type AppData = {
  settings: BusinessSettings
  assetTypes: AssetType[]
  assets: Asset[]
  customers: Customer[]
  packages: PricingPackage[]
  sessions: GamingSession[]
  sessionAssets: SessionAsset[]
  charges: SessionCharge[]
}

export type Role = 'admin' | 'employee'

export type AuthUser = {
  email: string
  name: string
  role: Role
}
