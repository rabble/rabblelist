import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useCampaignStore } from '@/stores/campaignStore'
import type { CampaignTemplate } from './campaignTemplates'
import { 
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  Tag,
  FileText,
  Mail,
  Phone,
  Users,
  Share2,
  Heart,
  MapPin,
  DollarSign,
  Target,
  MessageSquare
} from 'lucide-react'
import type { Campaign } from '@/types/campaign.types'

// Extended schema with type-specific fields
const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['petition', 'event', 'donation', 'email_blast', 'phone_bank', 'canvas', 'social', 'email', 'sms', 'phonebank', 'fundraising', 'canvassing']),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled', 'scheduled', 'archived']),
  description: z.string().optional(),
  goal: z.number().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  
  // Type-specific fields
  // Petition fields
  petition_text: z.string().optional(),
  petition_target: z.string().optional(),
  
  // Event fields
  event_location: z.string().optional(),
  event_capacity: z.number().optional(),
  event_registration_required: z.boolean().optional(),
  
  // Donation fields
  donation_target_amount: z.number().optional(),
  donation_recurring_enabled: z.boolean().optional(),
  donation_suggested_amounts: z.array(z.number()).optional(),
  
  // Email blast fields
  email_subject: z.string().optional(),
  email_preview_text: z.string().optional(),
  email_sender_name: z.string().optional(),
  
  // Phone bank fields
  phone_script: z.string().optional(),
  phone_call_goal: z.number().optional(),
  phone_talking_points: z.array(z.string()).optional(),
  
  // Canvas fields
  canvas_area: z.string().optional(),
  canvas_volunteer_goal: z.number().optional(),
  canvas_literature_needed: z.boolean().optional(),
  
  // Social media fields
  social_platforms: z.array(z.string()).optional(),
  social_hashtags: z.array(z.string()).optional(),
  social_content_calendar: z.boolean().optional()
})

type CampaignFormValues = z.infer<typeof campaignSchema>

const campaignTypes = [
  { value: 'petition', label: 'Petition', icon: FileText, description: 'Collect signatures for your cause' },
  { value: 'event', label: 'Event', icon: Calendar, description: 'Promote and track event attendance' },
  { value: 'donation', label: 'Fundraiser', icon: Heart, description: 'Raise funds for your campaign' },
  { value: 'email_blast', label: 'Email Blast', icon: Mail, description: 'Send targeted email campaigns' },
  { value: 'phone_bank', label: 'Phone Bank', icon: Phone, description: 'Coordinate calling campaigns' },
  { value: 'canvas', label: 'Canvassing', icon: Users, description: 'Organize door-to-door outreach' },
  { value: 'social', label: 'Social Media', icon: Share2, description: 'Coordinate social media campaigns' }
]

