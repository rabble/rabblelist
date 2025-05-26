import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, Megaphone, Calendar, Settings, Activity, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'

// ============================================================================
// Types
// ============================================================================

interface TabConfig {
  path: string
  label: string
  icon: LucideIcon
  adminOnly?: boolean
}

interface TabButtonProps {
  tab: TabConfig
  isActive: boolean
  onClick: () => void
}

// ============================================================================
// Constants
// ============================================================================

const TAB_CONFIGS: TabConfig[] = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/pathways', label: 'Pathways', icon: Target },
  { path: '/engagement', label: 'Engage', icon: Activity },
  { path: '/admin', label: 'Admin', icon: Settings, adminOnly: true },
]

const ACTIVE_STYLES = {
  icon: 'text-blue-600',
  text: 'text-blue-600 font-medium',
  strokeWidth: 2.5
} as const

const INACTIVE_STYLES = {
  icon: 'text-gray-400',
  text: 'text-gray-400',
  strokeWidth: 2
} as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determines if a tab should be highlighted as active based on current path
 */
const isTabActive = (tabPath: string, currentPath: string): boolean => {
  if (tabPath === '/') {
    return currentPath === '/'
  }
  return currentPath === tabPath || currentPath.startsWith(tabPath)
}

/**
 * Filters tabs based on user permissions
 */
const getVisibleTabs = (tabs: TabConfig[], userRole?: string): TabConfig[] => {
  return tabs.filter(tab => !tab.adminOnly || userRole === 'admin')
}

// ============================================================================
// Components
// ============================================================================

/**
 * Individual tab button component
 */
const TabButton = ({ tab, isActive, onClick }: TabButtonProps) => {
  const styles = isActive ? ACTIVE_STYLES : INACTIVE_STYLES
  const Icon = tab.icon

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center flex-1 h-full py-2"
      aria-current={isActive ? 'page' : undefined}
      aria-label={`Navigate to ${tab.label}`}
    >
      <Icon 
        className={`w-6 h-6 mb-1 ${styles.icon}`}
        strokeWidth={styles.strokeWidth}
        aria-hidden="true"
      />
      <span className={`text-xs ${styles.text}`}>
        {tab.label}
      </span>
    </button>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Bottom navigation tab bar component
 * 
 * Features:
 * - Responsive navigation for mobile PWA
 * - Role-based tab visibility (admin-only tabs)
 * - Active state highlighting
 * - Fixed position at bottom of viewport
 * 
 * @example
 * ```tsx
 * // Use within a Router context
 * <Router>
 *   <TabBar />
 * </Router>
 * ```
 */
export function TabBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // Don't render if user is not authenticated
  if (!user) return null

  const visibleTabs = getVisibleTabs(TAB_CONFIGS, user.role)

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {visibleTabs.map(tab => (
          <TabButton
            key={tab.path}
            tab={tab}
            isActive={isTabActive(tab.path, location.pathname)}
            onClick={() => navigate(tab.path)}
          />
        ))}
      </div>
    </nav>
  )
}