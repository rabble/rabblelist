import { useState, useEffect } from 'react'

// Simple contact manager that just works
function App() {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newContact, setNewContact] = useState({ full_name: '', email: '', phone: '' })

  const supabaseUrl = 'https://oxtjonaiubulnggytezf.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94dGpvbmFpdWJ1bG5nZ3l0ZXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxOTM4ODgsImV4cCI6MjA2Mzc2OTg4OH0.9EsXc65D-5qgXLtu48d1E1Bll_AjaCt-a2-oPhZzUQU'

  // Direct fetch to Supabase REST API - no client library needed
  const fetchContacts = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/contacts?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
        setError(null)
      } else {
        setError('Failed to load contacts')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Network error - please try again')
    } finally {
      setLoading(false)
    }
  }

  const addContact = async () => {
    if (!newContact.full_name) return
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/contacts`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...newContact,
          organization_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          status: 'active',
          tags: [],
          custom_fields: {}
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setContacts([...contacts, data[0]])
        setNewContact({ full_name: '', email: '', phone: '' })
        setError(null)
      } else {
        setError('Failed to add contact')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to add contact - please try again')
    }
  }

  const updateContact = async (id: string, updates: any) => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/contacts?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        const data = await response.json()
        setContacts(contacts.map(c => c.id === id ? data[0] : c))
        setEditingId(null)
        setError(null)
      } else {
        setError('Failed to update contact')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to update contact - please try again')
    }
  }

  const deleteContact = async (id: string) => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/contacts?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      })
      
      if (response.ok) {
        setContacts(contacts.filter(c => c.id !== id))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => {
    const search = searchTerm.toLowerCase()
    return (
      contact.full_name?.toLowerCase().includes(search) ||
      contact.email?.toLowerCase().includes(search) ||
      contact.phone?.includes(search)
    )
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Simple Contact Manager</h1>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">✕</button>
          </div>
        )}
        
        {/* Add Contact Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Contact</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Name"
              className="flex-1 px-3 py-2 border rounded"
              value={newContact.full_name}
              onChange={(e) => setNewContact({...newContact, full_name: e.target.value})}
            />
            <input
              type="email"
              placeholder="Email"
              className="flex-1 px-3 py-2 border rounded"
              value={newContact.email}
              onChange={(e) => setNewContact({...newContact, email: e.target.value})}
            />
            <input
              type="tel"
              placeholder="Phone"
              className="flex-1 px-3 py-2 border rounded"
              value={newContact.phone}
              onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
            />
            <button
              onClick={addContact}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Contacts ({filteredContacts.length} of {contacts.length})
              </h2>
              <input
                type="text"
                placeholder="Search contacts..."
                className="px-3 py-1 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'No contacts match your search' : 'No contacts yet. Add one above!'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="p-4 hover:bg-gray-50">
                  {editingId === contact.id ? (
                    // Edit mode
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 px-2 py-1 border rounded"
                        defaultValue={contact.full_name}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateContact(contact.id, { full_name: e.currentTarget.value })
                          } else if (e.key === 'Escape') {
                            setEditingId(null)
                          }
                        }}
                        autoFocus
                      />
                      <input
                        type="email"
                        className="flex-1 px-2 py-1 border rounded"
                        defaultValue={contact.email}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateContact(contact.id, { email: e.currentTarget.value })
                          }
                        }}
                      />
                      <input
                        type="tel"
                        className="flex-1 px-2 py-1 border rounded"
                        defaultValue={contact.phone}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateContact(contact.id, { phone: e.currentTarget.value })
                          }
                        }}
                      />
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center justify-between">
                      <div onClick={() => setEditingId(contact.id)} className="cursor-pointer flex-1">
                        <div className="font-medium">{contact.full_name || 'No name'}</div>
                        <div className="text-sm text-gray-600">
                          {contact.email && <span className="mr-4">{contact.email}</span>}
                          {contact.phone && <span>{contact.phone}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(contact.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteContact(contact.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App