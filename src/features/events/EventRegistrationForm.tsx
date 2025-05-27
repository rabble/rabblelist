import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useEventStore } from '../../stores/eventStore'
import { useEventRegistrationStore } from '../../stores/eventRegistrationStore'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'

const registrationSchema = z.object({
  guest_name: z.string().min(1, 'Name is required'),
  guest_email: z.string().email('Invalid email address'),
  guest_phone: z.string().optional(),
  ticket_type: z.string().optional().default('general'),
  dietary_restrictions: z.string().optional(),
  accessibility_needs: z.string().optional(),
  notes: z.string().optional(),
  custom_fields: z.record(z.any()).optional()
})

type RegistrationFormData = z.infer<typeof registrationSchema>

export default function EventRegistrationForm() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { events, loadEvents } = useEventStore()
  const { 
    registerForEvent, 
    stats, 
    fetchStats,
    registrationFields,
    fetchRegistrationFields,
    loading 
  } = useEventRegistrationStore()
  
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  
  const event = events.find(e => e.id === eventId)
  const eventStats = eventId ? stats[eventId] : null
  const customFields = eventId ? registrationFields[eventId] || [] : []

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      ticket_type: 'general'
    }
  })

  useEffect(() => {
    if (!event && eventId) {
      loadEvents()
    }
    if (eventId) {
      fetchStats(eventId)
      fetchRegistrationFields(eventId)
    }
  }, [eventId, event, loadEvents, fetchStats, fetchRegistrationFields])

  const onSubmit = async (data: RegistrationFormData) => {
    if (!eventId) return
    
    setRegistrationError(null)
    
    try {
      await registerForEvent({
        event_id: eventId,
        ...data
      })
      setRegistrationComplete(true)
    } catch (error: any) {
      console.error('Registration error:', error)
      if (error.message?.includes('unique constraint')) {
        setRegistrationError('You have already registered for this event')
      } else if (error.message?.includes('capacity')) {
        setRegistrationError('This event is at capacity')
      } else {
        setRegistrationError('Failed to register. Please try again.')
      }
    }
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Check if registration is closed
  const isRegistrationClosed = !event.registration_open || 
    (event.registration_deadline && new Date(event.registration_deadline) < new Date())

  // Check if event is at capacity
  const isAtCapacity = event.capacity && 
    eventStats && 
    eventStats.registered_count >= event.capacity &&
    !event.waitlist_enabled

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-16">
          <Card className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Registration Complete!</h2>
            <p className="text-gray-600 mb-6">
              You have successfully registered for {event.name}.
              A confirmation email has been sent to your email address.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Event Details:</p>
              <p className="font-semibold">{event.name}</p>
              <p className="text-sm text-gray-600">
                {new Date(event.start_time).toLocaleDateString()} at{' '}
                {new Date(event.start_time).toLocaleTimeString()}
              </p>
              {event.location && (
                <p className="text-sm text-gray-600">{event.location}</p>
              )}
            </div>
            <Button
              onClick={() => navigate('/')}
              variant="primary"
            >
              Return to Home
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Event Header */}
        <Card className="mb-6">
          <h1 className="text-2xl font-bold mb-4">{event.name}</h1>
          
          <div className="space-y-3 text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>
                {new Date(event.start_time).toLocaleDateString()} 
                {event.end_time && event.end_time !== event.start_time && 
                  ` - ${new Date(event.end_time).toLocaleDateString()}`
                }
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>
                {new Date(event.start_time).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
                {event.end_time && 
                  ` - ${new Date(event.end_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}`
                }
              </span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{event.location}</span>
              </div>
            )}
            
            {event.capacity && eventStats && (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>
                  {eventStats.registered_count} / {event.capacity} registered
                  {eventStats.waitlist_count > 0 && 
                    ` (${eventStats.waitlist_count} on waitlist)`
                  }
                </span>
              </div>
            )}
          </div>
          
          {event.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </Card>

        {/* Registration Form */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Register for this Event</h2>
          
          {isRegistrationClosed && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-800">
                  Registration for this event is closed.
                </p>
              </div>
            </div>
          )}
          
          {isAtCapacity && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">
                  This event is at capacity and not accepting registrations.
                </p>
              </div>
            </div>
          )}
          
          {!isRegistrationClosed && !isAtCapacity && (
            <>
              {event.waitlist_enabled && event.capacity && 
                eventStats && eventStats.registered_count >= event.capacity && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-blue-800">
                      This event is at capacity. You will be added to the waitlist.
                    </p>
                  </div>
                </div>
              )}
              
              {registrationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800">{registrationError}</p>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('guest_name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                  {errors.guest_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.guest_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    {...register('guest_email')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                  {errors.guest_email && (
                    <p className="mt-1 text-sm text-red-600">{errors.guest_email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    {...register('guest_phone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Ticket Type Selection */}
                {event.ticket_types && event.ticket_types.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ticket Type
                    </label>
                    <select
                      {...register('ticket_type')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {event.ticket_types.map((ticket: any) => (
                        <option key={ticket.name} value={ticket.name}>
                          {ticket.name} {ticket.price > 0 && `- $${ticket.price}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dietary Restrictions
                  </label>
                  <input
                    type="text"
                    {...register('dietary_restrictions')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Vegetarian, gluten-free, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accessibility Needs
                  </label>
                  <input
                    type="text"
                    {...register('accessibility_needs')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Wheelchair access, ASL interpretation, etc."
                  />
                </div>

                {/* Custom Fields */}
                {customFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.field_label} {field.required && '*'}
                    </label>
                    
                    {field.field_type === 'text' && (
                      <input
                        type="text"
                        {...register(`custom_fields.${field.field_name}`, {
                          required: field.required ? `${field.field_label} is required` : false
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                    
                    {field.field_type === 'textarea' && (
                      <textarea
                        {...register(`custom_fields.${field.field_name}`, {
                          required: field.required ? `${field.field_label} is required` : false
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                    
                    {field.field_type === 'select' && field.field_options && (
                      <select
                        {...register(`custom_fields.${field.field_name}`, {
                          required: field.required ? `${field.field_label} is required` : false
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        {field.field_options.map((option: any) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any additional information you'd like to share..."
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting || loading}
                  disabled={isSubmitting || loading}
                  className="w-full"
                >
                  {event.waitlist_enabled && event.capacity && 
                    eventStats && eventStats.registered_count >= event.capacity
                    ? 'Join Waitlist'
                    : 'Register for Event'
                  }
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}