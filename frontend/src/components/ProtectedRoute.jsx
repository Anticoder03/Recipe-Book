import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/authContext'

export default function ProtectedRoute() {
  const { user, checking } = useAuth()
  const location = useLocation()

  if (checking) {
    return (
      <p className="rb-loading" role="status">
        Checking your account…
      </p>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
