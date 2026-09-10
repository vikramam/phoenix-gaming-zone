import { type FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { FieldLabel, Input } from '@/components/ui/input'
import { SHOP_ACCOUNTS } from '@/lib/access'
import { signIn } from '@/lib/store'
import { useAuthUser } from '@/lib/use-store'
import { cn } from '@/lib/utils'

const demos = SHOP_ACCOUNTS.filter((account) => account.email !== 'operator@phoenix.local')

export function LoginPage() {
  const user = useAuthUser()
  const navigate = useNavigate()
  const [email, setEmail] = useState(demos[0].email)
  const [password, setPassword] = useState(demos[0].password)
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#050910] px-4 py-8 sm:px-8 lg:justify-start lg:px-16 xl:px-24">
      <img
        src="/images/hero/login.webp"
        alt=""
        aria-hidden
        width={1280}
        height={720}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[center_20%] lg:object-[72%_center]"
      />
      <div className="pointer-events-none absolute inset-0 bg-[#050910]/55 lg:bg-transparent lg:bg-gradient-to-r lg:from-[#050910]/70 lg:via-[#050910]/28 lg:to-transparent" />

      <div className="relative w-full max-w-[26rem] rounded-[28px] border border-white/16 bg-[#0b1728]/48 p-6 shadow-[0_30px_80px_rgba(0,6,16,0.45)] backdrop-blur-2xl md:p-8">
        <div className="mb-5 flex justify-center">
          <BrandMark markClassName="!h-16 md:!h-[4.75rem]" />
        </div>
        <div className="mb-6 text-center">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-electric-soft uppercase">
            Play beyond limits
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] uppercase">Operator sign in</h1>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {demos.map((account) => {
            const active = email === account.email
            return (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email)
                  setPassword(account.password)
                  setError('')
                }}
                className={cn(
                  'rounded-xl border px-3 py-2 text-left transition',
                  active ? 'border-electric bg-electric/15' : 'border-white/12 bg-white/5 hover:border-white/25',
                )}
              >
                <div className="text-xs font-extrabold uppercase">
                  {account.role === 'admin' ? 'Owner' : 'Employee'}
                </div>
                <div className="truncate text-[10px] text-muted">{account.email}</div>
              </button>
            )
          })}
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div>
            <FieldLabel>Password</FieldLabel>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-crimson">{error}</p> : null}
          <Button type="submit" className="w-full" size="lg" variant="electric">
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted">
          Owner sees everything. Staff can run the floor, but cannot open reports or setup.
        </p>
        <p className="mt-6 text-center text-sm font-semibold text-gold">See you at the zone</p>
      </div>
    </div>
  )
}
