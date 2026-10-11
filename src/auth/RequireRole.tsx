import { Navigate, Outlet, useLocation } from 'react-router'
import { FullScreenLoader } from '../components/Status'
import type { Role } from '../types'
import { useAuth } from './AuthContext'
import { homeFor } from './paths'

/** Renders child routes only for a logged-in user with the given role. */
export function RequireRole({ role }: { role: Role }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return <Outlet />
}
