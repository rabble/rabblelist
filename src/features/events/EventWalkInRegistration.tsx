import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/common/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { 
  ArrowLeft, 
  UserPlus, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { useAuthStore } from '@/stores/authStore'
import { useContactStore } from '@/stores/contactStore'
import { QRCodeService } from '@/services/qrcode.service'
import { EventQRCode } from './EventQRCode'

const walkInSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  organization: z.string().optional(),
  ticket_type: z.string().optional(),
  notes: z.string().optional()
})

type WalkInFormData = z.infer<typeof walkInSchema>

export function EventWalkInRegistration() {
  const { id: eventId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentOrganizationId } = useAuthStore()
  const { contacts, searchContacts } = useContactStore()
  
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registration, setRegistration] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<WalkInFormData>({
    resolver: zodResolver(walkInSchema)
  })

  useEffect(() => {
    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  const loadEvent = async () => {
    try {
      setLoading(true)
      
      const { data: eventData, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error) throw error
      setEvent(eventData)
    } catch (error) {
      console.error('Error loading event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    const results = await searchContacts(query)
    setSearchResults(results.slice(0, 5))
  }

  const selectContact = (contact: any) => {
    setSelectedContact(contact)
    setValue('first_name', contact.first_name || '')
    setValue('last_name', contact.last_name || '')
    setValue('email', contact.email || '')
    setValue('phone', contact.phone || '')
    setValue('organization', contact.organization || '')
    setSearchResults([])
    setSearchQuery('')
  }

  const onSubmit = async (data: WalkInFormData) => {
    if (!eventId || !user) return

    try {
      setSubmitting(true)

      // Check if already registered
      const { data: existing, error: checkError } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('email', data.email)
        .single()

      if (existing) {
        alert('This person is already registered for this event')
        return
      }

      // Create registration
      const { data: newReg, error: regError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          contact_id: selectedContact?.id || null,
          status: 'registered',
          registration_date: new Date().toISOString(),
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          guest_name: selectedContact ? null : `${data.first_name} ${data.last_name}`,
          guest_email: selectedContact ? null : data.email,
          ticket_type: data.ticket_type,
          notes: data.notes,
          // Auto check-in for walk-ins
          checked_in: true,
          check_in_time: new Date().toISOString(),
          checked_in_by: user.id
        })
        .select()
        .single()

      if (regError) throw regError

      // If no existing contact, create one
      if (!selectedContact && data.email && currentOrganizationId) {
        const { error: contactError } = await supabase
          .from('contacts')
          .insert({
            organization_id: currentOrganizationId,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            organization: data.organization,
            source: 'walk_in_registration',
            tags: ['event_attendee', 'walk_in']
          })

        if (contactError) {
          console.error('Error creating contact:', contactError)
        }
      }

      setRegistration(newReg)
      setSuccess(true)
    } catch (error) {
      console.error('Error creating walk-in registration:', error)
      alert('Failed to create registration')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNewRegistration = () => {
    setSuccess(false)
    setRegistration(null)
    setSelectedContact(null)
    reset()
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </Layout>
    )
  }

  if (!event) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
            <p className="text-gray-600 mb-4">This event doesn't exist or has been deleted.</p>
            <Button onClick={() => navigate('/events')}>
              Back to Events
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/events/${eventId}/attendance`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Attendance Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Walk-in Registration
          </h1>
          <p className="text-lg text-gray-600">{event.name}</p>
        </div>

        {success && registration ? (
          <div className="space-y-6">
            {/* Success Message */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Successfully Registered & Checked In!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {registration.first_name} {registration.last_name} has been registered and checked in.
                  </p>
                  
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={handleNewRegistration}
                      variant="primary"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      Register Another Person
                    </Button>
                    <Button
                      onClick={() => navigate(`/events/${eventId}/attendance`)}
                      variant="outline"
                    >
                      Back to Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code for future use */}
            <EventQRCode
              eventId={eventId!}
              eventName={event.name}
              registration={registration}
            />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Registration Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Contact Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Existing Contact
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {searchResults.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => selectContact(contact)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50"
                      >
                        <p className="font-medium">{contact.full_name}</p>
                        <p className="text-sm text-gray-600">{contact.email}</p>
                      </button>
                    ))}
                  </div>
                )}

                {selectedContact && (
                  <div className="mt-2 p-3 bg-primary-50 rounded-md">
                    <p className="text-sm font-medium text-primary-800">
                      Selected: {selectedContact.full_name} ({selectedContact.email})
                    </p>
                  </div>
                )}
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      {...register('first_name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      {...register('last_name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organization
                    </label>
                    <input
                      {...register('organization')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ticket Type
                  </label>
                  <select
                    {...register('ticket_type')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select ticket type</option>
                    <option value="general">General Admission</option>
                    <option value="vip">VIP</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="speaker">Speaker</option>
                    <option value="press">Press</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Any special requirements or notes..."
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Walk-in Registration Notice</p>
                      <p>This person will be automatically checked in upon registration.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        Register & Check In
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/events/${eventId}/attendance`)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}