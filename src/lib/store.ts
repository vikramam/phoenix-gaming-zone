import type { User } from '@supabase/supabase-js'
import { accountForEmail, hydrateAuthUser } from './access'
import { computeCharge } from './billing'
import { rupeesToPaise } from './money'
import { AUTH_KEY, STORAGE_KEY, createSeedData } from './seed'
import { supabase, supabaseConfigured } from './supabase'
import { nowIso } from './time'
import type {
  AppData,
  Asset,
  AuthUser,
  BusinessSettings,
  Customer,
  GamingSession,
  OperationalStatus,
  PackageStatus,
  PaymentMethod,
  PaymentStatus,
  PricingPackage,
  SessionCharge,
} from './types'
import { createId, slugify } from './utils'

type Listener = () => void

export type StoreError = {
  code:
    | 'asset_conflict'
    | 'package_inactive'
    | 'package_unfulfillable'
    | 'session_not_found'
    | 'already_completed'
    | 'asset_busy'
    | 'customer_busy'
    | 'forbidden'
    | 'invalid'
  message: string
}

export type StartSessionInput = {
  clientRequestId: string
  packageId: string
  assetIds: string[]
  customerName: string
  notes?: string
}

export type CompleteSessionInput = {
  sessionId: string
  overrideAmountPaise?: number | null
  overrideReason?: string
  paymentStatus?: PaymentStatus
  paymentMethod?: PaymentMethod
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

const defaultTypeImages: Record<string, string> = {
  controller: '/images/asset-types/controller.webp',
  'racing-wheel': '/images/asset-types/racing-wheel.webp',
  vr2: '/images/asset-types/vr2.webp',
  ps5: '/images/packages/ps5.webp',
}

function modernImagePath(path: string | null) {
  if (!path) return path
  if (path.startsWith('/images/') && /\.(jpe?g|png)$/i.test(path)) {
    return path.replace(/\.(jpe?g|png)$/i, '.webp')
  }
  return path
}

const defaultPackageNames: Record<string, string> = {
  'pkg-1p': '1 PS5',
  'pkg-2p': '1 PS5 + Extra Controller',
  'pkg-3p': '1 PS5 + 2 Extra Controllers',
  'pkg-4p': '1 PS5 + 3 Extra Controllers',
}

function hydrateCatalog(snapshot: AppData) {
  snapshot.assetTypes = snapshot.assetTypes.map((type) => {
    const imagePath = modernImagePath(type.imagePath) || defaultTypeImages[type.slug] || type.imagePath
    return { ...type, imagePath }
  })
  snapshot.packages = snapshot.packages.map((pkg) => {
    const imagePath = modernImagePath(pkg.imagePath)
    const nextName = defaultPackageNames[pkg.id]
    if (nextName && (pkg.name === '1 Player' || pkg.name === '2 Players' || pkg.name === '3 Players' || pkg.name === '4 Players')) {
      return { ...pkg, name: nextName, imagePath }
    }
    return { ...pkg, imagePath }
  })
  if (!snapshot.packages.some((pkg) => pkg.id === 'pkg-vr')) {
    const ps5 = snapshot.assetTypes.find((type) => type.slug === 'ps5')
    const vr = snapshot.assetTypes.find((type) => type.slug === 'vr2')
    if (ps5 && vr) {
      const wheelIndex = snapshot.packages.findIndex((pkg) => pkg.id === 'pkg-wheel-vr')
      const vrPackage = {
        id: 'pkg-vr',
        name: '1 PS5 + VR2',
        hourlyRatePaise: rupeesToPaise(150),
        status: 'active' as const,
        imagePath: '/images/packages/ps5-vr2.webp',
        items: [
          { assetTypeId: ps5.id, quantity: 1 },
          { assetTypeId: vr.id, quantity: 1 },
        ],
      }
      if (wheelIndex >= 0) {
        snapshot.packages.splice(wheelIndex, 0, vrPackage)
      } else {
        snapshot.packages.push(vrPackage)
      }
    }
  }
  snapshot.settings = {
    ...snapshot.settings,
    warningYellowPercent: snapshot.settings.warningYellowPercent ?? 90,
    warningOrangePercent: snapshot.settings.warningOrangePercent ?? 95,
    warningRedPercent: snapshot.settings.warningRedPercent ?? 100,
    warningFirstPeriodMinutes:
      snapshot.settings.warningFirstPeriodMinutes ?? snapshot.settings.minimumDurationMinutes ?? 60,
    warningExtendMinutes:
      snapshot.settings.warningExtendMinutes ?? snapshot.settings.billingIncrementMinutes ?? 30,
    snackCokePaise: snapshot.settings.snackCokePaise ?? 4000,
    snackChipsPaise: snapshot.settings.snackChipsPaise ?? 2000,
  }
  snapshot.sessions = snapshot.sessions.map((session) => ({
    ...session,
    extensionCount: session.extensionCount ?? 0,
    snacksAmountPaise: session.snacksAmountPaise ?? 0,
  }))
  snapshot.charges = (snapshot.charges ?? []).map((charge) => ({
    ...charge,
    snacksAmountPaise: charge.snacksAmountPaise ?? 0,
  }))
  snapshot.customers = snapshot.customers.map((customer) => ({
    ...customer,
    isDeleted: Boolean(customer.isDeleted),
  }))
  snapshot.assets = snapshot.assets.map((asset) => ({
    ...asset,
    isDeleted: Boolean(asset.isDeleted),
  }))
  return snapshot
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedData()
    const parsed = JSON.parse(raw) as AppData
    if (!parsed.settings || !Array.isArray(parsed.assets)) return createSeedData()
    return hydrateCatalog(parsed)
  } catch {
    return createSeedData()
  }
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

type OperatorProfileRow = {
  email: string
  name: string
  role: string
}

function loadAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed.email || !parsed.name) return null
    return hydrateAuthUser(parsed)
  } catch {
    return null
  }
}

