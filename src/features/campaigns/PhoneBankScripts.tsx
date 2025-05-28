import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Plus, Edit, Trash2, Copy, Phone, Search, FileText, Users } from 'lucide-react'

interface PhoneBankScript {
  id: string
  name: string
  intro: string
  mainScript: string
  objectionHandling: ObjectionResponse[]
  closing: string
  tags: string[]
  lastUsed?: string
  usageCount: number
  createdAt: string
}

interface ObjectionResponse {
  objection: string
  response: string
}

export function PhoneBankScripts() {
  const [scripts, setScripts] = useState<PhoneBankScript[]>([
    {
      id: '1',
      name: 'Get Out The Vote',
      intro: 'Hi, my name is {{caller_name}} and I\'m calling on behalf of {{organization_name}}. Is this {{contact_name}}?',
      mainScript: 'Great! I\'m calling to remind you about the upcoming election on {{election_date}}. We\'re working to ensure everyone has a plan to vote. Have you thought about when and how you\'ll be voting?',
      objectionHandling: [
        {
          objection: 'I don\'t have time to vote',
          response: 'I understand you\'re busy. Did you know that polls are open from 6 AM to 8 PM? We can also help you find the quickest times to vote at your polling location.'
        },
        {
          objection: 'I don\'t know where to vote',
          response: 'No problem! I can help you find your polling location right now. What\'s your zip code?'
        }
      ],
      closing: 'Thank you so much for your time. Remember, every vote counts! Have a great day!',
      tags: ['gotv', 'election'],
      lastUsed: '2024-01-20',
      usageCount: 234,
      createdAt: '2023-10-15'
    },
    {
      id: '2',
      name: 'Volunteer Recruitment',
      intro: 'Hi {{contact_name}}, this is {{caller_name}} from {{organization_name}}. How are you today?',
      mainScript: 'I\'m calling because we\'re organizing a community action for {{campaign_name}} and we need passionate people like you to help make a difference. We have opportunities ranging from just a few hours to ongoing roles. What issues are you most passionate about?',
      objectionHandling: [
        {
          objection: 'I don\'t have much time',
          response: 'That\'s perfectly fine! Even just 2 hours can make a huge difference. We have flexible opportunities that can fit your schedule.'
        },
        {
          objection: 'I\'ve never volunteered before',
          response: 'That\'s great! We love working with new volunteers. We provide full training and you\'ll be paired with experienced volunteers to help you get started.'
        }
      ],
      closing: 'Thanks for considering volunteering with us. I\'ll send you an email with more information. Looking forward to working with you!',
      tags: ['volunteer', 'recruitment'],
      lastUsed: '2024-01-18',
      usageCount: 156,
      createdAt: '2023-11-01'
    },
    {
      id: '3',
      name: 'Issue Education - Climate',
      intro: 'Hello, is this {{contact_name}}? Hi, I\'m {{caller_name}} calling from {{organization_name}}.',
      mainScript: 'We\'re reaching out to community members about the proposed clean energy initiative. This would bring renewable energy jobs to our area while reducing energy costs. Have you heard about this initiative?',
      objectionHandling: [
        {
          objection: 'This will cost too much',
          response: 'I understand your concern about costs. Actually, studies show this initiative will save the average household $200 per year on energy bills after the first two years.'
        },
        {
          objection: 'I don\'t believe in climate change',
          response: 'I appreciate your perspective. Regardless of views on climate, this initiative is about creating local jobs and energy independence for our community. Would those benefits interest you?'
        }
      ],
      closing: 'Thank you for taking the time to learn about this. Can we count on your support? I can also send you more detailed information if you\'d like.',
      tags: ['issue', 'climate', 'education'],
      lastUsed: '2024-01-15',
      usageCount: 89,
      createdAt: '2023-12-01'
    }
  ])
  
  const [showScriptModal, setShowScriptModal] = useState(false)
  const [editingScript, setEditingScript] = useState<PhoneBankScript | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const allTags = Array.from(new Set(scripts.flatMap(s => s.tags)))

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         script.mainScript.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !selectedTag || script.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  const handleDeleteScript = (id: string) => {
    if (confirm('Are you sure you want to delete this script?')) {
      setScripts(scripts.filter(s => s.id !== id))
    }
  }

  const handleDuplicateScript = (script: PhoneBankScript) => {
    const newScript = {
      ...script,
      id: Date.now().toString(),
      name: `${script.name} (Copy)`,
      usageCount: 0,
      lastUsed: undefined,
      createdAt: new Date().toISOString()
    }
    setScripts([...scripts, newScript])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Phone Banking Scripts</h2>
          <p className="text-gray-600 mt-1">Manage call scripts for phone banking campaigns</p>
        </div>
        <Button onClick={() => {
          setEditingScript(null)
          setShowScriptModal(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          New Script
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
                placeholder="Search scripts..."
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

      {/* Scripts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredScripts.map(script => (
          <Card key={script.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{script.name}</CardTitle>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {script.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Phone className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Script Preview */}
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-xs font-medium text-gray-500 mb-1">Introduction:</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{script.intro}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-xs font-medium text-gray-500 mb-1">Main Script:</p>
                    <p className="text-sm text-gray-700 line-clamp-3">{script.mainScript}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Used</p>
                    <p className="font-medium">{script.usageCount} times</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Objections</p>
                    <p className="font-medium">{script.objectionHandling.length} handled</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last used</p>
                    <p className="font-medium text-xs">
                      {script.lastUsed ? new Date(script.lastUsed).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditingScript(script)
                      setShowScriptModal(true)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicateScript(script)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteScript(script.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredScripts.length === 0 && (
        <div className="text-center py-12">
          <Phone className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600 mb-4">
            {searchQuery || selectedTag ? 'No scripts found matching your criteria' : 'No phone banking scripts yet'}
          </p>
          <Button onClick={() => {
            setEditingScript(null)
            setShowScriptModal(true)
          }}>
            Create Your First Script
          </Button>
        </div>
      )}

      {/* Script Modal */}
      {showScriptModal && (
        <ScriptModal
          script={editingScript}
          onSave={(script) => {
            if (editingScript) {
              setScripts(scripts.map(s => s.id === editingScript.id ? script : s))
            } else {
              setScripts([...scripts, {
                ...script,
                id: Date.now().toString(),
                usageCount: 0,
                createdAt: new Date().toISOString()
              }])
            }
            setShowScriptModal(false)
          }}
          onClose={() => setShowScriptModal(false)}
        />
      )}
    </div>
  )
}

// Script Modal Component
function ScriptModal({ 
  script, 
  onSave, 
  onClose 
}: { 
  script: PhoneBankScript | null
  onSave: (script: Omit<PhoneBankScript, 'id' | 'usageCount' | 'createdAt'>) => void
  onClose: () => void
}) {
  const [name, setName] = useState(script?.name || '')
  const [intro, setIntro] = useState(script?.intro || '')
  const [mainScript, setMainScript] = useState(script?.mainScript || '')
  const [closing, setClosing] = useState(script?.closing || '')
  const [objectionHandling, setObjectionHandling] = useState<ObjectionResponse[]>(
    script?.objectionHandling || []
  )
  const [tags, setTags] = useState<string[]>(script?.tags || [])
  const [newTag, setNewTag] = useState('')

  const availableVariables = [
    '{{caller_name}}',
    '{{contact_name}}',
    '{{organization_name}}',
    '{{campaign_name}}',
    '{{election_date}}',
    '{{event_date}}',
    '{{event_location}}'
  ]

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag('')
    }
  }

  const handleAddObjection = () => {
    setObjectionHandling([...objectionHandling, { objection: '', response: '' }])
  }

  const handleRemoveObjection = (index: number) => {
    setObjectionHandling(objectionHandling.filter((_, i) => i !== index))
  }

  const handleUpdateObjection = (index: number, field: 'objection' | 'response', value: string) => {
    const updated = [...objectionHandling]
    updated[index] = { ...updated[index], [field]: value }
    setObjectionHandling(updated)
  }

  const handleInsertVariable = (field: 'intro' | 'mainScript' | 'closing', variable: string) => {
    const textarea = document.getElementById(`script-${field}`) as HTMLTextAreaElement
    const value = field === 'intro' ? intro : field === 'mainScript' ? mainScript : closing
    const setter = field === 'intro' ? setIntro : field === 'mainScript' ? setMainScript : setClosing
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = value.substring(0, start) + variable + value.substring(end)
    setter(newContent)
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">
            {script ? 'Edit Phone Banking Script' : 'Create Phone Banking Script'}
          </h3>

          <div className="space-y-4">
            {/* Script Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Script Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Get Out The Vote"
              />
            </div>

            {/* Available Variables */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Variables (click to insert)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableVariables.map(variable => (
                  <span
                    key={variable}
                    className="px-2 py-1 text-sm bg-gray-100 rounded-md cursor-help"
                  >
                    {variable}
                  </span>
                ))}
              </div>
            </div>

            {/* Introduction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Introduction
              </label>
              <div className="space-y-1">
                <textarea
                  id="script-intro"
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Hi, my name is {{caller_name}}..."
                />
                <div className="flex gap-1">
                  {availableVariables.map(variable => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => handleInsertVariable('intro', variable)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Script */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Script
              </label>
              <div className="space-y-1">
                <textarea
                  id="script-mainScript"
                  value={mainScript}
                  onChange={(e) => setMainScript(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="The main message of your call..."
                />
                <div className="flex gap-1">
                  {availableVariables.map(variable => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => handleInsertVariable('mainScript', variable)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Objection Handling */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objection Handling
              </label>
              <div className="space-y-2">
                {objectionHandling.map((item, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-md">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={item.objection}
                        onChange={(e) => handleUpdateObjection(index, 'objection', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Common objection..."
                      />
                      <textarea
                        value={item.response}
                        onChange={(e) => handleUpdateObjection(index, 'response', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Your response..."
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => handleRemoveObjection(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddObjection}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Objection
                </Button>
              </div>
            </div>

            {/* Closing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Closing
              </label>
              <div className="space-y-1">
                <textarea
                  id="script-closing"
                  value={closing}
                  onChange={(e) => setClosing(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Thank you for your time..."
                />
                <div className="flex gap-1">
                  {availableVariables.map(variable => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => handleInsertVariable('closing', variable)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
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
                if (name && intro && mainScript && closing) {
                  onSave({ 
                    name, 
                    intro, 
                    mainScript, 
                    closing, 
                    objectionHandling, 
                    tags, 
                    lastUsed: script?.lastUsed 
                  })
                  onClose()
                }
              }}
              disabled={!name || !intro || !mainScript || !closing}
            >
              {script ? 'Save Changes' : 'Create Script'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}