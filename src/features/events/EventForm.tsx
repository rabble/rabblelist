import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useEventStore } from '@/stores/eventStore'
import { EventService, type RecurrenceRule } from './events.service'
import { RecurrenceSettings } from './RecurrenceSettings'
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Save,
  ArrowLeft,
  Loader2,
  Globe,
} from 'lucide-react'

// Validation schema
const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_date: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  is_virtual: z.boolean(),
  capacity: z.coerce.number().positive().optional().or(z.literal('')),
})

type EventFormValues = z.infer<typeof eventSchema>

export function EventForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  
  const { createEvent, updateEvent } = useEventStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [, setExistingEvent] = useState<any>(null)
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      description: '',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
      location: '',
      is_virtual: false,
      capacity: ''
    }
  })

  const isVirtual = watch('is_virtual')

  useEffect(() => {
    if (isEditing && id) {
      loadEvent()
    }
  }, [id])

  const loadEvent = async () => {
    if (!id) return
    
    setIsLoading(true)
    try {
      const { data, error } = await EventService.getEvent(id)
      
      if (error || !data) {
        alert('Event not found')
        navigate('/events')
        return
      }
      
      setExistingEvent(data)
      
      // Parse dates and times
      const startDate = new Date(data.start_time)
      const endDate = data.end_time ? new Date(data.end_time) : null
      
      // Populate form
      reset({
        name: data.name,
        description: data.description || '',
        start_date: startDate.toISOString().split('T')[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_date: endDate ? endDate.toISOString().split('T')[0] : '',
        end_time: endDate ? endDate.toTimeString().slice(0, 5) : '',
        location: data.location,
        is_virtual: data.is_virtual,
        capacity: data.capacity || ''
      })
    } catch (error) {
      console.error('Error loading event:', error)
      alert('Failed to load event')
      navigate('/events')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: EventFormValues) => {
    setIsSaving(true)
    
    try {
      // Combine date and time
      const startDateTime = new Date(`${data.start_date}T${data.start_time}`)
      let endDateTime = null
      
      if (data.end_date && data.end_time) {
        endDateTime = new Date(`${data.end_date}T${data.end_time}`)
      }
      
      const eventData = {
        name: data.name,
        description: data.description || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime ? endDateTime.toISOString() : null,
        location: data.location,
        is_virtual: data.is_virtual,
        capacity: data.capacity ? Number(data.capacity) : null,
        settings: {},
        recurrence_rule: recurrenceRule as any // Cast to any for JSON compatibility
      }
      
      if (isEditing && id) {
        // Update existing event
        const success = await updateEvent(id, eventData)
        if (success) {
          navigate(`/events/${id}`)
        } else {
          alert('Failed to update event')
        }
      } else {
        // Create new event
        const newEvent = await createEvent(eventData)
        
        if (newEvent) {
          navigate(`/events/${newEvent.id}`)
        } else {
          alert('Failed to create event')
        }
      }
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Failed to save event')
    } finally {
      setIsSaving(false)
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
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Event Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Community Meeting"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the event..."
                  rows={3}
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Start Date *
                  </label>
                  <input
                    {...register('start_date')}
                    type="date"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.start_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.start_date && (
                    <p className="text-sm text-red-600 mt-1">{errors.start_date.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Start Time *
                  </label>
                  <input
                    {...register('start_time')}
                    type="time"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.start_time ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.start_time && (
                    <p className="text-sm text-red-600 mt-1">{errors.start_time.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    {...register('end_date')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    {...register('end_time')}
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location *
                </label>
                <div className="space-y-3">
                  <input
                    {...register('location')}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.location ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={isVirtual ? "Zoom Meeting Link" : "123 Main St, City, State"}
                  />
                  {errors.location && (
                    <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
                  )}
                  
                  <label className="flex items-center">
                    <input
                      {...register('is_virtual')}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <Globe className="w-4 h-4 mr-1" />
                    This is a virtual event
                  </label>
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  <Users className="w-4 h-4 inline mr-1" />
                  Capacity (optional)
                </label>
                <input
                  {...register('capacity')}
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              {/* Recurrence Settings */}
              <div className="border-t pt-4">
                <RecurrenceSettings
                  recurrenceRule={recurrenceRule || undefined}
                  onChange={setRecurrenceRule}
                />
              </div>

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
                      {isEditing ? 'Update Event' : 'Create Event'}
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