function fallbackUserFromAuth(user: User): AuthUser {
  const metadataName = user.user_metadata?.name
  return {
    email: user.email ?? '',
    name: typeof metadataName === 'string' && metadataName ? metadataName : user.email?.split('@')[0] || 'Operator',
    role: 'employee',
  }
}

async function profileForUser(user: User): Promise<AuthUser> {
  if (!supabase) return fallbackUserFromAuth(user)
  const { data, error } = await supabase
    .from('operator_profiles')
    .select('email,name,role')
    .eq('id', user.id)
    .maybeSingle()
  if (error) {
    if (error.code === '42P01' || error.message.toLowerCase().includes('operator_profiles')) {
      throw new Error('Operator profiles table is missing. Run supabase/migrations/0002_operator_profiles.sql in the SQL editor.')
    }
    throw new Error(error.message)
  }
  const row = data as OperatorProfileRow | null
  if (!row) return fallbackUserFromAuth(user)
  return {
    email: row.email || fallbackUserFromAuth(user).email,
    name: row.name || fallbackUserFromAuth(user).name,
    role: row.role === 'admin' ? 'admin' : 'employee',
  }
}

function signInErrorMessage(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login')) return 'Wrong email or password.'
  if (lower.includes('email not confirmed')) return 'Confirm this email in Supabase Authentication → Users first.'
  return message
}

function requireAdmin(action: string) {
  if (auth?.role !== 'admin') {
    throw { code: 'forbidden', message: `Only the owner can ${action}.` } satisfies StoreError
  }
}

let data = loadData()
let auth = supabaseConfigured ? null : loadAuth()
let authReady = !supabaseConfigured
const listeners = new Set<Listener>()
let applyingRemote = false
let lastRemoteUpdatedAt = ''
let remoteWriteTimer: ReturnType<typeof setTimeout> | undefined
let shopChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null

function emitAuth() {
  for (const listener of listeners) listener()
}

function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false
  const row = value as Partial<AppData>
  return Boolean(row.settings && Array.isArray(row.assets) && Array.isArray(row.sessions))
}

function notify() {
  data = { ...data }
  saveData(data)
  for (const listener of listeners) listener()
}

