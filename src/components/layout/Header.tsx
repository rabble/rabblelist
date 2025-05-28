import { useAuth } from '@/features/auth/AuthContext'
import { LogOut, ChevronDown, Megaphone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { OrganizationSwitcher } from '@/features/auth/OrganizationSwitcher'
import { SyncStatusIndicator } from '@/features/sync/SyncStatusIndicator'

export function Header() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  // Show a basic header even without full auth
  if (!user) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center space-x-2">
            <Megaphone className="h-5 w-5 text-primary-600" />
            <span className="text-lg font-semibold text-gray-900">Rise.Protest.net</span>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center space-x-2">
          <Megaphone className="h-5 w-5 text-primary-600" />
          <span className="text-lg font-semibold text-gray-900">Rise.Protest.net</span>
        </div>
        
        <div className="flex items-center gap-4">
          <SyncStatusIndicator />
          <OrganizationSwitcher />
          
          <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-600">
                {profile?.full_name ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg overflow-hidden z-50 border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <p className="font-semibold text-gray-900">{profile?.full_name || 'User'}</p>
                  <p className="text-sm text-gray-500 capitalize">{profile?.role || 'viewer'}</p>
                </div>
                
                <div className="p-2">
                  <button
                    onClick={() => {
                      navigate('/about')
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-gray-900">About rise.protest.net</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span className="text-gray-900">Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </header>
  )
}