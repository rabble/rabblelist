import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { 
  Users,
  Search,
  Merge,
  ChevronRight,
  AlertTriangle,
  Check,
  X,
  Phone,
  Mail,
  Calendar,
  Tag
} from 'lucide-react'
import type { Contact } from '@/types'

interface DuplicateGroup {
  id: string
  contacts: Contact[]
  matchType: 'exact' | 'similar'
  matchField: string
}

export function ContactDeduplication() {
  const navigate = useNavigate()
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    findDuplicates()
  }, [])

  const findDuplicates = async () => {
    setIsLoading(true)
    try {
      // Get organization ID
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) throw new Error('No organization found')

      // Fetch all contacts
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Find duplicates
      const duplicateGroups: DuplicateGroup[] = []
      const processed = new Set<string>()

      // Check for exact phone matches
      const phoneMap = new Map<string, Contact[]>()
      contacts?.forEach(contact => {
        if (contact.phone && !processed.has(contact.id)) {
          const normalizedPhone = contact.phone.replace(/\D/g, '')
          if (!phoneMap.has(normalizedPhone)) {
            phoneMap.set(normalizedPhone, [])
          }
          phoneMap.get(normalizedPhone)!.push(contact)
        }
      })

      phoneMap.forEach((group, phone) => {
        if (group.length > 1) {
          duplicateGroups.push({
            id: `phone-${phone}`,
            contacts: group,
            matchType: 'exact',
            matchField: 'phone'
          })
          group.forEach(c => processed.add(c.id))
        }
      })

      // Check for exact email matches (excluding already processed)
      const emailMap = new Map<string, Contact[]>()
      contacts?.forEach(contact => {
        if (contact.email && !processed.has(contact.id)) {
          const normalizedEmail = contact.email.toLowerCase().trim()
          if (!emailMap.has(normalizedEmail)) {
            emailMap.set(normalizedEmail, [])
          }
          emailMap.get(normalizedEmail)!.push(contact)
        }
      })

      emailMap.forEach((group, email) => {
        if (group.length > 1) {
          duplicateGroups.push({
            id: `email-${email}`,
            contacts: group,
            matchType: 'exact',
            matchField: 'email'
          })
          group.forEach(c => processed.add(c.id))
        }
      })

      // Check for similar names (excluding already processed)
      const nameGroups = new Map<string, Contact[]>()
      contacts?.forEach(contact => {
        if (!processed.has(contact.id)) {
          // Normalize name for comparison
          const normalized = contact.full_name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
          
          // Check for existing similar names
          let found = false
          nameGroups.forEach((group, key) => {
            if (!found && areSimilarNames(normalized, key)) {
              group.push(contact)
              found = true
            }
          })
          
          if (!found) {
            nameGroups.set(normalized, [contact])
          }
        }
      })

      nameGroups.forEach((group) => {
        if (group.length > 1) {
          duplicateGroups.push({
            id: `name-${group[0].id}`,
            contacts: group,
            matchType: 'similar',
            matchField: 'name'
          })
        }
      })

      setDuplicates(duplicateGroups)
    } catch (error) {
      console.error('Error finding duplicates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const areSimilarNames = (name1: string, name2: string): boolean => {
    // Simple similarity check - can be improved with Levenshtein distance
    if (name1 === name2) return true
    
    // Check if one contains the other
    if (name1.includes(name2) || name2.includes(name1)) return true
    
    // Check if they start similarly (first 5 chars)
    if (name1.length >= 5 && name2.length >= 5) {
      return name1.substring(0, 5) === name2.substring(0, 5)
    }
    
    return false
  }

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const selectGroup = (groupId: string) => {
    const newSelected = new Set(selectedGroups)
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId)
    } else {
      newSelected.add(groupId)
    }
    setSelectedGroups(newSelected)
  }

  const mergeContacts = async (group: DuplicateGroup, primaryId: string) => {
    setIsProcessing(true)
    try {
      const primary = group.contacts.find(c => c.id === primaryId)
      if (!primary) return

      const others = group.contacts.filter(c => c.id !== primaryId)

      // Merge data into primary contact
      let mergedData: Partial<Contact> = { ...primary }

      others.forEach(contact => {
        // Merge tags
        const allTags = new Set([...(mergedData.tags || []), ...(contact.tags || [])])
        mergedData.tags = Array.from(allTags)

        // Merge custom fields
        mergedData.custom_fields = {
          ...(mergedData.custom_fields || {}),
          ...(contact.custom_fields || {})
        }

        // Use most recent contact date
        if (contact.last_contact_date && (!mergedData.last_contact_date || 
            new Date(contact.last_contact_date) > new Date(mergedData.last_contact_date))) {
          mergedData.last_contact_date = contact.last_contact_date
        }

        // Add events attended
        mergedData.total_events_attended = (mergedData.total_events_attended || 0) + 
                                         (contact.total_events_attended || 0)

        // Fill in missing fields
        if (!mergedData.email && contact.email) mergedData.email = contact.email
        if (!mergedData.address && contact.address) mergedData.address = contact.address
      })

      // Update primary contact
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          tags: mergedData.tags,
          custom_fields: mergedData.custom_fields,
          last_contact_date: mergedData.last_contact_date,
          total_events_attended: mergedData.total_events_attended,
          email: mergedData.email,
          address: mergedData.address
        })
        .eq('id', primaryId)

      if (updateError) throw updateError

      // Update references in other tables
      for (const contact of others) {
        // Update call logs
        await supabase
          .from('call_logs')
          .update({ contact_id: primaryId })
          .eq('contact_id', contact.id)

        // Update event participants
        await supabase
          .from('event_participants')
          .update({ contact_id: primaryId })
          .eq('contact_id', contact.id)

        // Update call assignments
        await supabase
          .from('call_assignments')
          .update({ contact_id: primaryId })
          .eq('contact_id', contact.id)
      }

      // Delete duplicate contacts
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .in('id', others.map(c => c.id))

      if (deleteError) throw deleteError

      // Refresh duplicates
      await findDuplicates()
    } catch (error) {
      console.error('Error merging contacts:', error)
      alert('Failed to merge contacts')
    } finally {
      setIsProcessing(false)
    }
  }

  const mergeSelectedGroups = async () => {
    if (!confirm(`Merge ${selectedGroups.size} duplicate groups? This cannot be undone.`)) {
      return
    }

    setIsProcessing(true)
    try {
      for (const groupId of selectedGroups) {
        const group = duplicates.find(g => g.id === groupId)
        if (group) {
          // Use the oldest contact as primary (first created)
          const primaryContact = group.contacts[0]
          await mergeContacts(group, primaryContact.id)
        }
      }
      setSelectedGroups(new Set())
    } catch (error) {
      console.error('Error in batch merge:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Duplicate Contacts
              </h1>
              <p className="text-gray-600 mt-1">
                Found {duplicates.length} potential duplicate groups
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/contacts')}
              >
                Back to Contacts
              </Button>
              {selectedGroups.size > 0 && (
                <Button
                  onClick={mergeSelectedGroups}
                  disabled={isProcessing}
                >
                  <Merge className="w-4 h-4 mr-2" />
                  Merge {selectedGroups.size} Groups
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Info Card */}
        {duplicates.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">About Merging</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    When merging duplicates, all data is combined into the oldest contact. 
                    Call logs, event attendance, and assignments are preserved. 
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Duplicate Groups */}
        {duplicates.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No duplicates found
                </h3>
                <p className="text-gray-600">
                  All contacts appear to be unique
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {duplicates.map((group) => (
              <Card key={group.id}>
                <CardHeader className="cursor-pointer" onClick={() => toggleGroup(group.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedGroups.has(group.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          selectGroup(group.id)
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <CardTitle className="text-base">
                          {group.contacts.length} contacts with matching {group.matchField}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {group.matchType === 'exact' ? 'Exact match' : 'Similar match'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight 
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedGroups.has(group.id) ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </CardHeader>

                {expandedGroups.has(group.id) && (
                  <CardContent>
                    <div className="space-y-3">
                      {group.contacts.map((contact, index) => (
                        <div
                          key={contact.id}
                          className="p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900">
                                  {contact.full_name}
                                </h4>
                                {index === 0 && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                    Oldest (Primary)
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Phone className="w-4 h-4" />
                                  {contact.phone}
                                </div>
                                
                                {contact.email && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="w-4 h-4" />
                                    {contact.email}
                                  </div>
                                )}
                                
                                {contact.last_contact_date && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    Last contact: {new Date(contact.last_contact_date).toLocaleDateString()}
                                  </div>
                                )}
                                
                                {contact.tags.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-gray-600" />
                                    <div className="flex flex-wrap gap-1">
                                      {contact.tags.map(tag => (
                                        <span
                                          key={tag}
                                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-xs text-gray-500 mt-2">
                                Created: {new Date(contact.created_at).toLocaleDateString()}
                              </p>
                            </div>

                            {index !== 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => mergeContacts(group, group.contacts[0].id)}
                                disabled={isProcessing}
                              >
                                Merge into Primary
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => {
                          const primary = window.prompt(
                            'Enter the name of the contact to keep as primary:',
                            group.contacts[0].full_name
                          )
                          const selected = group.contacts.find(
                            c => c.full_name.toLowerCase() === primary?.toLowerCase()
                          )
                          if (selected) {
                            mergeContacts(group, selected.id)
                          }
                        }}
                        disabled={isProcessing}
                      >
                        <Merge className="w-4 h-4 mr-2" />
                        Choose Primary & Merge
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}