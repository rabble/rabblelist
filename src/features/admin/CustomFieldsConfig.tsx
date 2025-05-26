import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  Settings
} from 'lucide-react'

interface CustomField {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox'
  options?: string[] // For select fields
  required: boolean
  order: number
}

export function CustomFieldsConfig() {
  const { organization } = useAuth()
  const [fields, setFields] = useState<CustomField[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)
  const [showNewField, setShowNewField] = useState(false)

  useEffect(() => {
    if (organization) {
      loadCustomFields()
    }
  }, [organization])

  const loadCustomFields = async () => {
    if (!organization) return

    setIsLoading(true)
    try {
      // Load custom fields from organization settings
      const settings = typeof organization.settings === 'object' && 
                      organization.settings !== null && 
                      !Array.isArray(organization.settings)
                      ? organization.settings as Record<string, any>
                      : {}
      const customFields = Array.isArray(settings.custom_fields) ? settings.custom_fields : []
      setFields(customFields.map((field: any, index: number) => ({
        id: field.id || crypto.randomUUID(),
        name: field.name,
        type: field.type,
        options: field.options,
        required: field.required || false,
        order: field.order || index
      })))
    } catch (error) {
      console.error('Error loading custom fields:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveCustomFields = async () => {
    if (!organization) return

    setIsSaving(true)
    try {
      // Update organization settings with new custom fields
      const currentSettings = typeof organization.settings === 'object' && 
                            organization.settings !== null && 
                            !Array.isArray(organization.settings)
                            ? organization.settings as Record<string, any>
                            : {}
      
      const { error } = await supabase
        .from('organizations')
        .update({
          settings: {
            ...currentSettings,
            custom_fields: fields.map(({ id, ...field }) => field)
          }
        })
        .eq('id', organization.id)

      if (error) throw error

      alert('Custom fields saved successfully')
    } catch (error) {
      console.error('Error saving custom fields:', error)
      alert('Failed to save custom fields')
    } finally {
      setIsSaving(false)
    }
  }

  const addField = (field: Omit<CustomField, 'id' | 'order'>) => {
    const newField: CustomField = {
      ...field,
      id: crypto.randomUUID(),
      order: fields.length
    }
    setFields([...fields, newField])
    setShowNewField(false)
  }

  const updateField = (id: string, updates: Partial<CustomField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ))
  }

  const deleteField = (id: string) => {
    if (!confirm('Delete this custom field? Existing data will be preserved but hidden.')) {
      return
    }
    setFields(fields.filter(field => field.id !== id))
  }

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(f => f.id === id)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= fields.length) return

    const newFields = [...fields]
    const [removed] = newFields.splice(index, 1)
    newFields.splice(newIndex, 0, removed)

    // Update order values
    newFields.forEach((field, i) => {
      field.order = i
    })

    setFields(newFields)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Custom Fields</h1>
              <p className="text-gray-600 mt-1">
                Configure additional fields for contact information
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowNewField(true)}
                disabled={showNewField}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
              <Button
                onClick={saveCustomFields}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>

        {/* New Field Form */}
        {showNewField && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <NewFieldForm
                onSave={addField}
                onCancel={() => setShowNewField(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Fields List */}
        {fields.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No custom fields yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Add custom fields to collect additional contact information
                </p>
                <Button onClick={() => setShowNewField(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Field
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="p-4">
                  {editingField?.id === field.id ? (
                    <EditFieldForm
                      field={editingField}
                      onSave={(updates) => {
                        updateField(field.id, updates)
                        setEditingField(null)
                      }}
                      onCancel={() => setEditingField(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveField(field.id, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveField(field.id, 'down')}
                            disabled={index === fields.length - 1}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">
                              {field.name}
                            </h3>
                            {field.required && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            Type: {field.type}
                            {field.type === 'select' && field.options && (
                              <span> ({field.options.length} options)</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingField(field)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => deleteField(field.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-2">About Custom Fields</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Custom fields appear on contact forms and detail pages</li>
              <li>• Existing data is preserved when fields are modified or deleted</li>
              <li>• Select fields allow you to define a list of options</li>
              <li>• Required fields must be filled when creating contacts</li>
              <li>• Drag fields to reorder how they appear</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

// New Field Form Component
function NewFieldForm({ 
  onSave, 
  onCancel 
}: { 
  onSave: (field: Omit<CustomField, 'id' | 'order'>) => void
  onCancel: () => void 
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CustomField['type']>('text')
  const [required, setRequired] = useState(false)
  const [options, setOptions] = useState<string[]>([''])

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a field name')
      return
    }

    if (type === 'select' && options.filter(o => o.trim()).length === 0) {
      alert('Please add at least one option for select field')
      return
    }

    onSave({
      name: name.trim(),
      type,
      required,
      options: type === 'select' ? options.filter(o => o.trim()) : undefined
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Field Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Birthday, Company, Notes"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Field Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as CustomField['type'])}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="date">Date</option>
          <option value="select">Select (Dropdown)</option>
          <option value="checkbox">Checkbox</option>
        </select>
      </div>

      {type === 'select' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Options
          </label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...options]
                    newOptions[index] = e.target.value
                    setOptions(newOptions)
                  }}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Option value"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOptions(options.filter((_, i) => i !== index))}
                  disabled={options.length === 1}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOptions([...options, ''])}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </Button>
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Required field
          </span>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Add Field
        </Button>
      </div>
    </div>
  )
}

// Edit Field Form Component
function EditFieldForm({ 
  field,
  onSave, 
  onCancel 
}: { 
  field: CustomField
  onSave: (updates: Partial<CustomField>) => void
  onCancel: () => void 
}) {
  const [name, setName] = useState(field.name)
  const [required, setRequired] = useState(field.required)
  const [options, setOptions] = useState<string[]>(field.options || [''])

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a field name')
      return
    }

    if (field.type === 'select' && options.filter(o => o.trim()).length === 0) {
      alert('Please add at least one option for select field')
      return
    }

    onSave({
      name: name.trim(),
      required,
      options: field.type === 'select' ? options.filter(o => o.trim()) : field.options
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Type
          </label>
          <input
            type="text"
            value={field.type}
            disabled
            className="w-full px-3 py-2 border rounded-lg bg-gray-100"
          />
        </div>
      </div>

      {field.type === 'select' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Options
          </label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...options]
                    newOptions[index] = e.target.value
                    setOptions(newOptions)
                  }}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Option value"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOptions(options.filter((_, i) => i !== index))}
                  disabled={options.length === 1}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOptions([...options, ''])}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </Button>
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Required field
          </span>
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}