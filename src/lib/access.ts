import type { AuthUser, Role } from './types'

export type ShopAccount = {
  email: string
  password: string
  name: string
  role: Role
}

export const SHOP_ACCOUNTS: ShopAccount[] = [
  {
    email: 'owner@phoenix.local',
    password: 'phoenix',
    name: 'Owner',
    role: 'admin',
  },
  {
    email: 'staff@phoenix.local',
    password: 'phoenix',
    name: 'Staff',
    role: 'employee',
  },
  {
    email: 'operator@phoenix.local',
    password: 'phoenix',
    name: 'Owner',
    role: 'admin',
  },
]

export function accountForEmail(email: string) {
  const trimmed = email.trim().toLowerCase()
  return SHOP_ACCOUNTS.find((account) => account.email === trimmed) ?? null
}

export function roleForEmail(email: string): Role {
  return accountForEmail(email)?.role === 'employee' ? 'employee' : 'admin'
}

export function hydrateAuthUser(raw: Partial<AuthUser> & { email: string; name: string }): AuthUser {
  const role = raw.role === 'employee' || raw.role === 'admin' ? raw.role : roleForEmail(raw.email)
  return {
    email: raw.email,
    name: raw.name,
    role,
  }
}

export function isAdmin(user: AuthUser | null | undefined) {
  return user?.role === 'admin'
}

export function canEditCustomers(user: AuthUser | null | undefined) {
  return isAdmin(user)
}

export function canAccessReports(user: AuthUser | null | undefined) {
  return isAdmin(user)
}

export function canAccessSetup(user: AuthUser | null | undefined) {
  return isAdmin(user)
}

export function roleLabel(user: AuthUser | null | undefined) {
  if (user?.role === 'employee') return 'Employee'
  if (user?.role === 'admin') return 'Admin'
  return 'Operator'
}
