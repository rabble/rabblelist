import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'

export function SimpleDebug() {
  const { user, profile, loading: authLoading } = useAuth()
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function testQueries() {
      try {
        console.log('SimpleDebug: Starting tests...')
        
        // Test 1: Simple contacts query
        console.log('Test 1: Querying contacts...')
        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('*')
          .limit(3)
        
        // Test 2: Organizations
        console.log('Test 2: Querying organizations...')
        const { data: orgs, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
        
        // Test 3: Users
        console.log('Test 3: Querying users...')
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .limit(3)
        
        setData({
          contacts: { data: contacts, error: contactsError },
          organizations: { data: orgs, error: orgsError },
          users: { data: users, error: usersError }
        })
        
        setError({
          contacts: contactsError,
          organizations: orgsError,
          users: usersError
        })
        
      } catch (err) {
        console.error('SimpleDebug error:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    
    if (!authLoading) {
      testQueries()
    }
  }, [authLoading])

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Simple Debug Page</h1>
      
      <div className="mb-4 p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Auth Status</h2>
        <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
        <p>User ID: {user?.id || 'None'}</p>
        <p>User Email: {user?.email || 'None'}</p>
        <p>Profile: {profile ? 'Loaded' : 'Not loaded'}</p>
        <p>Profile Role: {profile?.role || 'None'}</p>
      </div>
      
      <div className="mb-4 p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Query Status</h2>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        {error && <p className="text-red-500">Error: {JSON.stringify(error)}</p>}
      </div>
      
      <div className="space-y-4">
        {Object.entries(data).map(([table, result]: [string, any]) => (
          <div key={table} className="p-4 bg-white rounded shadow">
            <h3 className="text-lg font-semibold mb-2">{table}</h3>
            {result?.error ? (
              <p className="text-red-500">Error: {JSON.stringify(result.error)}</p>
            ) : (
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(result?.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}