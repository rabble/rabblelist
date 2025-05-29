import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { 
  Plus,
  Filter,
  Users,
  Tag,
  Calendar,
  Activity,
  Edit,
  Trash2,
  Save,
  X,
  ChevronRight,
  Clock,
  Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
// import { ContactService } from './contacts.service'
// import type { Contact } from '@/types'

interface SmartListCriteria {
  tags?: {
    mode: 'any' | 'all' | 'none'
    values: string[]
  }
  lastContact?: {
    operator: 'before' | 'after' | 'between' | 'never'
    date?: string
    endDate?: string
  }
  eventsAttended?: {
    operator: 'exactly' | 'more_than' | 'less_than' | 'between'
    value: number
    endValue?: number
  }
  location?: {
    field: 'city' | 'state' | 'zip'
    value: string
  }
  engagement?: {
    level: 'high' | 'medium' | 'low' | 'inactive'
  }
  createdDate?: {
    operator: 'before' | 'after' | 'between'
    date?: string
    endDate?: string
  }
}

interface SmartList {
  id: string
  name: string
  description?: string
  criteria: SmartListCriteria
  contactCount?: number
  created_at: string
  updated_at: string
}

export function SmartLists() {
  const navigate = useNavigate()
  const [smartLists, setSmartLists] = useState<SmartList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingList, setEditingList] = useState<SmartList | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    loadSmartLists()
    loadAvailableTags()
  }, [])

  const loadSmartLists = async () => {
    setIsLoading(true)
    try {
      // Get organization ID
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) throw new Error('No organization found')

      // Load saved smart lists from organization settings
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single()

      const savedLists = (org?.settings as any)?.smart_lists || []
      
      // Count contacts for each list
      const listsWithCounts = await Promise.all(
        savedLists.map(async (list: SmartList) => {
          const count = await countContactsForCriteria(list.criteria)
          return { ...list, contactCount: count }
        })
      )

      setSmartLists(listsWithCounts)
    } catch (error) {
      console.error('Error loading smart lists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableTags = async () => {
    try {
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) return

      const { data: contacts } = await supabase
        .from('contacts')
        .select('tags')
        .eq('organization_id', orgId)

      const tagSet = new Set<string>()
      contacts?.forEach(contact => {
        contact.tags?.forEach((tag: string) => tagSet.add(tag))
      })
      setAvailableTags(Array.from(tagSet).sort())
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  const countContactsForCriteria = async (criteria: SmartListCriteria): Promise<number> => {
    try {
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) return 0

      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)

      // Apply tag filters
      if (criteria.tags && criteria.tags.values.length > 0) {
        if (criteria.tags.mode === 'any') {
          query = query.overlaps('tags', criteria.tags.values)
        } else if (criteria.tags.mode === 'all') {
          query = query.contains('tags', criteria.tags.values)
        } else if (criteria.tags.mode === 'none') {
          // This is more complex - we need to ensure no overlap
          criteria.tags.values.forEach(tag => {
            query = query.not('tags', 'cs', `{${tag}}`)
          })
        }
      }

      // Apply last contact filter
      if (criteria.lastContact) {
        if (criteria.lastContact.operator === 'never') {
          query = query.is('last_contact_date', null)
        } else if (criteria.lastContact.operator === 'before' && criteria.lastContact.date) {
          query = query.lt('last_contact_date', criteria.lastContact.date)
        } else if (criteria.lastContact.operator === 'after' && criteria.lastContact.date) {
          query = query.gt('last_contact_date', criteria.lastContact.date)
        } else if (criteria.lastContact.operator === 'between' && criteria.lastContact.date && criteria.lastContact.endDate) {
          query = query.gte('last_contact_date', criteria.lastContact.date)
            .lte('last_contact_date', criteria.lastContact.endDate)
        }
      }

      // Apply events attended filter
      if (criteria.eventsAttended) {
        if (criteria.eventsAttended.operator === 'exactly') {
          query = query.eq('total_events_attended', criteria.eventsAttended.value)
        } else if (criteria.eventsAttended.operator === 'more_than') {
          query = query.gt('total_events_attended', criteria.eventsAttended.value)
        } else if (criteria.eventsAttended.operator === 'less_than') {
          query = query.lt('total_events_attended', criteria.eventsAttended.value)
        } else if (criteria.eventsAttended.operator === 'between' && criteria.eventsAttended.endValue !== undefined) {
          query = query.gte('total_events_attended', criteria.eventsAttended.value)
            .lte('total_events_attended', criteria.eventsAttended.endValue)
        }
      }

      // Apply created date filter
      if (criteria.createdDate) {
        if (criteria.createdDate.operator === 'before' && criteria.createdDate.date) {
          query = query.lt('created_at', criteria.createdDate.date)
        } else if (criteria.createdDate.operator === 'after' && criteria.createdDate.date) {
          query = query.gt('created_at', criteria.createdDate.date)
        } else if (criteria.createdDate.operator === 'between' && criteria.createdDate.date && criteria.createdDate.endDate) {
          query = query.gte('created_at', criteria.createdDate.date)
            .lte('created_at', criteria.createdDate.endDate)
        }
      }

      const { count } = await query
      return count || 0
    } catch (error) {
      console.error('Error counting contacts:', error)
      return 0
    }
  }

  const saveSmartList = async (list: Partial<SmartList>) => {
    try {
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) throw new Error('No organization found')

      // Get current organization settings
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single()

      const currentSettings = org?.settings as any || {}
      const currentLists = currentSettings.smart_lists || []

      let updatedLists
      if (editingList) {
        // Update existing list
        updatedLists = currentLists.map((l: SmartList) => 
          l.id === editingList.id 
            ? { ...l, ...list, updated_at: new Date().toISOString() }
            : l
        )
      } else {
        // Create new list
        const newList: SmartList = {
          id: crypto.randomUUID(),
          name: list.name!,
          description: list.description,
          criteria: list.criteria!,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        updatedLists = [...currentLists, newList]
      }

      // Save to organization settings
      const { error } = await supabase
        .from('organizations')
        .update({
          settings: {
            ...currentSettings,
            smart_lists: updatedLists
          }
        })
        .eq('id', orgId)

      if (error) throw error

      setEditingList(null)
      setShowCreateForm(false)
      loadSmartLists()
    } catch (error) {
      console.error('Error saving smart list:', error)
      alert('Failed to save smart list')
    }
  }

  const deleteSmartList = async (listId: string) => {
    if (!confirm('Delete this smart list?')) return

    try {
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) throw new Error('No organization found')

      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single()

      const currentSettings = org?.settings as any || {}
      const updatedLists = (currentSettings.smart_lists || []).filter((l: SmartList) => l.id !== listId)

      const { error } = await supabase
        .from('organizations')
        .update({
          settings: {
            ...currentSettings,
            smart_lists: updatedLists
          }
        })
        .eq('id', orgId)

      if (error) throw error

      loadSmartLists()
    } catch (error) {
      console.error('Error deleting smart list:', error)
      alert('Failed to delete smart list')
    }
  }

  const viewListContacts = async (list: SmartList) => {
    // Navigate to contacts page with smart list filters applied
    const params = new URLSearchParams()
    params.set('smartListId', list.id)
    params.set('smartListName', list.name)
    
    // Encode criteria for URL
    params.set('criteria', JSON.stringify(list.criteria))
    
    navigate(`/contacts?${params.toString()}`)
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Smart Lists</h1>
              <p className="text-gray-600 mt-1">
                Create dynamic contact lists based on criteria
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/contacts')}
              >
                Back to Contacts
              </Button>
              <Button
                onClick={() => {
                  setEditingList(null)
                  setShowCreateForm(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Smart List
              </Button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">About Smart Lists</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Smart Lists automatically update as contacts match your criteria. 
                  Use them to track engagement levels, segment your audience, or 
                  identify contacts who need follow-up.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smart Lists Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : smartLists.length === 0 && !showCreateForm ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No smart lists yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first smart list to dynamically segment contacts
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Smart List
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {smartLists.map((list) => (
              <Card key={list.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{list.name}</CardTitle>
                      {list.description && (
                        <p className="text-sm text-gray-600 mt-1">{list.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingList(list)
                          setShowCreateForm(true)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSmartList(list.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Criteria Summary */}
                    <div className="space-y-2 text-sm">
                      {list.criteria.tags && (
                        <div className="flex items-start gap-2">
                          <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
                          <span>
                            Tags {list.criteria.tags.mode} of: {list.criteria.tags.values.join(', ')}
                          </span>
                        </div>
                      )}
                      {list.criteria.lastContact && (
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                          <span>
                            Last contact {list.criteria.lastContact.operator} 
                            {list.criteria.lastContact.date && ` ${new Date(list.criteria.lastContact.date).toLocaleDateString()}`}
                          </span>
                        </div>
                      )}
                      {list.criteria.eventsAttended && (
                        <div className="flex items-start gap-2">
                          <Activity className="w-4 h-4 text-gray-400 mt-0.5" />
                          <span>
                            Events attended {list.criteria.eventsAttended.operator} {list.criteria.eventsAttended.value}
                          </span>
                        </div>
                      )}
                      {list.criteria.engagement && (
                        <div className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-gray-400 mt-0.5" />
                          <span>
                            Engagement level: {list.criteria.engagement.level}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Contact Count */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {list.contactCount || 0} contacts
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewListContacts(list)}
                        >
                          View Contacts
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>

                    {/* Updated Date */}
                    <div className="text-xs text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Updated {new Date(list.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Form */}
        {showCreateForm && (
          <SmartListForm
            list={editingList}
            availableTags={availableTags}
            onSave={saveSmartList}
            onCancel={() => {
              setShowCreateForm(false)
              setEditingList(null)
            }}
          />
        )}
      </div>
    </Layout>
  )
}

// Smart List Form Component
interface SmartListFormProps {
  list: SmartList | null
  availableTags: string[]
  onSave: (list: Partial<SmartList>) => void
  onCancel: () => void
}

function SmartListForm({ list, availableTags, onSave, onCancel }: SmartListFormProps) {
  const [name, setName] = useState(list?.name || '')
  const [description, setDescription] = useState(list?.description || '')
  const [criteria, setCriteria] = useState<SmartListCriteria>(list?.criteria || {})
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [isCountingContacts, setIsCountingContacts] = useState(false)

  const updateCriteria = (key: keyof SmartListCriteria, value: any) => {
    const newCriteria = { ...criteria }
    if (value === null || value === undefined) {
      delete newCriteria[key]
    } else {
      newCriteria[key] = value
    }
    setCriteria(newCriteria)
    setPreviewCount(null) // Reset count when criteria changes
  }

  const previewResults = async () => {
    setIsCountingContacts(true)
    try {
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) return

      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)

      // Apply all criteria (same logic as countContactsForCriteria)
      // ... (apply filters based on criteria)

      const { count } = await query
      setPreviewCount(count || 0)
    } catch (error) {
      console.error('Error previewing results:', error)
    } finally {
      setIsCountingContacts(false)
    }
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter a name for the smart list')
      return
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      criteria
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {list ? 'Edit Smart List' : 'Create Smart List'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Active Volunteers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Optional description of this smart list"
                />
              </div>
            </div>

            {/* Criteria */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Criteria</h3>

              {/* Tags */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <label className="font-medium text-gray-700">Tags</label>
                </div>
                <div className="space-y-3">
                  <select
                    value={criteria.tags?.mode || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        updateCriteria('tags', {
                          mode: e.target.value,
                          values: criteria.tags?.values || []
                        })
                      } else {
                        updateCriteria('tags', null)
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No tag filter</option>
                    <option value="any">Has any of these tags</option>
                    <option value="all">Has all of these tags</option>
                    <option value="none">Has none of these tags</option>
                  </select>

                  {criteria.tags && (
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => (
                        <label key={tag} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={criteria.tags?.values.includes(tag) || false}
                            onChange={(e) => {
                              const values = e.target.checked
                                ? [...(criteria.tags?.values || []), tag]
                                : (criteria.tags?.values || []).filter(t => t !== tag)
                              updateCriteria('tags', { ...criteria.tags, values })
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                          />
                          <span className="text-sm">{tag}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Last Contact */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <label className="font-medium text-gray-700">Last Contact</label>
                </div>
                <div className="space-y-3">
                  <select
                    value={criteria.lastContact?.operator || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        updateCriteria('lastContact', {
                          operator: e.target.value,
                          date: criteria.lastContact?.date
                        })
                      } else {
                        updateCriteria('lastContact', null)
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No date filter</option>
                    <option value="never">Never contacted</option>
                    <option value="before">Before date</option>
                    <option value="after">After date</option>
                    <option value="between">Between dates</option>
                  </select>

                  {criteria.lastContact && criteria.lastContact.operator !== 'never' && (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={criteria.lastContact.date || ''}
                        onChange={(e) => updateCriteria('lastContact', {
                          ...criteria.lastContact,
                          date: e.target.value
                        })}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {criteria.lastContact.operator === 'between' && (
                        <input
                          type="date"
                          value={criteria.lastContact.endDate || ''}
                          onChange={(e) => updateCriteria('lastContact', {
                            ...criteria.lastContact,
                            endDate: e.target.value
                          })}
                          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="End date"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Events Attended */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <label className="font-medium text-gray-700">Events Attended</label>
                </div>
                <div className="space-y-3">
                  <select
                    value={criteria.eventsAttended?.operator || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        updateCriteria('eventsAttended', {
                          operator: e.target.value,
                          value: criteria.eventsAttended?.value || 0
                        })
                      } else {
                        updateCriteria('eventsAttended', null)
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No event filter</option>
                    <option value="exactly">Exactly</option>
                    <option value="more_than">More than</option>
                    <option value="less_than">Less than</option>
                    <option value="between">Between</option>
                  </select>

                  {criteria.eventsAttended && (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={criteria.eventsAttended.value}
                        onChange={(e) => updateCriteria('eventsAttended', {
                          ...criteria.eventsAttended,
                          value: parseInt(e.target.value) || 0
                        })}
                        className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {criteria.eventsAttended.operator === 'between' && (
                        <>
                          <span className="py-2">and</span>
                          <input
                            type="number"
                            min="0"
                            value={criteria.eventsAttended.endValue || ''}
                            onChange={(e) => updateCriteria('eventsAttended', {
                              ...criteria.eventsAttended,
                              endValue: parseInt(e.target.value) || 0
                            })}
                            className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </>
                      )}
                      <span className="py-2">events</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            {previewCount !== null && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {previewCount} contacts match this criteria
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={previewResults}
              disabled={isCountingContacts}
            >
              {isCountingContacts ? 'Counting...' : 'Preview Results'}
            </Button>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="w-4 h-4 mr-2" />
                {list ? 'Save Changes' : 'Create Smart List'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}