function applyRemoteShop(snapshot: AppData, updatedAt: string) {
  applyingRemote = true
  lastRemoteUpdatedAt = updatedAt
  data = hydrateCatalog(snapshot)
  notify()
  applyingRemote = false
}

async function pushShopState() {
  if (!supabase || !auth || applyingRemote) return
  const { data: sessionData } = await supabase.auth.getSession()
  const { data: row, error } = await supabase
    .from('shop_state')
    .upsert({
      id: 'default',
      data,
      updated_at: new Date().toISOString(),
      updated_by: sessionData.session?.user.id ?? null,
    })
    .select('updated_at')
    .single()
  if (!error && row?.updated_at) lastRemoteUpdatedAt = row.updated_at as string
}

function scheduleShopPush() {
  if (applyingRemote || !supabase || !auth || typeof window === 'undefined') return
  window.clearTimeout(remoteWriteTimer)
  remoteWriteTimer = window.setTimeout(() => {
    void pushShopState()
  }, 250)
}

async function pullShopState() {
  if (!supabase || !auth) return
  const { data: row, error } = await supabase
    .from('shop_state')
    .select('data, updated_at')
    .eq('id', 'default')
    .maybeSingle()
  if (error || !row || !isAppData(row.data)) {
    await pushShopState()
    return
  }
  const remote = hydrateCatalog(row.data)
  const remoteActive = remote.sessions.filter((session) => session.status === 'active').length
  const localActive = data.sessions.filter((session) => session.status === 'active').length
  if (remoteActive === 0 && localActive > 0) {
    await pushShopState()
    return
  }
  applyRemoteShop(remote, row.updated_at as string)
}

function subscribeShopState() {
  if (!supabase || shopChannel) return
  shopChannel = supabase
    .channel('shop-state')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'shop_state', filter: 'id=eq.default' },
      (payload) => {
        const next = payload.new as { data?: unknown; updated_at?: string } | null
        if (!next?.updated_at || next.updated_at === lastRemoteUpdatedAt || !isAppData(next.data)) return
        applyRemoteShop(hydrateCatalog(next.data), next.updated_at)
      },
    )
    .subscribe()
}

function unsubscribeShopState() {
  if (!supabase || !shopChannel) return
  void supabase.removeChannel(shopChannel)
  shopChannel = null
}

async function syncShopAfterAuth() {
  await pullShopState()
  subscribeShopState()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        data = JSON.parse(event.newValue) as AppData
        for (const listener of listeners) listener()
      } catch {
        /* ignore bad payloads */
      }
    }
    if (!supabaseConfigured && event.key === AUTH_KEY) {
      auth = loadAuth()
      for (const listener of listeners) listener()
    }
  })
}

async function hydrateSupabaseAuth() {
  if (!supabase) {
    authReady = true
    emitAuth()
    return
  }
  const { data: sessionData } = await supabase.auth.getSession()
  if (sessionData.session?.user) {
    try {
      auth = await profileForUser(sessionData.session.user)
    } catch {
      auth = fallbackUserFromAuth(sessionData.session.user)
    }
  }
  authReady = true
  emitAuth()
  if (auth) void syncShopAfterAuth()
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return
    if (!session?.user) {
      auth = null
      unsubscribeShopState()
      emitAuth()
      return
    }
    try {
      auth = await profileForUser(session.user)
    } catch {
      auth = fallbackUserFromAuth(session.user)
    }
    emitAuth()
    void syncShopAfterAuth()
  })
}

void hydrateSupabaseAuth()

function emit() {
  // Consumers read this snapshot through useSyncExternalStore, which bails out
  // on reference equality, so every change has to produce a fresh object.
  notify()
  scheduleShopPush()
}

export function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getData() {
  return data
}

export function getAuth() {
  return auth
}

export function getAuthReady() {
  return authReady
}

export async function signIn(email: string, password: string) {
  if (supabase) {
    const { data: sessionData, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error || !sessionData.user) {
      throw new Error(signInErrorMessage(error?.message ?? 'Could not sign in.'))
    }
    auth = await profileForUser(sessionData.user)
    emitAuth()
    await syncShopAfterAuth()
    return
  }
  const account = accountForEmail(email)
  if (!account || account.password !== password) {
    throw new Error('Unknown account. Use the owner or staff login.')
  }
  auth = { email: account.email, name: account.name, role: account.role }
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
  emitAuth()
}

