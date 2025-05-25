import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase, isDemoMode } from '@/lib/supabase'
import { mockDb } from '@/lib/mockData'
import { 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Tag,
  Calendar,
  Edit,
  Trash2,
  Users
} from 'lucide-react'
import type { Contact } from '@/types'

interface FilterOptions {
  tags: string[]
  groups: string[]
  lastContactDate: string
  searchTerm: string
}

export function ContactsManagement() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    tags: [],
    groups: [],
    lastContactDate: '',
    searchTerm: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [filters])

  const loadContacts = async () => {
    try {
      setLoading(true)
      
      if (isDemoMode) {
        const result = await mockDb.contacts.list()
        let filteredContacts = result.data || []
        
        // Apply filters
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase()
          filteredContacts = filteredContacts.filter((c: Contact) => 
            c.full_name.toLowerCase().includes(searchLower) ||
            c.phone.includes(filters.searchTerm) ||
            c.email?.toLowerCase().includes(searchLower)
          )
        }
        
        if (filters.tags.length > 0) {
          filteredContacts = filteredContacts.filter((c: Contact) =>
            filters.tags.some(tag => c.tags.includes(tag))
          )
        }
        
        setContacts(filteredContacts)
      } else {
        let query = supabase
          .from('contacts')
          .select('*')
          .eq('organization_id', user?.organization_id)
          .order('created_at', { ascending: false })
        
        // Apply search filter
        if (filters.searchTerm) {
          query = query.or(`full_name.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`)
        }
        
        // Apply tag filter
        if (filters.tags.length > 0) {
          query = query.contains('tags', filters.tags)
        }
        
        const { data, error } = await query
        
        if (error) throw error
        setContacts(data || [])
      }
    } catch (error) {
      console.error('Failed to load contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId)
      }
      return [...prev, contactId]
    })
  }

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(contacts.map(c => c.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedContacts.length} contacts?`)) return
    
    try {
      if (isDemoMode) {
        // Mock delete
        setContacts(prev => prev.filter(c => !selectedContacts.includes(c.id)))
        setSelectedContacts([])
      } else {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .in('id', selectedContacts)
        
        if (error) throw error
        
        await loadContacts()
        setSelectedContacts([])
      }
    } catch (error) {
      console.error('Failed to delete contacts:', error)
      alert('Failed to delete contacts')
    }
  }

  const handleExport = () => {
    // Convert contacts to CSV
    const csv = [
      ['Name', 'Phone', 'Email', 'Tags', 'Last Contact', 'Notes'],
      ...contacts.map(c => [
        c.full_name,
        c.phone,
        c.email || '',
        c.tags.join('; '),
        c.last_contact_date || '',
        c.notes || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
              <p className="text-gray-600 mt-1">
                Manage your organization's contacts and supporters
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => navigate('/import')}>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button onClick={() => navigate('/contacts/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or email..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-gray-100' : ''}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {(filters.tags.length > 0 || filters.groups.length > 0) && (
                    <span className="ml-2 bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {filters.tags.length + filters.groups.length}
                    </span>
                  )}
                </Button>
                
                <Button variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <select
                      multiple
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={filters.tags}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value)
                        setFilters(prev => ({ ...prev, tags: selected }))
                      }}
                    >
                      <option value="volunteer">Volunteer</option>
                      <option value="donor">Donor</option>
                      <option value="member">Member</option>
                      <option value="leader">Leader</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Groups
                    </label>
                    <select
                      multiple
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={filters.groups}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value)  
                        setFilters(prev => ({ ...prev, groups: selected }))
                      }}
                    >
                      <option value="climate-action">Climate Action</option>
                      <option value="housing-justice">Housing Justice</option>
                      <option value="youth-org">Youth Organizing</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Contact
                    </label>
                    <select
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={filters.lastContactDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, lastContactDate: e.target.value }))}
                    >
                      <option value="">All Time</option>
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                      <option value="never">Never contacted</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({
                      tags: [],
                      groups: [],
                      lastContactDate: '',
                      searchTerm: ''
                    })}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedContacts.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Tag className="w-4 h-4 mr-2" />
                Add Tags
              </Button>
              <Button size="sm" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Assign to Group
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Contacts Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={selectedContacts.length === contacts.length && contacts.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-900">
                      Name
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-900">
                      Contact Info
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-900">
                      Tags
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-900">
                      Last Contact
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => handleSelectContact(contact.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {contact.full_name}
                          </p>
                          {contact.address && (
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {contact.address}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="text-sm flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            {contact.phone}
                          </p>
                          {contact.email && (
                            <p className="text-sm flex items-center">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              {contact.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {contact.last_contact_date ? (
                            <div className="flex items-center text-gray-900">
                              <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                              {new Date(contact.last_contact_date).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-500">Never</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/contacts/${contact.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="p-2"
                            onClick={() => navigate(`/contacts/${contact.id}/edit`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="p-2"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {contacts.length === 0 && (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No contacts found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {filters.searchTerm || filters.tags.length > 0
                      ? 'Try adjusting your filters'
                      : 'Get started by adding your first contact'}
                  </p>
                  {!filters.searchTerm && filters.tags.length === 0 && (
                    <Button onClick={() => navigate('/contacts/new')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contact
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}