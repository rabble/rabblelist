import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { 
  X, 
  Check, 
  Phone, 
  Mail, 
  MapPin, 
  Tag, 
  Calendar,
  User,
  FileText,
  ArrowRight,
  AlertCircle,
  Loader2,
  Merge
} from 'lucide-react'
import type { Contact } from '@/types'
import { ContactService } from './contacts.service'
import { supabase } from '@/lib/supabase'

interface ContactMergeModalProps {
  contacts: Contact[]
  onClose: () => void
  onMergeComplete: () => void
}

interface MergeSelection {
  field: string
  sourceIndex: number
  value: any
}

export function ContactMergeModal({ contacts, onClose, onMergeComplete }: ContactMergeModalProps) {
  const [primaryIndex, setPrimaryIndex] = useState(0)
  const [selections, setSelections] = useState<Record<string, MergeSelection>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Initialize selections with primary contact's values
  useState(() => {
    const initialSelections: Record<string, MergeSelection> = {
      phone: { field: 'phone', sourceIndex: primaryIndex, value: contacts[primaryIndex].phone },
      email: { field: 'email', sourceIndex: primaryIndex, value: contacts[primaryIndex].email },
      address: { field: 'address', sourceIndex: primaryIndex, value: contacts[primaryIndex].address },
      tags: { field: 'tags', sourceIndex: primaryIndex, value: contacts[primaryIndex].tags }
    }
    setSelections(initialSelections)
  })

  const handleFieldSelection = (field: string, sourceIndex: number, value: any) => {
    setSelections(prev => ({
      ...prev,
      [field]: { field, sourceIndex, value }
    }))
  }

  const mergeTags = () => {
    // Combine all unique tags from all contacts
    const allTags = new Set<string>()
    contacts.forEach(contact => {
      contact.tags?.forEach(tag => allTags.add(tag))
    })
    return Array.from(allTags)
  }

  const mergeCustomFields = () => {
    // Merge all custom fields, with later contacts overriding earlier ones
    let merged = {}
    contacts.forEach(contact => {
      if (contact.custom_fields && typeof contact.custom_fields === 'object') {
        merged = { ...merged, ...contact.custom_fields }
      }
    })
    return merged
  }

  const getFieldValue = (contact: Contact, field: string) => {
    switch (field) {
      case 'phone': return contact.phone
      case 'email': return contact.email || '-'
      case 'address': return contact.address || '-'
      case 'tags': return contact.tags
      case 'last_contact': return contact.last_contact_date
      case 'events_attended': return contact.total_events_attended
      default: return '-'
    }
  }

  const formatFieldValue = (value: any, field: string) => {
    if (!value || value === '-') return <span className="text-gray-400">Not provided</span>
    
    switch (field) {
      case 'tags':
        return (
          <div className="flex flex-wrap gap-1">
            {(value as string[]).map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )
      case 'last_contact':
        return new Date(value).toLocaleDateString()
      default:
        return value
    }
  }

  const performMerge = async () => {
    setIsProcessing(true)
    try {
      const primaryContact = contacts[primaryIndex]
      const otherContacts = contacts.filter((_, idx) => idx !== primaryIndex)

      // Build merged data
      const mergedData: Partial<Contact> = {
        full_name: primaryContact.full_name,
        phone: selections.phone?.value || primaryContact.phone,
        email: selections.email?.value || primaryContact.email || null,
        address: selections.address?.value || primaryContact.address || null,
        tags: mergeTags(),
        custom_fields: mergeCustomFields(),
        last_contact_date: contacts
          .map(c => c.last_contact_date)
          .filter(Boolean)
          .sort()
          .pop() || null,
        total_events_attended: contacts.reduce((sum, c) => sum + (c.total_events_attended || 0), 0)
      }

      // Update primary contact
      const { error: updateError } = await ContactService.updateContact(primaryContact.id, mergedData)
      if (updateError) throw updateError

      // Log the merge in contact_interactions
      await supabase
        .from('contact_interactions')
        .insert({
          contact_id: primaryContact.id,
          organization_id: primaryContact.organization_id,
          type: 'note',
          notes: `Merged ${otherContacts.length} duplicate contact(s): ${otherContacts.map(c => c.full_name).join(', ')}`,
          metadata: {
            merged_ids: otherContacts.map(c => c.id),
            merge_date: new Date().toISOString()
          }
        })

      // Transfer all related records to primary contact
      for (const contact of otherContacts) {
        // Transfer interactions
        await supabase
          .from('contact_interactions')
          .update({ contact_id: primaryContact.id })
          .eq('contact_id', contact.id)

        // Transfer call logs
        await supabase
          .from('call_logs')
          .update({ contact_id: primaryContact.id })
          .eq('contact_id', contact.id)

        // Transfer event registrations
        await supabase
          .from('event_registrations')
          .update({ contact_id: primaryContact.id })
          .eq('contact_id', contact.id)

        // Transfer campaign activities
        await supabase
          .from('campaign_activities')
          .update({ contact_id: primaryContact.id })
          .eq('contact_id', contact.id)

        // Transfer group memberships
        await supabase
          .from('group_members')
          .update({ contact_id: primaryContact.id })
          .eq('contact_id', contact.id)

        // Transfer pathway memberships
        await supabase
          .from('pathway_members')
          .update({ contact_id: primaryContact.id })
          .eq('contact_id', contact.id)
      }

      // Delete duplicate contacts
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .in('id', otherContacts.map(c => c.id))

      if (deleteError) throw deleteError

      onMergeComplete()
    } catch (error) {
      console.error('Error merging contacts:', error)
      alert('Failed to merge contacts. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const fields = [
    { key: 'phone', label: 'Phone', icon: Phone },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'address', label: 'Address', icon: MapPin },
    { key: 'tags', label: 'Tags', icon: Tag, special: 'merge' },
    { key: 'last_contact', label: 'Last Contact', icon: Calendar, readOnly: true },
    { key: 'events_attended', label: 'Events Attended', icon: Calendar, readOnly: true }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Merge Contacts</h2>
              <p className="text-gray-600 mt-1">
                Select which information to keep for the merged contact
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isProcessing}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showConfirmation ? (
            <>
              {/* Primary Contact Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Select Primary Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {contacts.map((contact, idx) => (
                    <button
                      key={contact.id}
                      onClick={() => setPrimaryIndex(idx)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        primaryIndex === idx
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{contact.full_name}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Created: {new Date(contact.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {primaryIndex === idx && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Field Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-3 border-b font-medium text-gray-700">Field</th>
                      {contacts.map((contact, idx) => (
                        <th key={contact.id} className="text-left p-3 border-b">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-700">
                              {contact.full_name}
                            </span>
                            {idx === primaryIndex && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                Primary
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field) => (
                      <tr key={field.key} className="border-b">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <field.icon className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-700">{field.label}</span>
                          </div>
                        </td>
                        {contacts.map((contact, idx) => {
                          const value = getFieldValue(contact, field.key)
                          const isSelected = selections[field.key]?.sourceIndex === idx
                          const isEmpty = !value || value === '-' || (Array.isArray(value) && value.length === 0)
                          
                          return (
                            <td key={contact.id} className="p-3">
                              {field.special === 'merge' ? (
                                <div>
                                  {formatFieldValue(value, field.key)}
                                  {field.key === 'tags' && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      All tags will be combined
                                    </p>
                                  )}
                                </div>
                              ) : field.readOnly ? (
                                <div>
                                  {formatFieldValue(value, field.key)}
                                  {field.key === 'events_attended' && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Total will be summed
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => !isEmpty && handleFieldSelection(field.key, idx, value)}
                                  disabled={isEmpty}
                                  className={`w-full text-left p-2 rounded transition-colors ${
                                    isSelected
                                      ? 'bg-blue-100 border-2 border-blue-500'
                                      : isEmpty
                                      ? 'cursor-not-allowed'
                                      : 'hover:bg-gray-50 border-2 border-transparent'
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      {formatFieldValue(value, field.key)}
                                    </div>
                                    {isSelected && (
                                      <Check className="w-4 h-4 text-blue-600 ml-2 flex-shrink-0" />
                                    )}
                                  </div>
                                </button>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">What happens when contacts are merged:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>All history (calls, events, campaigns) is preserved and combined</li>
                      <li>Tags from all contacts are combined</li>
                      <li>Custom fields are merged (conflicts resolved by keeping newest)</li>
                      <li>Total events attended is summed across all contacts</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Confirmation Screen */
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Merge className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Merge</h3>
                <p className="text-gray-600">
                  You are about to merge {contacts.length} contacts into one
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Merge Summary</h4>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Primary Contact</p>
                    <p className="font-medium">{contacts[primaryIndex].full_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Contacts to be merged</p>
                    <ul className="list-disc list-inside space-y-1">
                      {contacts
                        .filter((_, idx) => idx !== primaryIndex)
                        .map(contact => (
                          <li key={contact.id} className="text-sm">
                            {contact.full_name}
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Selected Values</p>
                    <ul className="space-y-1">
                      {Object.entries(selections).map(([field, selection]) => (
                        <li key={field} className="text-sm flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="capitalize">{field}:</span>
                          <span className="font-medium">
                            {field === 'tags' 
                              ? `${mergeTags().length} tags (combined)`
                              : selection.value || 'Not provided'
                            }
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">This action cannot be undone</p>
                    <p>Once merged, the duplicate contacts will be permanently deleted.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={showConfirmation ? () => setShowConfirmation(false) : onClose}
              disabled={isProcessing}
            >
              {showConfirmation ? 'Back' : 'Cancel'}
            </Button>

            <div className="flex items-center gap-3">
              {!showConfirmation && (
                <div className="text-sm text-gray-600">
                  Merging into: <span className="font-medium">{contacts[primaryIndex].full_name}</span>
                </div>
              )}
              
              <Button
                onClick={showConfirmation ? performMerge : () => setShowConfirmation(true)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Merging...
                  </>
                ) : (
                  <>
                    <Merge className="w-4 h-4 mr-2" />
                    {showConfirmation ? 'Confirm Merge' : 'Review Merge'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}