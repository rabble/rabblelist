import { useAuth } from '@/features/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export function AuthDiagnostic() {
  const auth = useAuth()
  const [diagnostics, setDiagnostics] = useState<Record<string, any>>({})
  
  useEffect(() => {
    const runDiagnostics = async () => {
      const results: Record<string, any> = {}
      
      // Check environment variables
      results.supabaseUrl = import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'
      results.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'
      
      // Check Supabase connection
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          results.supabaseConnection = `❌ Error: ${error.message}`
        } else {
          results.supabaseConnection = '✅ Connected'
          results.hasSession = data.session ? '✅ Yes' : '❌ No'
        }
      } catch (err) {
        results.supabaseConnection = `❌ Exception: ${err}`
      }
      
      // Check auth state
      results.authLoading = auth.loading ? '⏳ Loading...' : '✅ Loaded'
      results.authUser = auth.user ? `✅ ${auth.user.email}` : '❌ No user'
      results.authProfile = auth.profile ? `✅ ${auth.profile.full_name}` : '❌ No profile'
      
      setDiagnostics(results)
    }
    
    runDiagnostics()
  }, [auth])
  
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <h3 className="font-bold text-sm mb-2">Auth Diagnostics</h3>
      <div className="text-xs space-y-1">
        {Object.entries(diagnostics).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-600">{key}:</span>
            <span className="font-mono">{value}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
      >
        Refresh Page
      </button>
    </div>
  )
}