export function CampaignFormEnhanced() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const isEditing = !!id
  
  // Get template from navigation state
  const template = location.state?.template as CampaignTemplate | undefined
  
  const { currentCampaign, loadCampaign, createCampaign, updateCampaign, isLoadingCampaign } = useCampaignStore()
  const [isSaving, setIsSaving] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: '',
      type: 'petition',
      status: 'draft',
      description: '',
      tags: [],
      donation_suggested_amounts: [25, 50, 100, 250],
      social_platforms: [],
      phone_talking_points: []
    }
  })

  const selectedType = watch('type')
  const selectedTags = watch('tags') || []

  // Load template data if provided
  useEffect(() => {
    if (template && !isEditing) {
      reset({
        title: template.name,
        type: template.type,
        status: 'draft',
        description: template.description,
        tags: [template.category],
        goal: template.settings.goal,
        // Add type-specific fields from template
        ...(template.type === 'petition' && template.settings ? {
          petition_text: '',
          petition_target: ''
        } : {}),
        ...(template.type === 'phone_bank' && template.callScripts && template.callScripts.length > 0 ? {
          phone_script: template.callScripts[0].content,
          phone_talking_points: []
        } : {})
      })
    }
  }, [template, isEditing, reset])

  useEffect(() => {
    if (isEditing && id) {
      loadCampaign(id)
    }
  }, [id, isEditing, loadCampaign])

  useEffect(() => {
    if (isEditing && currentCampaign) {
      reset({
        title: currentCampaign.title,
        type: currentCampaign.type,
        status: currentCampaign.status,
        description: currentCampaign.description || '',
        goal: currentCampaign.goal,
        start_date: currentCampaign.start_date?.split('T')[0],
        end_date: currentCampaign.end_date?.split('T')[0],
        tags: currentCampaign.tags || [],
        // Load type-specific fields from settings
        ...(currentCampaign.settings || {})
      })
    }
  }, [currentCampaign, isEditing, reset])

  const onSubmit = async (data: CampaignFormValues) => {
    setIsSaving(true)
    
    try {
      // Extract type-specific fields into settings
      const typeSpecificFields: Record<string, any> = {}
      
      switch (data.type) {
        case 'petition':
          typeSpecificFields.petition_text = data.petition_text
          typeSpecificFields.petition_target = data.petition_target
          break
        case 'event':
          typeSpecificFields.event_location = data.event_location
          typeSpecificFields.event_capacity = data.event_capacity
          typeSpecificFields.event_registration_required = data.event_registration_required
          break
        case 'donation':
          typeSpecificFields.donation_target_amount = data.donation_target_amount
          typeSpecificFields.donation_recurring_enabled = data.donation_recurring_enabled
          typeSpecificFields.donation_suggested_amounts = data.donation_suggested_amounts
          break
        case 'email_blast':
          typeSpecificFields.email_subject = data.email_subject
          typeSpecificFields.email_preview_text = data.email_preview_text
          typeSpecificFields.email_sender_name = data.email_sender_name
          break
        case 'phone_bank':
          typeSpecificFields.phone_script = data.phone_script
          typeSpecificFields.phone_call_goal = data.phone_call_goal
          typeSpecificFields.phone_talking_points = data.phone_talking_points
          break
        case 'canvas':
          typeSpecificFields.canvas_area = data.canvas_area
          typeSpecificFields.canvas_volunteer_goal = data.canvas_volunteer_goal
          typeSpecificFields.canvas_literature_needed = data.canvas_literature_needed
          break
        case 'social':
          typeSpecificFields.social_platforms = data.social_platforms
          typeSpecificFields.social_hashtags = data.social_hashtags
          typeSpecificFields.social_content_calendar = data.social_content_calendar
          break
      }
      
      const campaignData: Partial<Campaign> = {
        title: data.title,
        type: data.type,
        status: data.status,
        description: data.description,
        goal: data.goal,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : undefined,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : undefined,
        tags: data.tags,
        settings: typeSpecificFields
      }

      if (isEditing && id) {
        const success = await updateCampaign(id, campaignData)
        if (success) {
          navigate(`/campaigns/${id}`)
        } else {
          alert('Failed to update campaign')
        }
      } else {
        const newCampaign = await createCampaign(campaignData)
        if (newCampaign) {
          navigate(`/campaigns/${newCampaign.id}`)
        } else {
          alert('Failed to create campaign')
        }
      }
    } catch (error) {
      console.error('Error saving campaign:', error)
      alert('Failed to save campaign')
    } finally {
      setIsSaving(false)
    }
  }

  const availableTags = ['urgent', 'featured', 'volunteer', 'fundraising', 'petition', 'event']

  const handleTagToggle = (tag: string) => {
    const currentTags = selectedTags || []
    if (currentTags.includes(tag)) {
      setValue('tags', currentTags.filter(t => t !== tag))
    } else {
      setValue('tags', [...currentTags, tag])
    }
  }

  // Render type-specific fields
  const renderTypeSpecificFields = () => {
    switch (selectedType) {
      case 'petition':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Target className="w-4 h-4 inline mr-1" />
                Petition Target
              </label>
              <input
                {...register('petition_target')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Who is this petition directed to?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4 inline mr-1" />
                Petition Text
              </label>
              <textarea
                {...register('petition_text')}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Write your petition text here..."
              />
            </div>
          </>
        )
        
      case 'event':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Event Location
              </label>
              <input
                {...register('event_location')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Where will the event take place?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Users className="w-4 h-4 inline mr-1" />
                  Capacity
                </label>
                <input
                  {...register('event_capacity', { valueAsNumber: true })}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Max attendees"
                />
              </div>
              <div className="flex items-center pt-6">
                <input
                  {...register('event_registration_required')}
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                />
                <label className="text-sm text-gray-700">
                  Registration Required
                </label>
              </div>
            </div>
          </>
        )
        
      case 'donation':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Fundraising Goal
              </label>
              <input
                {...register('donation_target_amount', { valueAsNumber: true })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Target amount in dollars"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggested Donation Amounts
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 100, 250].map((amount, index) => (
                  <input
                    key={index}
                    {...register(`donation_suggested_amounts.${index}` as any, { valueAsNumber: true })}
                    type="number"
                    defaultValue={amount}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <input
                {...register('donation_recurring_enabled')}
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
              />
              <label className="text-sm text-gray-700">
                Enable recurring donations
              </label>
            </div>
          </>
        )
        
      case 'email_blast':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Subject Line
              </label>
              <input
                {...register('email_subject')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Compelling subject line"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preview Text
              </label>
              <input
                {...register('email_preview_text')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Text that appears in email preview"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sender Name
              </label>
              <input
                {...register('email_sender_name')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Name that appears as sender"
              />
            </div>
          </>
        )
        
      case 'phone_bank':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Call Goal
              </label>
              <input
                {...register('phone_call_goal', { valueAsNumber: true })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Target number of calls"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Call Script
              </label>
              <textarea
                {...register('phone_script')}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Hi, my name is [Name] and I'm calling from..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Talking Points
              </label>
              <div className="space-y-2">
                {[0, 1, 2].map((index) => (
                  <input
                    key={index}
                    {...register(`phone_talking_points.${index}` as any)}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={`Talking point ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </>
        )
        
      case 'canvas':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Canvassing Area
              </label>
              <input
                {...register('canvas_area')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Neighborhood or area to canvass"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users className="w-4 h-4 inline mr-1" />
                Volunteer Goal
              </label>
              <input
                {...register('canvas_volunteer_goal', { valueAsNumber: true })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Number of volunteers needed"
              />
            </div>
            <div className="flex items-center">
              <input
                {...register('canvas_literature_needed')}
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
              />
              <label className="text-sm text-gray-700">
                Literature/flyers needed
              </label>
            </div>
          </>
        )
        
      case 'social':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Share2 className="w-4 h-4 inline mr-1" />
                Social Platforms
              </label>
              <div className="space-y-2">
                {['Facebook', 'Twitter/X', 'Instagram', 'TikTok', 'LinkedIn'].map((platform) => (
                  <label key={platform} className="flex items-center">
                    <input
                      type="checkbox"
                      value={platform}
                      onChange={(e) => {
                        const current = watch('social_platforms') || []
                        if (e.target.checked) {
                          setValue('social_platforms', [...current, platform])
                        } else {
                          setValue('social_platforms', current.filter(p => p !== platform))
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                    />
                    <span className="text-sm text-gray-700">{platform}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag className="w-4 h-4 inline mr-1" />
                Campaign Hashtags
              </label>
              <input
                {...register('social_hashtags.0')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
                placeholder="#YourHashtag"
              />
              <input
                {...register('social_hashtags.1')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="#SecondaryHashtag"
              />
            </div>
            <div className="flex items-center">
              <input
                {...register('social_content_calendar')}
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
              />
              <label className="text-sm text-gray-700">
                Create content calendar
              </label>
            </div>
          </>
        )
        
      default:
        return null
    }
  }

  if (isLoadingCampaign) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/campaigns')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Campaign' : 'Create New Campaign'}
            </h1>
            {template && !isEditing && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-lg">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Using Template: {template.name}</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campaign Type Selection */}
          {!isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Campaign Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaignTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setValue('type', type.value as any)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedType === type.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${
                          selectedType === type.value ? 'text-primary-600' : 'text-gray-400'
                        }`} />
                        <h4 className="font-medium text-gray-900">{type.label}</h4>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Title *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter campaign title"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe your campaign goals and activities"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Goal */}
              <div>
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-1">
                  Goal
                  <span className="text-gray-500 ml-1">
                    ({selectedType === 'petition' ? 'signatures' : 
                      selectedType === 'donation' ? 'donors' : 
                      selectedType === 'event' ? 'attendees' : 'participants'})
                  </span>
                </label>
                <input
                  {...register('goal', { valueAsNumber: true })}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter numeric goal"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    {...register('start_date')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    {...register('end_date')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Type-specific fields */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedType === 'petition' && 'Petition Details'}
                {selectedType === 'event' && 'Event Details'}
                {selectedType === 'donation' && 'Fundraising Details'}
                {selectedType === 'email_blast' && 'Email Campaign Details'}
                {selectedType === 'phone_bank' && 'Phone Bank Details'}
                {selectedType === 'canvas' && 'Canvassing Details'}
                {selectedType === 'social' && 'Social Media Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderTypeSpecificFields()}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/campaigns')}
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
                  {isEditing ? 'Update Campaign' : 'Create Campaign'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}