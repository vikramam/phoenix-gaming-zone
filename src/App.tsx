import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { isAdmin } from './lib/access'
import { useAuthReady, useAuthUser } from './lib/use-store'
import { ActivePage } from './pages/active-page'
import { AssetsPage } from './pages/assets-page'
import { BusinessPage } from './pages/business-page'
import { CustomersPage } from './pages/customers-page'
import { FloorPage } from './pages/floor-page'
import { HistoryPage } from './pages/history-page'
import { LoginPage } from './pages/login-page'
import { PricingPage } from './pages/pricing-page'
import { ReportsPage } from './pages/reports-page'

function AuthSplash() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#050910] text-sm text-muted">
      Checking operator session…
    </div>
  )
}

function RequireAuth() {
  const ready = useAuthReady()
  const user = useAuthUser()
  if (!ready) return <AuthSplash />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireAdmin() {
  const ready = useAuthReady()
  const user = useAuthUser()
  if (!ready) return <AuthSplash />
  if (!isAdmin(user)) return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<FloorPage />} />
          <Route path="/active" element={<ActivePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/setup/assets" element={<AssetsPage />} />
            <Route path="/setup/pricing" element={<PricingPage />} />
            <Route path="/setup/business" element={<BusinessPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