export async function signOut() {
  unsubscribeShopState()
  if (supabase) {
    await supabase.auth.signOut()
  }
  auth = null
  localStorage.removeItem(AUTH_KEY)
  emitAuth()
}

export function occupiedAssetIds(snapshot: AppData = data) {
  const ids = new Set<string>()
  for (const row of snapshot.sessionAssets) {
    if (!row.releasedAt) ids.add(row.assetId)
  }
  return ids
}

export function isAllocatable(asset: Asset, occupied: Set<string>) {
  return !asset.isDeleted && asset.operationalStatus === 'available' && !occupied.has(asset.id)
}

export function sessionDisplayName(session: GamingSession, snapshot: AppData = data) {
  if (session.customerId) {
    const customer = snapshot.customers.find((row) => row.id === session.customerId)
    if (customer) return customer.name
  }
  return session.walkInName || 'Walk-in'
}

export function assetsForSession(sessionId: string, snapshot: AppData = data) {
  return snapshot.sessionAssets.filter((row) => row.sessionId === sessionId)
}

export function activeSessionForAsset(assetId: string, snapshot: AppData = data) {
  const allocation = snapshot.sessionAssets.find(
    (row) => row.assetId === assetId && !row.releasedAt,
  )
  if (!allocation) return null
  return snapshot.sessions.find((row) => row.id === allocation.sessionId) ?? null
}

function countByType(assetIds: string[], snapshot: AppData) {
  const counts = new Map<string, number>()
  for (const id of assetIds) {
    const asset = snapshot.assets.find((row) => row.id === id)
    if (!asset) continue
    counts.set(asset.assetTypeId, (counts.get(asset.assetTypeId) ?? 0) + 1)
  }
  return counts
}

export function packageMatchesAssets(pkg: PricingPackage, assetIds: string[], snapshot: AppData = data) {
  const counts = countByType(assetIds, snapshot)
  if (pkg.items.length === 0) return false
  if (counts.size !== pkg.items.length) return false
  return pkg.items.every((item) => counts.get(item.assetTypeId) === item.quantity)
}

export function allocatableOfType(typeId: string, occupied: Set<string>, snapshot: AppData = data) {
  return snapshot.assets.filter(
    (asset) => asset.assetTypeId === typeId && isAllocatable(asset, occupied),
  )
}

export function canFulfillPackage(
  pkg: PricingPackage,
  occupied: Set<string>,
  preferredIds: string[] = [],
  snapshot: AppData = data,
) {
  const reserved = new Set<string>()
  const picks: string[] = []
  for (const item of pkg.items) {
    const preferred = preferredIds
      .map((id) => snapshot.assets.find((asset) => asset.id === id))
      .filter((asset): asset is Asset => Boolean(asset))
      .filter(
        (asset) =>
          asset.assetTypeId === item.assetTypeId &&
          isAllocatable(asset, occupied) &&
          !reserved.has(asset.id),
      )
    const rest = allocatableOfType(item.assetTypeId, occupied, snapshot).filter(
      (asset) => !reserved.has(asset.id) && !preferred.some((row) => row.id === asset.id),
    )
    const available = [...preferred, ...rest]
    if (available.length < item.quantity) return null
    for (const asset of available.slice(0, item.quantity)) {
      reserved.add(asset.id)
      picks.push(asset.id)
    }
  }
  return picks
}

function upsertCustomer(name: string, snapshot: AppData) {
  const trimmed = name.trim()
  if (!trimmed) return null
  const existing = snapshot.customers.find(
    (row) => !row.isDeleted && row.name.toLowerCase() === trimmed.toLowerCase(),
  )
  if (existing) return existing.id
  const customer: Customer = {
    id: createId(),
    name: trimmed,
    phone: '',
    notes: '',
    createdAt: nowIso(),
    isDeleted: false,
  }
  snapshot.customers = [customer, ...snapshot.customers]
  return customer.id
}

