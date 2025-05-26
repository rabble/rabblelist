import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function DatabaseDump() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function loadEverything() {
      console.log('🔥 LOADING ALL DATA FROM DATABASE...')
      
      try {
        // Load contacts
        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('*')
        
        // Load organizations  
        const { data: orgs, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          
        // Load users
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          
        // Load events
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('*')
          
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        setData({
          contacts: contacts || [],
          contactsError,
          organizations: orgs || [],
          orgsError,
          users: users || [],
          usersError,
          events: events || [],
          eventsError,
          currentUser: user
        })
        
        setError({
          contacts: contactsError,
          orgs: orgsError,
          users: usersError,
          events: eventsError
        })
        
      } catch (err) {
        console.error('💥 TOTAL FAILURE:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    
    loadEverything()
  }, [])

  if (loading) return <div className="p-4">LOADING DATABASE...</div>

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔥 RAW DATABASE DUMP</h1>
      
      <div className="mb-8 p-4 bg-yellow-100 border-2 border-yellow-500 rounded">
        <h2 className="font-bold mb-2">Current User:</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(data.currentUser, null, 2)}
        </pre>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-2">
            CONTACTS ({data.contacts?.length || 0} records)
            {data.contactsError && <span className="text-red-500 ml-2">ERROR!</span>}
          </h2>
          {data.contactsError && (
            <div className="bg-red-100 p-2 mb-2">
              ERROR: {JSON.stringify(data.contactsError)}
            </div>
          )}
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            <pre className="text-xs">{JSON.stringify(data.contacts, null, 2)}</pre>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">
            ORGANIZATIONS ({data.organizations?.length || 0} records)
            {data.orgsError && <span className="text-red-500 ml-2">ERROR!</span>}
          </h2>
          {data.orgsError && (
            <div className="bg-red-100 p-2 mb-2">
              ERROR: {JSON.stringify(data.orgsError)}
            </div>
          )}
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            <pre className="text-xs">{JSON.stringify(data.organizations, null, 2)}</pre>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">
            USERS ({data.users?.length || 0} records)
            {data.usersError && <span className="text-red-500 ml-2">ERROR!</span>}
          </h2>
          {data.usersError && (
            <div className="bg-red-100 p-2 mb-2">
              ERROR: {JSON.stringify(data.usersError)}
            </div>
          )}
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            <pre className="text-xs">{JSON.stringify(data.users, null, 2)}</pre>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">
            EVENTS ({data.events?.length || 0} records)
            {data.eventsError && <span className="text-red-500 ml-2">ERROR!</span>}
          </h2>
          {data.eventsError && (
            <div className="bg-red-100 p-2 mb-2">
              ERROR: {JSON.stringify(data.eventsError)}
            </div>
          )}
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            <pre className="text-xs">{JSON.stringify(data.events, null, 2)}</pre>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-red-100 border-2 border-red-500 rounded">
        <h2 className="font-bold mb-2">ALL ERRORS:</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    </div>
  )
}