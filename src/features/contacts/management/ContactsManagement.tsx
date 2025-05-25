import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useContactStore } from '@/stores/contactStore'
import { 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Phone,
  Mail,
  Calendar,
  Edit,
  Trash2,
  Users,
  X
} from 'lucide-react'

interface FilterOptions {
  tags: string[]
  lastContactDate: string
  searchTerm: string
}

export function ContactsManagement() {
  const navigate = useNavigate()
  const { 
    contacts, 
    totalContacts, 
    isLoadingContacts, 
    loadContacts, 
    deleteContact 
  } = useContactStore()

  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    tags: [],
    lastContactDate: '',
    searchTerm: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // Available tags - in production, this would come from the database
  const availableTags = ['volunteer', 'donor', 'member', 'prospect', 'event_attendee']

  useEffect(() => {
    loadContactsWithFilters()
  }, [filters, currentPage])

  const loadContactsWithFilters = () => {
    loadContacts({
      search: filters.searchTerm,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize
    })
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
    if (!confirm(`Delete ${selectedContacts.length} contact${selectedContacts.length !== 1 ? 's' : ''}?`)) return
    
    try {
      // Delete contacts one by one
      for (const id of selectedContacts) {
        await deleteContact(id)
      }
      setSelectedContacts([])
    } catch (error) {
      console.error('Failed to delete contacts:', error)
      alert('Failed to delete some contacts')
    }
  }

  const handleExport = () => {
    // Convert contacts to CSV
    const csv = [
      ['Name', 'Phone', 'Email', 'Address', 'Tags', 'Last Contact', 'Events Attended'],
      ...contacts.map(c => [
        c.full_name,
        c.phone,
        c.email || '',
        c.address || '',
        c.tags.join('; '),
        c.last_contact_date ? new Date(c.last_contact_date).toLocaleDateString() : '',
        c.total_events_attended.toString()
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatPhone = (phone: string) => {
    // Format phone number for display
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const totalPages = Math.ceil(totalContacts / pageSize)

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contacts</h1>
              <p className="text-gray-600 mt-1">
                {totalContacts} total contacts
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/contacts/import')}>
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Import</span>
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
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.searchTerm}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, searchTerm: e.target.value }))
                      setCurrentPage(1)
                    }}
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
                  {filters.tags.length > 0 && (
                    <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {filters.tags.length}
                    </span>
                  )}
                </Button>
                
                {contacts.length > 0 && (
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                )}
              </div>
            </div>
            
            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => (
                        <label key={tag} className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            checked={filters.tags.includes(tag)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters(prev => ({ ...prev, tags: [...prev.tags, tag] }))
                              } else {
                                setFilters(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
                              }
                              setCurrentPage(1)
                            }}
                          />
                          <span className="text-sm text-gray-700 capitalize">
                            {tag.replace('_', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilters({
                          tags: [],
                          lastContactDate: '',
                          searchTerm: ''
                        })
                        setCurrentPage(1)
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedContacts([])}
              >
                <X className="w-4 h-4 mr-2" />
                Clear
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

        {/* Loading State */}
        {isLoadingContacts ? (
          <Card>
            <CardContent className="p-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </CardContent>
          </Card>
        ) : contacts.length === 0 ? (
          // Empty State
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No contacts found
                </h3>
                <p className="text-gray-600 mb-6">
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
            </CardContent>
          </Card>
        ) : (
          // Contacts Table
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedContacts.length === contacts.length && contacts.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-900">
                      Name
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-900 hidden sm:table-cell">
                      Contact Info
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-900 hidden md:table-cell">
                      Tags
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-900 hidden lg:table-cell">
                      Last Contact
                    </th>
                    <th className="p-4 text-right text-sm font-medium text-gray-900">
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
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => handleSelectContact(contact.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {contact.full_name}
                          </p>
                          <div className="sm:hidden text-sm text-gray-500 mt-1">
                            {formatPhone(contact.phone)}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <div className="space-y-1">
                          <a 
                            href={`tel:${contact.phone}`}
                            className="text-sm flex items-center hover:text-blue-600"
                          >
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            {formatPhone(contact.phone)}
                          </a>
                          {contact.email && (
                            <a 
                              href={`mailto:${contact.email}`}
                              className="text-sm flex items-center hover:text-blue-600"
                            >
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              {contact.email}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                            >
                              {tag}
                            </span>
                          ))}
                          {contact.tags.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-600">
                              +{contact.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
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
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/contacts/${contact.id}`)}
                          >
                            View
                          </Button>
                          <div className="relative group">
                            <Button
                              size="sm"
                              variant="outline"
                              className="p-2"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                              <button
                                className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                                onClick={() => navigate(`/contacts/${contact.id}/edit`)}
                              >
                                <Edit className="w-4 h-4 inline mr-2" />
                                Edit
                              </button>
                              <button
                                className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                                onClick={() => navigate(`/contacts/queue?contact=${contact.id}`)}
                              >
                                <Phone className="w-4 h-4 inline mr-2" />
                                Call
                              </button>
                              <hr className="my-1" />
                              <button
                                className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 text-left"
                                onClick={async () => {
                                  if (confirm(`Delete ${contact.full_name}?`)) {
                                    await deleteContact(contact.id)
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 inline mr-2" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                    {Math.min(currentPage * pageSize, totalContacts)} of{' '}
                    {totalContacts} contacts
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </Layout>
  )
}