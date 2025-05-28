import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { 
  CheckCircle, 
  XCircle, 
  Calendar,
  MapPin,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export function EventCheckIn() {
  const { eventId, registrationId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [registration, setRegistration] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (eventId && registrationId) {
      loadRegistrationAndEvent()
    }
  }, [eventId, registrationId])

  const loadRegistrationAndEvent = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load registration with event details
      const { data: regData, error: regError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events (
            id,
            name,
            description,
            location,
            start_time,
            end_time,
            settings
          )
        `)
        .eq('id', registrationId)
        .eq('event_id', eventId)
        .single()

      if (regError || !regData) {
        setError('Registration not found or invalid link')
        return
      }

      setRegistration(regData)
      setEvent(regData.events)

      // Check if already checked in
      if (regData.checked_in) {
        setSuccess(true)
      }
    } catch (err) {
      console.error('Error loading registration:', err)
      setError('Failed to load registration details')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!registration || !eventId) return

    try {
      setCheckingIn(true)
      setError(null)

      // Perform check-in
      const { error: updateError } = await supabase
        .from('event_registrations')
        .update({
          checked_in: true,
          check_in_time: new Date().toISOString(),
          status: 'attended'
        })
        .eq('id', registrationId)
        .eq('event_id', eventId)

      if (updateError) {
        setError('Failed to check in. Please try again.')
        return
      }

      setSuccess(true)
      setRegistration({ ...registration, checked_in: true, check_in_time: new Date().toISOString() })
    } catch (err) {
      console.error('Check-in error:', err)
      setError('An error occurred during check-in')
    } finally {
      setCheckingIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading registration details...</p>
        </div>
      </div>
    )
  }

  if (error && !registration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Check-in Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => navigate('/')} variant="outline">
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Event Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{event?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {event?.start_time && format(new Date(event.start_time), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {event?.start_time && format(new Date(event.start_time), 'h:mm a')} - 
                  {event?.end_time && format(new Date(event.end_time), 'h:mm a')}
                </span>
              </div>
              {event?.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Check-in Status */}
        <Card>
          <CardHeader>
            <CardTitle>Event Check-in</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Attendee Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Registration Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Name:</span> <span className="font-medium">{registration?.first_name} {registration?.last_name}</span></p>
                  <p><span className="text-gray-600">Email:</span> <span className="font-medium">{registration?.email}</span></p>
                  {registration?.ticket_type && (
                    <p><span className="text-gray-600">Ticket Type:</span> <span className="font-medium">{registration.ticket_type}</span></p>
                  )}
                </div>
              </div>

              {/* Check-in Status */}
              {success || registration?.checked_in ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Checked In!</h2>
                  <p className="text-gray-600 mb-1">Welcome to {event?.name}</p>
                  {registration?.check_in_time && (
                    <p className="text-sm text-gray-500">
                      Checked in at {format(new Date(registration.check_in_time), 'h:mm a')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to check in?</h3>
                  <p className="text-gray-600 mb-6">Click the button below to confirm your attendance</p>
                  
                  <Button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {checkingIn ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Checking in...
                      </>
                    ) : (
                      'Check Me In'
                    )}
                  </Button>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Event Description */}
              {event?.description && (
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-2">About This Event</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}