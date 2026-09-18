import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { PageTransition } from './page-transition'
import {
  BarChart3,
  Building2,
  ChevronDown,
  Clock3,
  Gamepad2,
  History,
  LayoutGrid,
  LogOut,
  Package,
  Settings2,
  Tags,
  Users,
} from 'lucide-react'
import { BrandMark } from './brand-mark'
import { canAccessReports, canAccessSetup, roleLabel } from '@/lib/access'
import { useAppData, useAuthUser } from '@/lib/use-store'
import { signOut } from '@/lib/store'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/', label: 'Floor', icon: LayoutGrid, end: true },
  { to: '/active', label: 'Active', icon: Clock3 },
  { to: '/history', label: 'History', icon: History },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

const setupLinks = [
  { to: '/setup/assets', label: 'Assets', icon: Package },
  { to: '/setup/pricing', label: 'Pricing', icon: Tags },
  { to: '/setup/business', label: 'Business', icon: Building2 },
]

export function AppLayout() {
  const data = useAppData()
  const user = useAuthUser()
  const navigate = useNavigate()
  const location = useLocation()
  const activeCount = data.sessions.filter((session) => session.status === 'active').length
  const onSetup = location.pathname.startsWith('/setup')
  const [setupOpen, setSetupOpen] = useState(onSetup)
  const [accountOpen, setAccountOpen] = useState(false)
  const showReports = canAccessReports(user)
  const showSetup = canAccessSetup(user)
  const mainRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 })
    window.scrollTo({ top: 0, left: 0 })
  }, [location.pathname])

  function handleSignOut() {
    setAccountOpen(false)
    void signOut().then(() => navigate('/login'))
  }
  const visibleNav = nav.filter((item) => item.to !== '/reports' || showReports)
  const mobileNav = showSetup
    ? [
        { to: '/', label: 'Floor', icon: Gamepad2, end: true },
        { to: '/active', label: 'Active', icon: Clock3 },
        { to: '/history', label: 'History', icon: History },
        { to: '/customers', label: 'Customers', icon: Users },
        { to: '/reports', label: 'Reports', icon: BarChart3 },
        { to: '/setup/assets', label: 'More', icon: Settings2 },
      ]
    : [
        { to: '/', label: 'Floor', icon: Gamepad2, end: true },
        { to: '/active', label: 'Active', icon: Clock3 },
        { to: '/history', label: 'History', icon: History },
        { to: '/customers', label: 'Customers', icon: Users },
      ]

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-bg text-white lg:block lg:h-auto lg:min-h-svh lg:overflow-visible">
      <div className="pointer-events-none fixed inset-0 blue-grid opacity-60" />

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[220px] flex-col border-r border-line/70 bg-[#0b1b2d]/96 px-3 py-5 backdrop-blur-xl lg:flex print:hidden">
        <div className="relative mb-5 flex justify-center">
          <div className="pointer-events-none absolute inset-[-8px] bg-[radial-gradient(circle_at_center,rgba(35,136,237,0.16),transparent_68%)]" />
          <BrandMark compact className="justify-center" markClassName="relative h-auto w-[7rem] mix-blend-screen" />
        </div>
        <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.18em] text-muted uppercase">Navigation</p>
        <nav className="space-y-1">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              viewTransition
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-white/5 hover:text-white',
                  isActive && 'bg-electric text-white shadow-[0_8px_24px_rgba(35,136,237,0.28)]',
                )
              }
            >
              <item.icon className="size-[18px] shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.label === 'Active' && activeCount > 0 ? (
                <span className="rounded-full bg-white/18 px-2 py-0.5 text-[10px] font-bold text-white">
                  {activeCount}
                </span>
              ) : null}
            </NavLink>
          ))}
          {showSetup ? (
            <div>
              <button
                type="button"
                onClick={() => {
                  const next = !setupOpen
                  setSetupOpen(next)
                  if (next && !onSetup) navigate('/setup/assets', { viewTransition: true })
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-white/5 hover:text-white',
                  onSetup ? 'bg-electric/18 text-white' : 'text-muted',
                )}
              >
                <Settings2 className="size-[18px] shrink-0" />
                <span className="flex-1 text-left">Setup</span>
                <ChevronDown className={cn('size-4 transition', setupOpen && 'rotate-180')} />
              </button>
              {setupOpen ? (
                <div className="mt-1 ml-4 space-y-0.5 border-l border-line/70 pl-2">
                  {setupLinks.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      viewTransition
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-white/5 hover:text-white',
                          isActive && 'bg-electric text-white shadow-[0_8px_24px_rgba(35,136,237,0.28)]',
                        )
                      }
                    >
                      <item.icon className="size-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>
        <div className="mt-auto rounded-2xl border border-line/70 bg-[#10253b] p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-electric/20 text-xs font-extrabold text-electric-soft">
              {(user?.name || 'O').slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="truncate text-xs font-bold capitalize">{user?.name}</div>
              <div className="truncate text-[10px] text-muted">{roleLabel(user)}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden lg:block lg:overflow-visible lg:pl-[220px] print:pl-0">
        <header className="sticky top-0 z-40 shrink-0 border-b border-line/60 bg-bg/80 backdrop-blur-xl print:hidden lg:hidden">
          <div className="flex h-[60px] items-center gap-3 px-3">
            <BrandMark compact />
            <div className="relative ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-line/60 bg-[#0b1b2d] px-2 py-1.5"
                aria-expanded={accountOpen}
                aria-label="Account menu"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-electric text-xs font-bold">
                  {(user?.name || 'O').slice(0, 1).toUpperCase()}
                </span>
                <div className="hidden min-w-0 text-left sm:block">
                  <div className="truncate text-xs font-bold capitalize">{user?.name}</div>
                  <div className="text-[9px] text-muted">{roleLabel(user)}</div>
                </div>
                <ChevronDown className={cn('size-3.5 text-muted transition', accountOpen && 'rotate-180')} />
              </button>
              {accountOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40"
                    aria-label="Close account menu"
                    onClick={() => setAccountOpen(false)}
                  />
                  <div className="menu-enter absolute top-[calc(100%+0.5rem)] right-0 z-50 w-52 rounded-2xl border border-line/70 bg-[#0b1b2d] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
                    <div className="mb-2">
                      <div className="truncate text-sm font-bold capitalize">{user?.name}</div>
                      <div className="text-[11px] text-muted">{roleLabel(user)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted hover:bg-white/5 hover:text-white"
                    >
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </header>

        {showSetup && onSetup ? (
          <div className="flex gap-2 overflow-x-auto border-b border-line/60 px-3 py-2 print:hidden lg:hidden">
            {setupLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                viewTransition
                className={({ isActive }) =>
                  cn(
                    'shrink-0 rounded-xl border px-3 py-1.5 text-sm font-semibold',
                    isActive
                      ? 'border-electric bg-electric text-white'
                      : 'border-line/70 bg-[#0b1b2d]/80 text-muted',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        ) : null}

        <main
          ref={mainRef}
          className="mx-auto min-h-0 w-full max-w-[1500px] flex-1 overflow-y-auto px-3 py-4 lg:overflow-visible md:px-6 md:py-7 md:pb-8"
        >
          <PageTransition />
        </main>

        <nav
          className={cn(
            'z-50 grid shrink-0 border-t border-line bg-bg/95 px-1 pt-1 pb-[calc(0.35rem+env(safe-area-inset-bottom))] backdrop-blur-xl print:hidden lg:hidden',
            mobileNav.length === 6 ? 'grid-cols-6' : mobileNav.length === 5 ? 'grid-cols-5' : 'grid-cols-4',
          )}
        >
          {mobileNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              viewTransition
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-col items-center gap-1 rounded-lg px-0.5 py-2 text-[9px] font-semibold uppercase tracking-wider text-muted sm:text-[10px]',
                  (isActive || (item.to.startsWith('/setup') && onSetup)) && 'text-electric-soft',
                )
              }
            >
              <span className="relative">
                <item.icon className="size-5" />
                {item.to === '/active' && activeCount > 0 ? (
                  <span className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-crimson px-1 text-[9px] leading-4 font-bold text-white">
                    {activeCount}
                  </span>
                ) : null}
              </span>
              <span className="w-full truncate text-center">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