export function activeSessionForCustomer(customerId: string, snapshot: AppData = data) {
  return snapshot.sessions.find((row) => row.status === 'active' && row.customerId === customerId) ?? null
}

export function startSession(input: StartSessionInput): GamingSession {
  const existing = data.sessions.find((row) => row.clientRequestId === input.clientRequestId)
  if (existing) return existing

  const pkg = data.packages.find((row) => row.id === input.packageId)
  if (!pkg || pkg.status !== 'active') {
    throw { code: 'package_inactive', message: 'That package is not available.' } satisfies StoreError
  }
  if (!packageMatchesAssets(pkg, input.assetIds, data)) {
    throw {
      code: 'package_unfulfillable',
      message: 'Selected equipment does not match the package.',
    } satisfies StoreError
  }

  const occupied = occupiedAssetIds()
  const uniqueIds = [...new Set(input.assetIds)]
  if (uniqueIds.length !== input.assetIds.length) {
    throw { code: 'invalid', message: 'The same asset was selected twice.' } satisfies StoreError
  }

  const chosen: Asset[] = []
  for (const id of uniqueIds) {
    const asset = data.assets.find((row) => row.id === id)
    if (!asset || !isAllocatable(asset, occupied)) {
      throw {
        code: 'asset_conflict',
        message: `${asset?.name ?? 'An asset'} is not available.`,
      } satisfies StoreError
    }
    chosen.push(asset)
  }

  const trimmedName = input.customerName.trim()
  if (trimmedName) {
    const existingCustomer = data.customers.find(
      (row) => !row.isDeleted && row.name.toLowerCase() === trimmedName.toLowerCase(),
    )
    if (existingCustomer) {
      const live = activeSessionForCustomer(existingCustomer.id, data)
      if (live) {
        const station = assetsForSession(live.id, data)
          .map((row) => row.assetNameSnapshot)
          .join(', ')
        throw {
          code: 'customer_busy',
          message: `${existingCustomer.name} already has an active session${station ? ` on ${station}` : ''}. End it before starting another.`,
        } satisfies StoreError
      }
    }
  }

  const customerId = upsertCustomer(input.customerName, data)
  const walkInName = customerId ? null : 'Walk-in'
  const startedAt = nowIso()
  const session: GamingSession = {
    id: createId(),
    customerId,
    walkInName,
    status: 'active',
    pricingPackageId: pkg.id,
    packageNameSnapshot: pkg.name,
    hourlyRatePaise: pkg.hourlyRatePaise,
    billingIncrementMinutes: data.settings.billingIncrementMinutes,
    minimumDurationMinutes: data.settings.minimumDurationMinutes,
    roundingMode: data.settings.roundingMode,
    startedAt,
    endedAt: null,
    extensionCount: 0,
    snacksAmountPaise: 0,
    clientRequestId: input.clientRequestId,
    notes: input.notes ?? '',
  }

  data.sessions = [session, ...data.sessions]
  data.sessionAssets = [
    ...chosen.map((asset) => ({
      id: createId(),
      sessionId: session.id,
      assetId: asset.id,
      assetTypeId: asset.assetTypeId,
      assetNameSnapshot: asset.name,
      assetCodeSnapshot: asset.code,
      allocatedAt: startedAt,
      releasedAt: null,
    })),
    ...data.sessionAssets,
  ]
  emit()
  return session
}

export function previewComplete(sessionId: string, at = nowIso()): SessionCharge | null {
  const session = data.sessions.find((row) => row.id === sessionId)
  if (!session) return null
  const existing = data.charges.find((row) => row.sessionId === sessionId)
  if (existing) return existing
  return computeCharge({
    sessionId,
    packageId: session.pricingPackageId,
    packageName: session.packageNameSnapshot,
    hourlyRatePaise: session.hourlyRatePaise,
    incrementMinutes: session.billingIncrementMinutes,
    minimumMinutes: session.minimumDurationMinutes,
    roundingMode: session.roundingMode,
    startedAt: session.startedAt,
    endedAt: session.endedAt ?? at,
    snacksAmountPaise: session.snacksAmountPaise ?? 0,
  })
}

