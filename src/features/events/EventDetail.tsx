import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Edit, 
  Trash2, 
  Loader2, 
  Send, 
  Download, 
  Copy,
  UserCheck,
  ExternalLink,
  CheckCircle
} from 'lucide-react'
import { useEventStore } from '@/stores/eventStore'
import { useEventRegistrationStore } from '@/stores/eventRegistrationStore'

export function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { events, loadEvents, deleteEvent } = useEventStore()
  const { 
    registrations, 
    stats, 
    fetchRegistrations, 
    fetchStats,
    checkInAttendee,
    exportRegistrations 
  } = useEventRegistrationStore()
  
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const event = events.find(e => e.id === id)
  const eventRegistrations = id ? registrations[id] || [] : []
  const eventStats = id ? stats[id] : null

  useEffect(() => {
    if (id) {
      loadEventData(id)
    }
  }, [id])

  const loadEventData = async (eventId: string) => {
    try {
      setLoading(true)
      await Promise.all([
        loadEvents(),
        fetchRegistrations(eventId),
        fetchStats(eventId)
      ])
    } catch (error) {
      console.error('Failed to load event data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!event || !confirm(`Are you sure you want to delete "${event.name}"? This action cannot be undone.`)) return

    try {
      setDeleting(true)
      await deleteEvent(event.id)
      navigate('/events')
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event')
    } finally {
      setDeleting(false)
    }
  }

  const handleExport = async () => {
    if (!id) return
    
    try {
      const csv = await exportRegistrations(id)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${event?.name.replace(/[^a-z0-9]/gi, '-')}-registrations.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting registrations:', error)
      alert('Failed to export registrations')
    }
  }

  const handleCheckIn = async (registrationId: string) => {
    try {
      await checkInAttendee(registrationId)
    } catch (error) {
      console.error('Error checking in attendee:', error)
      alert('Failed to check in attendee')
    }
  }

  const copyRegistrationLink = () => {
    if (!id) return
    const link = `${window.location.origin}/events/${id}/register`
    navigator.clipboard.writeText(link)
    alert('Registration link copied to clipboard!')
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
      <div className="p-6 max-w-6xl mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Event Information</h3>
              <div className="space-y-4">
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
                
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-600">{event.location}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Capacity</p>
                    <p className="text-gray-600">
                      {event.capacity || 'Unlimited'} attendees
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4">Registration Status</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Registered</span>
                    <span className="text-sm text-gray-600">
                      {eventStats?.registered_count || 0} / {event.capacity || '∞'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: event.capacity 
                          ? `${Math.min((eventStats?.registered_count || 0) / event.capacity * 100, 100)}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>
                
                {eventStats && eventStats.waitlist_count > 0 && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{eventStats.waitlist_count}</span> on waitlist
                  </div>
                )}
                
                {eventStats && eventStats.cancelled_count > 0 && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{eventStats.cancelled_count}</span> cancelled
                  </div>
                )}
                
                <div className="pt-4 space-y-2">
                  <Button 
                    fullWidth 
                    variant="primary"
                    onClick={copyRegistrationLink}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Registration Link
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outline"
                    onClick={() => window.open(`/events/${id}/register`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Registration Page
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  fullWidth 
                  variant="outline" 
                  onClick={() => alert('Send reminder feature coming soon!')}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Reminder
                </Button>
                <Button 
                  fullWidth 
                  variant="outline" 
                  onClick={handleExport}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Registrations
                </Button>
              </div>
            </Card>
          </div>

          {/* Registrations List */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Registrations</h3>
                <div className="text-sm text-gray-500">
                  {eventStats?.checked_in_count || 0} checked in
                </div>
              </div>

              {eventRegistrations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium mb-1">No registrations yet</p>
                  <p className="text-sm">Share the registration link to start collecting sign-ups</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {eventRegistrations.map(registration => (
                    <div
                      key={registration.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">
                              {registration.contact?.full_name || registration.guest_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {registration.contact?.email || registration.guest_email}
                            </p>
                            <p className="text-xs text-gray-500">
                              Registered {new Date(registration.registration_date).toLocaleDateString()}
                            </p>
                          </div>
                          {registration.status === 'waitlisted' && (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                              Waitlisted
                            </span>
                          )}
                          {registration.status === 'cancelled' && (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {registration.checked_in ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Checked In</span>
                          </div>
                        ) : registration.status === 'registered' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckIn(registration.id)}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Check In
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}