import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useCampaignStore } from '@/stores/campaignStore'
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
  Heart
} from 'lucide-react'
import type { Campaign } from '@/types/campaign.types'

const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['petition', 'event', 'donation', 'email_blast', 'phone_bank', 'canvas', 'social', 'email', 'sms', 'phonebank', 'fundraising', 'canvassing']),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled', 'scheduled', 'archived']),
  description: z.string().optional(),
  goal: z.number().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  tags: z.array(z.string()).optional()
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

export function CampaignForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  
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
      tags: []
    }
  })

  const selectedType = watch('type')
  const selectedTags = watch('tags') || []

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
        tags: currentCampaign.tags || []
      })
    }
  }, [currentCampaign, isEditing, reset])

  const onSubmit = async (data: CampaignFormValues) => {
    setIsSaving(true)
    
    try {
      const campaignData: Partial<Campaign> = {
        ...data,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : undefined,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : undefined
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Campaign' : 'Create New Campaign'}
          </h1>
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
                      selectedType === 'donation' ? 'amount' : 
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