import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

function App() {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      console.log('Loading contacts...')
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .limit(10)
      
      if (error) throw error
      
      setContacts(data || [])
      console.log('Loaded contacts:', data)
    } catch (err: any) {
      console.error('Error loading contacts:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Contact Manager (No Auth)</h1>
        
        {loading && (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}
          </div>
        )}
        
        {!loading && !error && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium mb-4">
                Contacts ({contacts.length})
              </h2>
              
              {contacts.length === 0 ? (
                <p className="text-gray-500">No contacts found</p>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="border-b pb-3 last:border-b-0">
                      <div className="font-medium">{contact.full_name || 'No name'}</div>
                      <div className="text-sm text-gray-600">
                        {contact.email && <span className="mr-4">{contact.email}</span>}
                        {contact.phone && <span>{contact.phone}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-8 text-sm text-gray-500">
          <p>This is a test version without authentication.</p>
          <p>Supabase URL: {supabase.supabaseUrl}</p>
        </div>
      </div>
    </div>
  )
}

export default App