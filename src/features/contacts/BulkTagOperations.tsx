import { useState, useEffect } from 'react'
import { Button } from '@/components/common/Button'
import { 
  Tag, 
  Plus, 
  X, 
  Check, 
  Loader2,
  Search,
  Users,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ContactService } from './contacts.service'
import type { Contact } from '@/types'

interface BulkTagOperationsProps {
  selectedContacts: string[]
  onClose: () => void
  onComplete: () => void
}

interface TagStats {
  tag: string
  count: number
  percentage: number
}

export function BulkTagOperations({ selectedContacts, onClose, onComplete }: BulkTagOperationsProps) {
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [currentTags, setCurrentTags] = useState<TagStats[]>([])
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([])
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [newTag, setNewTag] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTagData()
  }, [selectedContacts])

  const loadTagData = async () => {
    setIsLoading(true)
    try {
      // Get organization ID
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) throw new Error('No organization found')

      // Get all unique tags from the organization
      const { data: allContacts } = await supabase
        .from('contacts')
        .select('tags')
        .eq('organization_id', orgId)

      const tagSet = new Set<string>()
      allContacts?.forEach(contact => {
        contact.tags?.forEach((tag: string) => tagSet.add(tag))
      })
      setAvailableTags(Array.from(tagSet).sort())

      // Get current tags for selected contacts
      const { data: selectedContactsData } = await supabase
        .from('contacts')
        .select('id, tags')
        .in('id', selectedContacts)

      // Calculate tag statistics
      const tagCounts = new Map<string, number>()
      selectedContactsData?.forEach(contact => {
        contact.tags?.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        })
      })

      const stats: TagStats[] = Array.from(tagCounts.entries()).map(([tag, count]) => ({
        tag,
        count,
        percentage: Math.round((count / selectedContacts.length) * 100)
      })).sort((a, b) => b.count - a.count)

      setCurrentTags(stats)
    } catch (error) {
      console.error('Error loading tag data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTag = (tag: string) => {
    if (!tagsToAdd.includes(tag)) {
      setTagsToAdd([...tagsToAdd, tag])
      // Remove from removal list if present
      setTagsToRemove(tagsToRemove.filter(t => t !== tag))
    }
  }

  const handleRemoveTag = (tag: string) => {
    if (!tagsToRemove.includes(tag)) {
      setTagsToRemove([...tagsToRemove, tag])
      // Remove from add list if present
      setTagsToAdd(tagsToAdd.filter(t => t !== tag))
    }
  }

  const handleCreateAndAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase().replace(/\s+/g, '_')
    if (trimmedTag && !availableTags.includes(trimmedTag)) {
      setAvailableTags([...availableTags, trimmedTag].sort())
      handleAddTag(trimmedTag)
      setNewTag('')
    }
  }

  const applyTagChanges = async () => {
    if (tagsToAdd.length === 0 && tagsToRemove.length === 0) {
      onClose()
      return
    }

    setIsProcessing(true)
    try {
      // Process each contact
      for (const contactId of selectedContacts) {
        // Get current contact data
        const { data: contact, error: fetchError } = await ContactService.getContact(contactId)
        if (fetchError || !contact) continue

        // Calculate new tags
        let newTags = [...(contact.tags || [])]
        
        // Add new tags
        tagsToAdd.forEach(tag => {
          if (!newTags.includes(tag)) {
            newTags.push(tag)
          }
        })
        
        // Remove tags
        newTags = newTags.filter(tag => !tagsToRemove.includes(tag))

        // Update contact
        await ContactService.updateContact(contactId, { tags: newTags })

        // Log tag operations in contact_interactions
        for (const tag of tagsToAdd) {
          await supabase
            .from('contact_interactions')
            .insert({
              contact_id: contactId,
              organization_id: contact.organization_id,
              type: 'tag_added',
              notes: `Bulk operation: Added tag "${tag}"`,
              metadata: { tag, bulk_operation: true }
            })
        }

        for (const tag of tagsToRemove) {
          await supabase
            .from('contact_interactions')
            .insert({
              contact_id: contactId,
              organization_id: contact.organization_id,
              type: 'tag_removed',
              notes: `Bulk operation: Removed tag "${tag}"`,
              metadata: { tag, bulk_operation: true }
            })
        }
      }

      onComplete()
    } catch (error) {
      console.error('Error applying tag changes:', error)
      alert('Failed to apply some tag changes. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredAvailableTags = availableTags.filter(tag => 
    tag.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !tagsToAdd.includes(tag)
  )

  const getTagStatus = (tag: string) => {
    if (tagsToAdd.includes(tag)) return 'add'
    if (tagsToRemove.includes(tag)) return 'remove'
    const stat = currentTags.find(s => s.tag === tag)
    return stat ? 'current' : 'available'
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-2">Loading tag information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Tags</h2>
              <p className="text-gray-600 mt-1">
                Apply tags to {selectedContacts.length} selected contact{selectedContacts.length !== 1 ? 's' : ''}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Tags */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Current Tags</h3>
              {currentTags.length === 0 ? (
                <p className="text-gray-500 text-sm">No common tags across selected contacts</p>
              ) : (
                <div className="space-y-2">
                  {currentTags.map(stat => (
                    <div
                      key={stat.tag}
                      className={`p-3 rounded-lg border ${
                        tagsToRemove.includes(stat.tag)
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className={`font-medium ${
                            tagsToRemove.includes(stat.tag) ? 'text-red-700 line-through' : 'text-gray-900'
                          }`}>
                            {stat.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {stat.count}/{selectedContacts.length} ({stat.percentage}%)
                          </span>
                          {tagsToRemove.includes(stat.tag) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setTagsToRemove(tagsToRemove.filter(t => t !== stat.tag))}
                            >
                              Undo
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveTag(stat.tag)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Tags */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Tags</h3>
              
              {/* Search and Create */}
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tags..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Create new tag..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateAndAddTag()}
                  />
                  <Button
                    onClick={handleCreateAndAddTag}
                    disabled={!newTag.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                </div>
              </div>

              {/* Tag List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredAvailableTags.length === 0 ? (
                  <p className="text-gray-500 text-sm">No tags found</p>
                ) : (
                  filteredAvailableTags.map(tag => {
                    const status = getTagStatus(tag)
                    return (
                      <button
                        key={tag}
                        onClick={() => status === 'available' && handleAddTag(tag)}
                        disabled={status !== 'available'}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          status === 'add'
                            ? 'border-green-300 bg-green-50'
                            : status === 'current'
                            ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-gray-400" />
                            <span className={`font-medium ${
                              status === 'add' ? 'text-green-700' : 'text-gray-900'
                            }`}>
                              {tag}
                            </span>
                          </div>
                          {status === 'add' && (
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-600">Will be added</span>
                            </div>
                          )}
                          {status === 'current' && (
                            <span className="text-sm text-gray-500">Already applied</span>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          {(tagsToAdd.length > 0 || tagsToRemove.length > 0) && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Summary of Changes</h4>
              <div className="space-y-2 text-sm">
                {tagsToAdd.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Plus className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <span className="text-gray-700">Tags to add:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tagsToAdd.map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {tag}
                            <button
                              onClick={() => setTagsToAdd(tagsToAdd.filter(t => t !== tag))}
                              className="ml-1 hover:text-green-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {tagsToRemove.length > 0 && (
                  <div className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-600 mt-0.5" />
                    <div>
                      <span className="text-gray-700">Tags to remove:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tagsToRemove.map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {tag}
                            <button
                              onClick={() => setTagsToRemove(tagsToRemove.filter(t => t !== tag))}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Important Notes:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Tags will be applied to all {selectedContacts.length} selected contacts</li>
                  <li>This action will be logged in each contact's activity history</li>
                  <li>Changes cannot be undone automatically</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{selectedContacts.length} contacts selected</span>
              {(tagsToAdd.length > 0 || tagsToRemove.length > 0) && (
                <>
                  <span>•</span>
                  <span>
                    {tagsToAdd.length > 0 && `${tagsToAdd.length} tags to add`}
                    {tagsToAdd.length > 0 && tagsToRemove.length > 0 && ', '}
                    {tagsToRemove.length > 0 && `${tagsToRemove.length} tags to remove`}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={applyTagChanges}
                disabled={isProcessing || (tagsToAdd.length === 0 && tagsToRemove.length === 0)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying Changes...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Apply Changes
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