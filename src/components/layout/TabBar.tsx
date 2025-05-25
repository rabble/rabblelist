import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, Phone, Calendar, Settings } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'

export function TabBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  if (!user) return null

  const tabs = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/contacts', label: 'Contacts', icon: Users },
    { path: '/contacts/queue', label: 'Queue', icon: Phone },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/admin', label: 'Admin', icon: Settings, adminOnly: true },
  ]

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || user.role === 'admin')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {visibleTabs.map(tab => {
          const isActive = location.pathname === tab.path || 
            (tab.path !== '/' && location.pathname.startsWith(tab.path))
          
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center flex-1 h-full py-2"
            >
              <tab.icon 
                className={`w-6 h-6 mb-1 ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-xs ${
                isActive ? 'text-blue-600 font-medium' : 'text-gray-400'
              }`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}