import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useContactStore } from '@/stores/contactStore'
import { useAuth } from '@/features/auth/AuthContext'
import { ContactService } from './contacts.service'
import { 
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  Save,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import type { Contact } from '@/types'

// Validation schema
const contactSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  tags: z.array(z.string()).optional(),
  custom_fields: z.record(z.any()).optional()
})

type ContactFormValues = z.infer<typeof contactSchema>

export function ContactForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  
  const { organization } = useAuth()
  const { createContact, updateContact } = useContactStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [, setExistingContact] = useState<Contact | null>(null)
  const [customFields, setCustomFields] = useState<any[]>([])

  // Available tags - in production, this would come from the database
  const availableTags = ['volunteer', 'donor', 'member', 'prospect', 'event_attendee']

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      address: '',
      tags: [],
      custom_fields: {}
    }
  })

  const selectedTags = watch('tags') || []

  useEffect(() => {
    // Load custom fields from organization settings
    if (organization?.settings) {
      const settings = typeof organization.settings === 'object' && 
                      organization.settings !== null && 
                      !Array.isArray(organization.settings)
                      ? organization.settings as Record<string, any>
                      : {}
      if (Array.isArray(settings.custom_fields)) {
        setCustomFields(settings.custom_fields)
      }
    }
    
    if (isEditing && id) {
      loadContact()
    }
  }, [id, organization])

  const loadContact = async () => {
    if (!id) return
    
    setIsLoading(true)
    try {
      const { data, error } = await ContactService.getContact(id)
      
      if (error || !data) {
        alert('Contact not found')
        navigate('/contacts')
        return
      }
      
      setExistingContact(data)
      
      // Populate form
      setValue('full_name', data.full_name)
      setValue('phone', data.phone)
      setValue('email', data.email || '')
      setValue('address', data.address || '')
      setValue('tags', data.tags || [])
      setValue('custom_fields', data.custom_fields || {})
    } catch (error) {
      console.error('Error loading contact:', error)
      alert('Failed to load contact')
      navigate('/contacts')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ContactFormValues) => {
    setIsSaving(true)
    
    try {
      if (isEditing && id) {
        // Update existing contact
        await updateContact(id, {
          ...data,
          email: data.email || null,
          address: data.address || null,
          tags: data.tags || [],
          custom_fields: data.custom_fields || {}
        })
        
        navigate(`/contacts/${id}`)
      } else {
        // Create new contact
        const newContact = await createContact({
          ...data,
          email: data.email || null,
          address: data.address || null,
          tags: data.tags || [],
          custom_fields: data.custom_fields || {}
        })
        
        if (newContact) {
          navigate(`/contacts/${newContact.id}`)
        } else {
          alert('Failed to create contact')
        }
      }
    } catch (error) {
      console.error('Error saving contact:', error)
      alert('Failed to save contact')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTagToggle = (tag: string) => {
    const currentTags = selectedTags || []
    
    if (currentTags.includes(tag)) {
      setValue('tags', currentTags.filter(t => t !== tag))
    } else {
      setValue('tags', [...currentTags, tag])
    }
  }

  const renderCustomField = (field: any) => {
    const fieldKey = field.name.replace(/\s+/g, '_').toLowerCase()
    const fieldValue = watch(`custom_fields.${fieldKey}`) || ''
    
    switch (field.type) {
      case 'text':
        return (
          <input
            value={fieldValue}
            onChange={(e) => setValue(`custom_fields.${fieldKey}`, e.target.value)}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )
      
      case 'number':
        return (
          <input
            value={fieldValue}
            onChange={(e) => setValue(`custom_fields.${fieldKey}`, e.target.value)}
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )
      
      case 'date':
        return (
          <input
            value={fieldValue}
            onChange={(e) => setValue(`custom_fields.${fieldKey}`, e.target.value)}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )
      
      case 'select':
        return (
          <select
            value={fieldValue}
            onChange={(e) => setValue(`custom_fields.${fieldKey}`, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      
      case 'checkbox':
        return (
          <input
            checked={fieldValue === true || fieldValue === 'true'}
            onChange={(e) => setValue(`custom_fields.${fieldKey}`, e.target.checked)}
            type="checkbox"
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        )
      
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Contact' : 'Add New Contact'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('full_name')}
                    type="text"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.full_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.full_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('phone')}
                    type="tel"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(555) 123-4567"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('email')}
                    type="email"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    {...register('address')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main St&#10;City, State 12345"
                    rows={3}
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Fields */}
              {customFields.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-900">Additional Information</h3>
                  {customFields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.name} {field.required && '*'}
                      </label>
                      {renderCustomField(field)}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditing ? 'Update Contact' : 'Create Contact'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}