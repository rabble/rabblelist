import { useState, useEffect } from 'react'

// Simple contact manager that just works
function App() {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
      }
    } catch (error) {
      console.error('Error:', error)
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
      }
    } catch (error) {
      console.error('Error:', error)
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Simple Contact Manager</h1>
        
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
            <h2 className="text-xl font-semibold">
              Contacts ({contacts.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No contacts yet. Add one above!
            </div>
          ) : (
            <div className="divide-y">
              {contacts.map((contact) => (
                <div key={contact.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-medium">{contact.full_name || 'No name'}</div>
                    <div className="text-sm text-gray-600">
                      {contact.email && <span className="mr-4">{contact.email}</span>}
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
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