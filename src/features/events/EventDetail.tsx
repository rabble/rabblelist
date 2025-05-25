import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/common/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { ArrowLeft, Calendar, Clock, MapPin, Users, Edit, Trash2, Loader2, Send, Download, Copy } from 'lucide-react'
import { EventService, type Event } from './events.service'

interface EventWithAttendees extends Event {
  attendee_count?: number
}

export function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventWithAttendees | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      loadEvent(id)
    }
  }, [id])

  const loadEvent = async (eventId: string) => {
    try {
      setLoading(true)
      const { data, error } = await EventService.getEvent(eventId)
      
      if (error || !data) {
        console.error('Failed to load event:', error)
        navigate('/events')
        return
      }
      
      setEvent(data)
    } catch (error) {
      console.error('Failed to load event:', error)
      navigate('/events')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!event || !confirm(`Are you sure you want to delete "${event.name}"? This action cannot be undone.`)) return

    try {
      setDeleting(true)
      const { error } = await EventService.deleteEvent(event.id)
      
      if (error) {
        alert('Failed to delete event')
        return
      }
      
      navigate('/events')
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event')
    } finally {
      setDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    if (!event) return

    try {
      // Create a copy of the event with a new date
      const newDate = new Date(event.start_time)
      newDate.setDate(newDate.getDate() + 7) // Default to 1 week later

      const { data, error } = await EventService.createEvent({
        name: `${event.name} (Copy)`,
        description: event.description,
        start_time: newDate.toISOString(),
        end_time: event.end_time ? new Date(new Date(event.end_time).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        location: event.location,
        is_virtual: event.is_virtual,
        capacity: event.capacity,
        settings: event.settings
      })

      if (error || !data) {
        alert('Failed to duplicate event')
        return
      }

      navigate(`/events/${data.id}/edit`)
    } catch (error) {
      console.error('Error duplicating event:', error)
      alert('Failed to duplicate event')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
            onClick={() => navigate('/events')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.name}</h1>
              <p className="text-lg text-gray-600">{event.description}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => navigate(`/events/${event.id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                className="text-red-600 hover:bg-red-50"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-gray-600">
                    {new Date(event.start_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-gray-600">
                    {new Date(event.start_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-gray-600">{event.location}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Capacity</p>
                  <p className="text-gray-600">
                    {event.capacity} attendees maximum
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registration Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Registered</span>
                    <span className="text-sm text-gray-600">
                      {event.attendee_count || 0} / {event.capacity || '∞'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: event.capacity 
                          ? `${Math.min((event.attendee_count || 0) / event.capacity * 100, 100)}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>
                
                <div className="pt-4 space-y-2">
                  <Button fullWidth onClick={() => navigate(`/events/${event.id}/attendees`)}>
                    View Attendee List
                  </Button>
                  <Button fullWidth variant="outline" onClick={() => navigate(`/events/${event.id}/check-in`)}>
                    Check In Attendees
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => alert('Send reminder feature coming soon!')}>
                <Send className="w-4 h-4 mr-2" />
                Send Reminder
              </Button>
              <Button variant="outline" onClick={() => navigate(`/events/${event.id}/export`)}>
                <Download className="w-4 h-4 mr-2" />
                Export Attendees
              </Button>
              <Button variant="outline" onClick={handleDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}