export function completeSession(input: CompleteSessionInput): SessionCharge {
  const session = data.sessions.find((row) => row.id === input.sessionId)
  if (!session) {
    throw { code: 'session_not_found', message: 'Session not found.' } satisfies StoreError
  }
  const existing = data.charges.find((row) => row.sessionId === session.id)
  if (session.status === 'completed' && existing) return existing

  const endedAt = nowIso()
  const charge = computeCharge({
    sessionId: session.id,
    packageId: session.pricingPackageId,
    packageName: session.packageNameSnapshot,
    hourlyRatePaise: session.hourlyRatePaise,
    incrementMinutes: session.billingIncrementMinutes,
    minimumMinutes: session.minimumDurationMinutes,
    roundingMode: session.roundingMode,
    startedAt: session.startedAt,
    endedAt,
    overrideAmountPaise: input.overrideAmountPaise,
    overrideReason: input.overrideReason,
    snacksAmountPaise: session.snacksAmountPaise ?? 0,
    paymentStatus: input.paymentStatus,
    paymentMethod: input.paymentMethod,
  })

  data.sessions = data.sessions.map((row) =>
    row.id === session.id ? { ...row, status: 'completed' as const, endedAt } : row,
  )
  data.sessionAssets = data.sessionAssets.map((row) =>
    row.sessionId === session.id && !row.releasedAt ? { ...row, releasedAt: endedAt } : row,
  )
  data.charges = [charge, ...data.charges.filter((row) => row.sessionId !== session.id)]
  emit()
  return charge
}

export function addSessionSnacks(sessionId: string, amountPaise: number) {
  const session = data.sessions.find((row) => row.id === sessionId)
  if (!session || session.status !== 'active') {
    throw { code: 'session_not_found', message: 'Snacks can only be added to an active session.' } satisfies StoreError
  }
  const add = Math.round(amountPaise)
  if (!Number.isFinite(add) || add <= 0) {
    throw { code: 'invalid', message: 'Enter a snack amount greater than zero.' } satisfies StoreError
  }
  data.sessions = data.sessions.map((row) =>
    row.id === session.id
      ? { ...row, snacksAmountPaise: (row.snacksAmountPaise ?? 0) + add }
      : row,
  )
  emit()
}

export function extendSession(sessionId: string) {
  const session = data.sessions.find((row) => row.id === sessionId)
  if (!session || session.status !== 'active') {
    throw { code: 'session_not_found', message: 'Session not found.' } satisfies StoreError
  }
  const extended = { ...session, extensionCount: (session.extensionCount ?? 0) + 1 }
  data.sessions = data.sessions.map((row) => (row.id === session.id ? extended : row))
  emit()
  return extended
}

export function updateSettings(patch: Partial<BusinessSettings>) {
  requireAdmin('change business settings')
  data.settings = { ...data.settings, ...patch }
  emit()
}

export function saveAssetType(input: {
  id?: string
  name: string
  isStation: boolean
  imagePath: string | null
}) {
  requireAdmin('edit asset types')
  const name = input.name.trim()
  if (!name) throw new Error('Asset type name is required.')
  if (input.id) {
    data.assetTypes = data.assetTypes.map((row) =>
      row.id === input.id ? { ...row, name, isStation: input.isStation, imagePath: input.imagePath } : row,
    )
  } else {
    data.assetTypes = [
      ...data.assetTypes,
      {
        id: createId(),
        name,
        slug: slugify(name),
        isStation: input.isStation,
        iconKey: 'joystick',
        imagePath: input.imagePath,
        sortOrder: data.assetTypes.length + 1,
        status: 'active',
      },
    ]
  }
  emit()
}

