import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useContactStore } from '@/stores/contactStore'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft,
  Users,
  Search,
  UserPlus,
  Check,
  X,
  Filter,
  Tag,
  MapPin,
  Calendar
} from 'lucide-react'

interface Group {
  id: string
  name: string
  description?: string
}

interface ExistingMember {
  contact_id: string
}

export function GroupAddMembers() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { contacts, loadContacts } = useContactStore()
  
  const [group, setGroup] = useState<Group | null>(null)
  const [existingMembers, setExistingMembers] = useState<ExistingMember[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTag, setFilterTag] = useState<string>('all')
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      
      // Load group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single()
      
      if (groupError) throw groupError
      setGroup(groupData)
      
      // Load existing members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('contact_id')
        .eq('group_id', id)
      
      if (membersError) throw membersError
      setExistingMembers(membersData || [])
      
      // Load contacts
      await loadContacts({ limit: 1000 })
      
      // Extract unique tags
      const tags = new Set<string>()
      contacts.forEach(contact => {
        contact.tags?.forEach(tag => tags.add(tag))
      })
      setAvailableTags(Array.from(tags))
    } catch (error) {
      console.error('Failed to load data:', error)
      alert('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMembers = async () => {
    if (!id || selectedContacts.length === 0) return
    
    setAdding(true)
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) throw new Error('Not authenticated')
      
      // Prepare member records
      const memberRecords = selectedContacts.map(contactId => ({
        group_id: id,
        contact_id: contactId,
        role: 'member' as const,
        added_by: userData.user.id
      }))
      
      // Insert members
      const { error } = await supabase
        .from('group_members')
        .insert(memberRecords)
      
      if (error) throw error
      
      alert(`Successfully added ${selectedContacts.length} members to the group`)
      navigate(`/groups/${id}/members`)
    } catch (error: any) {
      console.error('Failed to add members:', error)
      if (error.code === '23505') {
        alert('Some contacts are already members of this group')
      } else {
        alert('Failed to add members to group')
      }
    } finally {
      setAdding(false)
    }
  }

  const handleSelectAll = () => {
    const availableContactIds = availableContacts.map(c => c.id)
    setSelectedContacts(availableContactIds)
  }

  const handleDeselectAll = () => {
    setSelectedContacts([])
  }

  // Filter out existing members and apply search/tag filters
  const existingMemberIds = existingMembers.map(m => m.contact_id)
  const availableContacts = contacts.filter(contact => {
    // Exclude existing members
    if (existingMemberIds.includes(contact.id)) return false
    
    // Apply search filter
    const matchesSearch = searchTerm === '' || 
      contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Apply tag filter
    const matchesTag = filterTag === 'all' || 
      (contact.tags && contact.tags.includes(filterTag))
    
    return matchesSearch && matchesTag
  })

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    )
  }

  if (!group) {
    return (
      <Layout>
        <div className="p-6">
          <p>Group not found</p>
          <Button onClick={() => navigate('/groups')} className="mt-4">
            Back to Groups
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/groups/${id}/members`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Members
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add Members to {group.name}</h1>
              <p className="text-gray-600 mt-1">Select contacts to add to this group</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-sm text-gray-600">Available Contacts</span>
                  <p className="text-xl font-bold">{availableContacts.length}</p>
                </div>
                <div className="border-l pl-6">
                  <span className="text-sm text-gray-600">Selected</span>
                  <p className="text-xl font-bold text-primary-600">{selectedContacts.length}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAll}
                  disabled={selectedContacts.length === availableContacts.length}
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeselectAll}
                  disabled={selectedContacts.length === 0}
                >
                  Deselect All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              {availableTags.length > 0 && (
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Tags</option>
                  {availableTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contacts List */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Available Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            {availableContacts.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableContacts.map(contact => (
                  <label
                    key={contact.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedContacts.includes(contact.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedContacts([...selectedContacts, contact.id])
                        } else {
                          setSelectedContacts(selectedContacts.filter(id => id !== contact.id))
                        }
                      }}
                      className="mr-3"
                    />
                    
                    <div className="flex-1">
                      <p className="font-medium">{contact.full_name}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                        {contact.email && <span>{contact.email}</span>}
                        {contact.phone && <span>{contact.phone}</span>}
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {contact.tags.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {selectedContacts.includes(contact.id) && (
                      <Check className="w-5 h-5 text-primary-600" />
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm || filterTag !== 'all' 
                    ? 'No contacts match your filters' 
                    : 'All contacts are already members of this group'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/groups/${id}/members`)}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleAddMembers}
            disabled={selectedContacts.length === 0 || adding}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {adding ? 'Adding...' : `Add ${selectedContacts.length} Members`}
          </Button>
        </div>
      </div>
    </Layout>
  )
}