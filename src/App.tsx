import { useState, useEffect } from 'react'

// Simple contact manager that just works
function App() {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newContact, setNewContact] = useState({ full_name: '', email: '', phone: '', tags: '' })
  const [selectedTags, setSelectedTags] = useState<string[]>([])

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
          full_name: newContact.full_name,
          email: newContact.email,
          phone: newContact.phone,
          organization_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          status: 'active',
          tags: newContact.tags.split(',').map(t => t.trim()).filter(t => t),
          custom_fields: {}
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setContacts([...contacts, data[0]])
        setNewContact({ full_name: '', email: '', phone: '', tags: '' })
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

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Tags']
    const rows = contacts.map(contact => [
      contact.full_name || '',
      contact.email || '',
      contact.phone || '',
      (contact.tags || []).join('; ')
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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

  // Get all unique tags
  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))]

  // Filter contacts based on search term and selected tags
  const filteredContacts = contacts.filter(contact => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || (
      contact.full_name?.toLowerCase().includes(search) ||
      contact.email?.toLowerCase().includes(search) ||
      contact.phone?.includes(search)
    )
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => contact.tags?.includes(tag))
    
    return matchesSearch && matchesTags
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Simple Contact Manager</h1>
          {contacts.length > 0 && (
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Export CSV
            </button>
          )}
        </div>
        
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
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Name *"
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newContact.full_name}
                onChange={(e) => setNewContact({...newContact, full_name: e.target.value})}
              />
              <input
                type="email"
                placeholder="Email"
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
              />
              <input
                type="tel"
                placeholder="Phone"
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tags (comma separated)"
                className="flex-1 px-3 py-2 border rounded"
                value={newContact.tags}
                onChange={(e) => setNewContact({...newContact, tags: e.target.value})}
              />
              <button
                onClick={addContact}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Contact
              </button>
            </div>
          </div>
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Filter by tags:</span>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags(prev => 
                      prev.includes(tag) 
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    )
                  }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-xl font-semibold">
                Contacts ({filteredContacts.length} of {contacts.length})
              </h2>
              <input
                type="text"
                placeholder="Search contacts..."
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"
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
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          defaultValue={contact.email}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateContact(contact.id, { email: e.currentTarget.value })
                            }
                          }}
                        />
                        <input
                          type="tel"
                          className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          defaultValue={contact.phone}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateContact(contact.id, { phone: e.currentTarget.value })
                            }
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <span className="text-xs text-gray-500 py-1">Press Enter to save changes</span>
                      </div>
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
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="mt-1 flex gap-1 flex-wrap">
                            {contact.tags.map((tag: string) => (
                              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
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