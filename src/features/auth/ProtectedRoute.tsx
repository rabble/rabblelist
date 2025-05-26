import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Array<'admin' | 'ringer' | 'viewer'>
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  // Only show loading for a reasonable amount of time
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user exists but no profile, just let them through with limited access
  // Don't break the whole fucking app
  if (allowedRoles && allowedRoles.length > 0) {
    // Only check roles if we have a profile
    const userRole = profile?.role || 'viewer' // Default to lowest permission
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  // User is logged in, that's good enough. Let them use the app!
  return <>{children}</>
}