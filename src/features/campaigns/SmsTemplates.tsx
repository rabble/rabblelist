import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Plus, Edit, Trash2, Copy, MessageSquare, Search } from 'lucide-react'

interface SmsTemplate {
  id: string
  name: string
  content: string
  tags: string[]
  lastUsed?: string
  usageCount: number
  createdAt: string
}

export function SmsTemplates() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([
    {
      id: '1',
      name: 'Event Reminder',
      content: 'Hi {{first_name}}, reminder: {{event_name}} is tomorrow at {{event_time}}. Reply YES to confirm or STOP to opt out.',
      tags: ['event', 'reminder'],
      lastUsed: '2024-01-15',
      usageCount: 156,
      createdAt: '2023-12-01'
    },
    {
      id: '2',
      name: 'Volunteer Recruitment',
      content: 'Hi {{first_name}}, we need volunteers for {{campaign_name}}! Can you help? Reply YES to join or INFO for details.',
      tags: ['volunteer', 'recruitment'],
      lastUsed: '2024-01-18',
      usageCount: 89,
      createdAt: '2023-12-15'
    },
    {
      id: '3',
      name: 'Donation Ask',
      content: 'Hi {{first_name}}, help us reach our goal for {{campaign_name}}. Every dollar counts! Text GIVE to donate: {{donation_link}}',
      tags: ['donation', 'fundraising'],
      lastUsed: '2024-01-10',
      usageCount: 45,
      createdAt: '2024-01-01'
    }
  ])
  
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const allTags = Array.from(new Set(templates.flatMap(t => t.tags)))

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !selectedTag || template.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== id))
    }
  }

  const handleDuplicateTemplate = (template: SmsTemplate) => {
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      usageCount: 0,
      lastUsed: undefined,
      createdAt: new Date().toISOString()
    }
    setTemplates([...templates, newTemplate])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SMS Templates</h2>
          <p className="text-gray-600 mt-1">Manage reusable message templates for SMS campaigns</p>
        </div>
        <Button onClick={() => {
          setEditingTemplate(null)
          setShowTemplateModal(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedTag === null ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(null)}
              >
                All
              </Button>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <MessageSquare className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Template Preview */}
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700 line-clamp-3">{template.content}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Used</p>
                    <p className="font-medium">{template.usageCount} times</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last used</p>
                    <p className="font-medium">
                      {template.lastUsed ? new Date(template.lastUsed).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Character Count */}
                <div className="text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500">Character count</span>
                    <span className={`font-medium ${
                      template.content.length > 160 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {template.content.length}/160
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        template.content.length > 160 ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (template.content.length / 160) * 100)}%` }}
                    />
                  </div>
                  {template.content.length > 160 && (
                    <p className="text-xs text-red-600 mt-1">
                      Message will be sent as {Math.ceil(template.content.length / 160)} parts
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditingTemplate(template)
                      setShowTemplateModal(true)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicateTemplate(template)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600 mb-4">
            {searchQuery || selectedTag ? 'No templates found matching your criteria' : 'No SMS templates yet'}
          </p>
          <Button onClick={() => {
            setEditingTemplate(null)
            setShowTemplateModal(true)
          }}>
            Create Your First Template
          </Button>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <TemplateModal
          template={editingTemplate}
          onSave={(template) => {
            if (editingTemplate) {
              setTemplates(templates.map(t => t.id === editingTemplate.id ? template : t))
            } else {
              setTemplates([...templates, {
                ...template,
                id: Date.now().toString(),
                usageCount: 0,
                createdAt: new Date().toISOString()
              }])
            }
            setShowTemplateModal(false)
          }}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
    </div>
  )
}

// Template Modal Component
function TemplateModal({ 
  template, 
  onSave, 
  onClose 
}: { 
  template: SmsTemplate | null
  onSave: (template: Omit<SmsTemplate, 'id' | 'usageCount' | 'createdAt'>) => void
  onClose: () => void
}) {
  const [name, setName] = useState(template?.name || '')
  const [content, setContent] = useState(template?.content || '')
  const [tags, setTags] = useState<string[]>(template?.tags || [])
  const [newTag, setNewTag] = useState('')

  const availableVariables = [
    '{{first_name}}',
    '{{last_name}}',
    '{{event_name}}',
    '{{event_time}}',
    '{{event_location}}',
    '{{campaign_name}}',
    '{{donation_link}}',
    '{{volunteer_link}}',
    '{{unsubscribe_link}}'
  ]

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag('')
    }
  }

  const handleInsertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + variable + content.substring(end)
    setContent(newContent)
    
    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">
            {template ? 'Edit SMS Template' : 'Create SMS Template'}
          </h3>

          <div className="space-y-4">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Event Reminder"
              />
            </div>

            {/* Template Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message Content
              </label>
              <textarea
                id="template-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Type your message here..."
              />
              <div className="flex items-center justify-between mt-1">
                <p className={`text-sm ${
                  content.length > 160 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {content.length}/160 characters
                  {content.length > 160 && ` (${Math.ceil(content.length / 160)} SMS parts)`}
                </p>
              </div>
            </div>

            {/* Variables */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Variables
              </label>
              <div className="flex flex-wrap gap-2">
                {availableVariables.map(variable => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => handleInsertVariable(variable)}
                    className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {variable}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Add a tag..."
                />
                <Button onClick={handleAddTag} size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter(t => t !== tag))}
                      className="ml-1 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (name && content) {
                  onSave({ name, content, tags, lastUsed: template?.lastUsed })
                  onClose()
                }
              }}
              disabled={!name || !content}
            >
              {template ? 'Save Changes' : 'Create Template'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}