export function saveAsset(input: {
  id?: string
  assetTypeId: string
  name: string
  code: string
  description: string
  operationalStatus: OperationalStatus
}) {
  requireAdmin('edit assets')
  const name = input.name.trim()
  const code = input.code.trim()
  if (!name || !code) throw new Error('Asset name and code are required.')
  const occupied = occupiedAssetIds()
  if (input.id && occupied.has(input.id) && input.operationalStatus !== 'available') {
    throw { code: 'asset_busy', message: 'End the session before changing this asset.' } satisfies StoreError
  }
  if (input.id) {
    data.assets = data.assets.map((row) =>
      row.id === input.id
        ? {
            ...row,
            assetTypeId: input.assetTypeId,
            name,
            code,
            description: input.description,
            operationalStatus: input.operationalStatus,
            retiredAt: input.operationalStatus === 'retired' ? nowIso() : null,
          }
        : row,
    )
  } else {
    data.assets = [
      ...data.assets,
      {
        id: createId(),
        assetTypeId: input.assetTypeId,
        name,
        code,
        description: input.description,
        operationalStatus: input.operationalStatus,
        retiredAt: input.operationalStatus === 'retired' ? nowIso() : null,
        isDeleted: false,
      },
    ]
  }
  emit()
}

export function savePackage(input: {
  id?: string
  name: string
  hourlyRatePaise: number
  status: PackageStatus
  imagePath: string | null
  items: PricingPackage['items']
}) {
  requireAdmin('edit packages')
  const name = input.name.trim()
  if (!name) throw new Error('Package name is required.')
  if (input.hourlyRatePaise <= 0) throw new Error('Hourly rate must be greater than 0.')
  if (input.items.length === 0) throw new Error('Add at least one required asset type.')
  const next: PricingPackage = {
    id: input.id ?? createId(),
    name,
    hourlyRatePaise: input.hourlyRatePaise,
    status: input.status,
    imagePath: input.imagePath,
    items: input.items,
  }
  if (input.id) {
    data.packages = data.packages.map((row) => (row.id === input.id ? next : row))
  } else {
    data.packages = [...data.packages, next]
  }
  emit()
}

export function saveCustomer(input: { id?: string; name: string; phone: string; notes: string }) {
  requireAdmin('edit customers')
  const name = input.name.trim()
  if (!name) throw new Error('Customer name is required.')
  if (input.id) {
    const current = data.customers.find((row) => row.id === input.id)
    if (!current) throw new Error('Customer not found.')
    const next = { ...current, name, phone: input.phone.trim(), notes: input.notes }
    data.customers = data.customers.map((row) => (row.id === input.id ? next : row))
    emit()
    return next
  }
  const created: Customer = {
    id: createId(),
    name,
    phone: input.phone.trim(),
    notes: input.notes,
    createdAt: nowIso(),
    isDeleted: false,
  }
  data.customers = [created, ...data.customers]
  emit()
  return created
}

export function setCustomerDeleted(customerId: string, isDeleted: boolean) {
  requireAdmin('delete or restore customers')
  const current = data.customers.find((row) => row.id === customerId)
  if (!current) throw new Error('Customer not found.')
  if (isDeleted && activeSessionForCustomer(customerId, data)) {
    throw {
      code: 'customer_busy',
      message: 'End their active session before deleting this customer.',
    } satisfies StoreError
  }
  if (!isDeleted) {
    const clash = data.customers.find(
      (row) =>
        row.id !== customerId &&
        !row.isDeleted &&
        row.name.toLowerCase() === current.name.toLowerCase(),
    )
    if (clash) {
      throw {
        code: 'invalid',
        message: `Another customer already uses the name “${clash.name}”. Rename one before restoring.`,
      } satisfies StoreError
    }
  }
  data.customers = data.customers.map((row) => (row.id === customerId ? { ...row, isDeleted } : row))
  emit()
}

export function setAssetDeleted(assetId: string, isDeleted: boolean) {
  requireAdmin('delete or restore assets')
  const current = data.assets.find((row) => row.id === assetId)
  if (!current) throw new Error('Asset not found.')
  if (isDeleted && occupiedAssetIds().has(assetId)) {
    throw { code: 'asset_busy', message: 'End the session before deleting this asset.' } satisfies StoreError
  }
  data.assets = data.assets.map((row) => (row.id === assetId ? { ...row, isDeleted } : row))
  emit()
}

export function resetDemoData() {
  requireAdmin('reset shop data')
  data = createSeedData()
  emit()
}

export function snapshot() {
  return clone(data)
}
