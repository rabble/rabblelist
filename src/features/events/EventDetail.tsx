import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/common/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { ArrowLeft, Calendar, Clock, MapPin, Users, Edit, Trash2 } from 'lucide-react'
import { supabase, isDemoMode } from '@/lib/supabase'
import { mockDb } from '@/lib/mockData'
import type { Event } from '@/types'

export function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadEvent(id)
    }
  }, [id])

  const loadEvent = async (eventId: string) => {
    try {
      setLoading(true)
      
      if (isDemoMode) {
        const result = await mockDb.events.get(eventId)
        setEvent(result.data)
      } else {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single()
        
        if (error) throw error
        setEvent(data)
      }
    } catch (error) {
      console.error('Failed to load event:', error)
      navigate('/events')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" className="text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
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
                      0 / {event.capacity || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${event.capacity ? Math.min((0 / event.capacity) * 100, 100) : 0}%`
                      }}
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button fullWidth>
                    View Attendee List
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
              <Button variant="outline">
                Send Reminder
              </Button>
              <Button variant="outline">
                Export Attendees
              </Button>
              <Button variant="outline">
                Duplicate Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}