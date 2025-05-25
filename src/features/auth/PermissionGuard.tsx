import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

type Role = 'admin' | 'ringer' | 'viewer'

interface PermissionGuardProps {
  children: React.ReactNode
  requiredRole?: Role
  allowedRoles?: Role[]
  fallback?: React.ReactNode
}

export function PermissionGuard({ 
  children, 
  requiredRole, 
  allowedRoles,
  fallback 
}: PermissionGuardProps) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  // Check if user has required role
  const hasPermission = (() => {
    if (requiredRole) {
      // Admin can access everything
      if (profile.role === 'admin') return true
      // Check specific role
      return profile.role === requiredRole
    }
    
    if (allowedRoles) {
      return allowedRoles.includes(profile.role)
    }
    
    // No specific role required
    return true
  })()

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Hook to check permissions programmatically
export function usePermissions() {
  const { profile } = useAuth()
  
  const hasRole = (role: Role): boolean => {
    if (!profile) return false
    if (profile.role === 'admin') return true // Admin has all permissions
    return profile.role === role
  }
  
  const hasAnyRole = (roles: Role[]): boolean => {
    if (!profile) return false
    if (profile.role === 'admin') return true // Admin has all permissions
    return roles.includes(profile.role)
  }
  
  const canEdit = (): boolean => {
    return hasAnyRole(['admin', 'ringer'])
  }
  
  const canDelete = (): boolean => {
    return hasRole('admin')
  }
  
  const canManageUsers = (): boolean => {
    return hasRole('admin')
  }
  
  const canManageOrganization = (): boolean => {
    return hasRole('admin')
  }
  
  return {
    hasRole,
    hasAnyRole,
    canEdit,
    canDelete,
    canManageUsers,
    canManageOrganization,
    isAdmin: profile?.role === 'admin',
    isRinger: profile?.role === 'ringer',
    isViewer: profile?.role === 'viewer',
  }
}