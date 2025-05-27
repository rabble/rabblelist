import { useState } from 'react'
import { X, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { campaignTemplates } from './campaignTemplates'
import type { CampaignTemplate } from './campaignTemplates'

interface CampaignTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: CampaignTemplate) => void
}

export function CampaignTemplateModal({ isOpen, onClose, onSelectTemplate }: CampaignTemplateModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  if (!isOpen) return null

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'advocacy', label: 'Advocacy' },
    { value: 'electoral', label: 'Electoral' },
    { value: 'fundraising', label: 'Fundraising' },
    { value: 'community', label: 'Community' },
    { value: 'crisis', label: 'Crisis Response' },
    { value: 'education', label: 'Education' }
  ]

  const filteredTemplates = campaignTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose a Campaign Template</h2>
            <p className="text-gray-600 mt-1">Start with a proven template and customize it for your needs</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <span className="text-xs text-gray-500 uppercase">{template.category}</span>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5 text-primary-600" />
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {template.type}
                  </span>
                  {template.settings.goal && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Goal: {template.settings.goal.toLocaleString()}
                    </span>
                  )}
                  {template.settings.duration && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {template.settings.duration} days
                    </span>
                  )}
                </div>

                {template.steps && (
                  <div className="text-xs text-gray-500">
                    {template.steps.length} steps included
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No templates found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSelectTemplate({} as CampaignTemplate)}>
            Start from Scratch
          </Button>
        </div>
      </div>
    </div>
  )
}