import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useEventStore } from '@/stores/eventStore'
import { EventService } from './events.service'
import { 
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Filter
} from 'lucide-react'

interface Event {
  id: string
  name: string
  description: string
  date: string
  time: string
  location: string
  type: 'meeting' | 'action' | 'training' | 'social' | 'phonebank'
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  capacity?: number
  registered: number
  organization_id: string
  created_at: string
  created_by: string
}

export function EventsManagement() {
  const navigate = useNavigate()
  const { events, totalEvents, isLoadingEvents, loadEvents, deleteEvent } = useEventStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [showUpcoming, setShowUpcoming] = useState(true)
  const [stats, setStats] = useState({
    thisMonth: 0,
    totalRegistered: 0,
    upcomingCount: 0,
    averageCapacity: 0
  })

  useEffect(() => {
    loadEventsWithFilters()
  }, [searchTerm, showUpcoming])

  useEffect(() => {
    calculateStats()
  }, [events])

  const loadEventsWithFilters = () => {
    loadEvents({
      search: searchTerm,
      upcoming: showUpcoming
    })
  }

  const calculateStats = async () => {
    // Calculate this month's events
    const now = new Date()
    const thisMonthEvents = events.filter(event => {
      const eventDate = new Date(event.start_time)
      return eventDate.getMonth() === now.getMonth() && 
             eventDate.getFullYear() === now.getFullYear()
    })

    // Get total registered across all events
    let totalRegistered = 0
    for (const event of events.slice(0, 5)) { // Sample first 5 for performance
      const { data } = await EventService.getEvent(event.id)
      if (data?.attendee_count) {
        totalRegistered += data.attendee_count
      }
    }

    // Calculate average capacity usage
    const eventsWithCapacity = events.filter(e => e.capacity)
    const avgCapacity = eventsWithCapacity.length > 0 
      ? Math.round(totalRegistered / eventsWithCapacity.reduce((sum, e) => sum + (e.capacity || 0), 0) * 100)
      : 0

    setStats({
      thisMonth: thisMonthEvents.length,
      totalRegistered,
      upcomingCount: events.filter(e => new Date(e.start_time) > new Date()).length,
      averageCapacity: avgCapacity
    })
  }

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) return
    
    const success = await deleteEvent(eventId)
    if (!success) {
      alert('Failed to delete event')
    }
  }

  const formatEventDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatEventTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (isLoadingEvents) {
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
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Events</h1>
              <p className="text-gray-600 mt-1">
                Organize and manage your campaign events
              </p>
            </div>
            <Button onClick={() => navigate('/events/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Registered</p>
                  <p className="text-2xl font-bold">{stats.totalRegistered}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold">{stats.upcomingCount}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Capacity Used</p>
                  <p className="text-2xl font-bold">{stats.averageCapacity}%</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <select
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                <select
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="meeting">Meeting</option>
                  <option value="action">Action</option>
                  <option value="training">Training</option>
                  <option value="social">Social</option>
                  <option value="phonebank">Phone Bank</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {event.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {event.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getEventStatusIcon(event.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                          {event.type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {event.time}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.location}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center text-sm">
                          <Users className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="font-medium">{event.registered}</span>
                          {event.capacity && (
                            <span className="text-gray-500">/{event.capacity} registered</span>
                          )}
                        </div>
                        
                        {event.capacity && (
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-500 h-2 rounded-full"
                              style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/events/${event.id}`)}
                        >
                          View Details
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="p-2"
                          onClick={() => navigate(`/events/${event.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="p-2 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {events.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No events found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first event to get started'}
                </p>
                {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
                  <Button onClick={() => navigate('/events/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}