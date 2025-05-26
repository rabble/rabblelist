import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { supabase } from '@/lib/supabase'
import { 
  Tag,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Users
} from 'lucide-react'

interface TagInfo {
  name: string
  count: number
  color?: string
}

export function TagsManagement() {
  const [tags, setTags] = useState<TagInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [newTagName, setNewTagName] = useState('')
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showNewTag, setShowNewTag] = useState(false)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    setLoading(true)
    try {
      // Get organization ID
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) throw new Error('No organization found')

      // Get all contacts with their tags
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('tags')
        .eq('organization_id', orgId)

      if (error) throw error

      // Count tag usage
      const tagCounts: Record<string, number> = {}
      contacts?.forEach(contact => {
        contact.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      })

      // Convert to array and sort by count
      const tagList = Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      setTags(tagList)
    } catch (error) {
      console.error('Error loading tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    const tagName = newTagName.trim().toLowerCase().replace(/\s+/g, '_')
    
    // Check if tag already exists
    if (tags.some(t => t.name === tagName)) {
      alert('Tag already exists')
      return
    }

    // Add tag to the list (with 0 count initially)
    setTags([...tags, { name: tagName, count: 0 }])
    setNewTagName('')
    setShowNewTag(false)
  }

  const handleRenameTag = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) {
      setEditingTag(null)
      return
    }

    const formattedNewName = newName.trim().toLowerCase().replace(/\s+/g, '_')
    
    // Check if new name already exists
    if (tags.some(t => t.name === formattedNewName && t.name !== oldName)) {
      alert('Tag already exists')
      return
    }

    try {
      // Get all contacts with the old tag
      const { data: contacts, error: fetchError } = await supabase
        .from('contacts')
        .select('id, tags')
        .contains('tags', [oldName])

      if (fetchError) throw fetchError

      // Update each contact
      for (const contact of contacts || []) {
        const newTags = contact.tags.map((tag: string) => 
          tag === oldName ? formattedNewName : tag
        )
        
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ tags: newTags })
          .eq('id', contact.id)

        if (updateError) throw updateError
      }

      // Update local state
      setTags(tags.map(t => 
        t.name === oldName ? { ...t, name: formattedNewName } : t
      ))
      setEditingTag(null)
    } catch (error) {
      console.error('Error renaming tag:', error)
      alert('Failed to rename tag')
    }
  }

  const handleDeleteTag = async (tagName: string) => {
    if (!confirm(`Delete tag "${tagName}"? This will remove it from all contacts.`)) {
      return
    }

    try {
      // Get all contacts with this tag
      const { data: contacts, error: fetchError } = await supabase
        .from('contacts')
        .select('id, tags')
        .contains('tags', [tagName])

      if (fetchError) throw fetchError

      // Remove tag from each contact
      for (const contact of contacts || []) {
        const newTags = contact.tags.filter((tag: string) => tag !== tagName)
        
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ tags: newTags })
          .eq('id', contact.id)

        if (updateError) throw updateError
      }

      // Update local state
      setTags(tags.filter(t => t.name !== tagName))
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('Failed to delete tag')
    }
  }

  const handleMergeTags = async (sourceTag: string, targetTag: string) => {
    if (!confirm(`Merge "${sourceTag}" into "${targetTag}"? This cannot be undone.`)) {
      return
    }

    try {
      // Get all contacts with the source tag
      const { data: contacts, error: fetchError } = await supabase
        .from('contacts')
        .select('id, tags')
        .contains('tags', [sourceTag])

      if (fetchError) throw fetchError

      // Update each contact
      for (const contact of contacts || []) {
        // Remove source tag and add target tag if not already present
        const newTags = contact.tags
          .filter((tag: string) => tag !== sourceTag)
          .concat(contact.tags.includes(targetTag) ? [] : [targetTag])
        
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ tags: newTags })
          .eq('id', contact.id)

        if (updateError) throw updateError
      }

      // Reload tags
      await loadTags()
    } catch (error) {
      console.error('Error merging tags:', error)
      alert('Failed to merge tags')
    }
  }

  if (loading) {
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
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tag Management</h1>
              <p className="text-gray-600 mt-1">
                Manage tags used across {tags.reduce((sum, t) => sum + t.count, 0)} contacts
              </p>
            </div>
            <Button 
              onClick={() => setShowNewTag(true)}
              disabled={showNewTag}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Tag
            </Button>
          </div>
        </div>

        {/* New Tag Form */}
        {showNewTag && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter tag name..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleCreateTag()
                  }}
                  autoFocus
                />
                <Button 
                  size="sm" 
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setShowNewTag(false)
                    setNewTagName('')
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 ml-8">
                Tag names will be converted to lowercase with underscores
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tags List */}
        {tags.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tags yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Tags help you organize and filter contacts
                </p>
                <Button onClick={() => setShowNewTag(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Tag
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => (
              <Card key={tag.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-gray-400" />
                      {editingTag === tag.name ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameTag(tag.name, editingName)
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleRenameTag(tag.name, editingName)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingTag(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium text-gray-900">
                            {tag.name}
                          </span>
                          <span className="flex items-center text-sm text-gray-500">
                            <Users className="w-4 h-4 mr-1" />
                            {tag.count} contact{tag.count !== 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {editingTag !== tag.name && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTag(tag.name)
                            setEditingName(tag.name)
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteTag(tag.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tag Merge Section */}
        {tags.length > 1 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Merge Tags</h3>
              <p className="text-sm text-gray-600 mb-4">
                Combine two tags by merging one into another
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <select className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Source tag to merge from...</option>
                  {tags.map(tag => (
                    <option key={tag.name} value={tag.name}>
                      {tag.name} ({tag.count} contacts)
                    </option>
                  ))}
                </select>
                <span className="text-gray-500 self-center">→</span>
                <select className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Target tag to merge into...</option>
                  {tags.map(tag => (
                    <option key={tag.name} value={tag.name}>
                      {tag.name} ({tag.count} contacts)
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => {
                    const sourceSelect = document.querySelector('select:first-of-type') as HTMLSelectElement
                    const targetSelect = document.querySelector('select:last-of-type') as HTMLSelectElement
                    if (sourceSelect?.value && targetSelect?.value && sourceSelect.value !== targetSelect.value) {
                      handleMergeTags(sourceSelect.value, targetSelect.value)
                    }
                  }}
                >
                  Merge
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}