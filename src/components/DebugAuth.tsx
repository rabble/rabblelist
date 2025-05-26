import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase } from '@/lib/supabase'

export function DebugAuth() {
  const auth = useAuth()
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Checking...')
  
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        // Test if Supabase client is initialized
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        
        console.log('Environment check:', {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          url: supabaseUrl
        })
        
        // Try to get session
        const { data, error } = await supabase.auth.getSession()
        console.log('Session check:', { data, error })
        
        if (error) {
          setSupabaseStatus(`Error: ${error.message}`)
        } else {
          setSupabaseStatus(`Connected - Session: ${data.session ? 'Yes' : 'No'}`)
        }
      } catch (err) {
        console.error('Supabase check error:', err)
        setSupabaseStatus(`Exception: ${err}`)
      }
    }
    
    checkSupabase()
  }, [])
  
  return (
    <div className="fixed top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="font-bold text-lg mb-2">Debug Info</h3>
      <div className="space-y-2 text-sm">
        <div>
          <strong>Auth Loading:</strong> {auth.loading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>User:</strong> {auth.user ? auth.user.email : 'None'}
        </div>
        <div>
          <strong>Profile:</strong> {auth.profile ? 'Loaded' : 'None'}
        </div>
        <div>
          <strong>Supabase:</strong> {supabaseStatus}
        </div>
        <div>
          <strong>Current Path:</strong> {window.location.pathname}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <button
          onClick={() => window.location.href = '/login'}
          className="w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Go to Login
        </button>
        <button
          onClick={() => window.location.reload()}
          className="w-full px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        >
          Reload Page
        </button>
      </div>
    </div>
  )
}