import { useAuth } from '@/features/auth/AuthContext'
import { LogOut, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (!user) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 h-14">
        <h1 className="text-lg font-semibold text-gray-900">
          Contact Manager
        </h1>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600">
                {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
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
                  <p className="font-semibold text-gray-900">{user.full_name}</p>
                  <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                </div>
                
                <div className="p-2">
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
    </header>
  )
}