import { Header } from './Header'
import { TabBar } from './TabBar'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, Megaphone, Settings, Activity, Target } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()
  
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/contacts', label: 'Contacts', icon: Users },
    { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
    { path: '/pathways', label: 'Pathways', icon: Target },
    { path: '/engagement', label: 'Engagement', icon: Activity },
    { path: '/admin', label: 'Admin', icon: Settings, adminOnly: true },
  ]
  
  const visibleNavItems = navItems.filter(item => 
    !item.adminOnly || profile?.role === 'admin'
  )
  
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path)
  
  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      <Header />
      
      {/* Desktop sidebar navigation */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-40 md:w-56 md:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto bg-white border-r border-gray-200 pt-14">
          <nav className="flex flex-1 flex-col p-4 space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${active 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="pt-14 pb-16 md:pb-0 md:pl-56 min-h-screen bg-gray-50">
        {children}
      </main>
      
      {/* Mobile tab bar */}
      <div className="md:hidden">
        <TabBar />
      </div>
    </div>
  )
}