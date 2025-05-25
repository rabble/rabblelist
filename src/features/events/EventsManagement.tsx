import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase, isDemoMode } from '@/lib/supabase'
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
  CheckCircle
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
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock events data
  const mockEvents: Event[] = [
    {
      id: '1',
      name: 'Community Climate Action Meeting',
      description: 'Monthly planning meeting for climate action campaigns',
      date: '2024-02-15',
      time: '18:00',
      location: 'Community Center, 123 Main St',
      type: 'meeting',
      status: 'upcoming',
      capacity: 50,
      registered: 32,
      organization_id: '1',
      created_at: new Date().toISOString(),
      created_by: '1'
    },
    {
      id: '2',
      name: 'Phone Banking Session',
      description: 'Call supporters about upcoming legislation',
      date: '2024-02-10',
      time: '14:00',
      location: 'Virtual - Zoom',
      type: 'phonebank',
      status: 'upcoming',
      capacity: 20,
      registered: 15,
      organization_id: '1',
      created_at: new Date().toISOString(),
      created_by: '1'
    },
    {
      id: '3',
      name: 'Direct Action Training',
      description: 'Non-violent direct action training for new members',
      date: '2024-02-20',
      time: '10:00',
      location: 'Peace Center, 456 Oak Ave',
      type: 'training',
      status: 'upcoming',
      capacity: 30,
      registered: 28,
      organization_id: '1',
      created_at: new Date().toISOString(),
      created_by: '1'
    },
    {
      id: '4',
      name: 'Rally for Housing Justice',
      description: 'Public rally to demand affordable housing',
      date: '2024-02-25',
      time: '13:00',
      location: 'City Hall Steps',
      type: 'action',
      status: 'upcoming',
      registered: 150,
      organization_id: '1',
      created_at: new Date().toISOString(),
      created_by: '1'
    }
  ]

  useEffect(() => {
    loadEvents()
  }, [filterStatus, filterType, searchTerm])

  const loadEvents = async () => {
    try {
      setLoading(true)
      
      if (isDemoMode) {
        // Filter mock events
        let filtered = [...mockEvents]
        
        if (filterStatus !== 'all') {
          filtered = filtered.filter(e => e.status === filterStatus)
        }
        
        if (filterType !== 'all') {
          filtered = filtered.filter(e => e.type === filterType)
        }
        
        if (searchTerm) {
          const search = searchTerm.toLowerCase()
          filtered = filtered.filter(e => 
            e.name.toLowerCase().includes(search) ||
            e.description.toLowerCase().includes(search) ||
            e.location.toLowerCase().includes(search)
          )
        }
        
        // Sort by date
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        
        setEvents(filtered)
      } else {
        // Real Supabase query
        let query = supabase
          .from('events')
          .select('*')
          .eq('organization_id', user?.organization_id)
          .order('date', { ascending: true })
        
        if (filterStatus !== 'all') {
          query = query.eq('status', filterStatus)
        }
        
        if (filterType !== 'all') {
          query = query.eq('type', filterType)
        }
        
        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
        }
        
        const { data, error } = await query
        
        if (error) throw error
        setEvents(data || [])
      }
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    
    try {
      if (isDemoMode) {
        setEvents(prev => prev.filter(e => e.id !== eventId))
      } else {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', eventId)
        
        if (error) throw error
        await loadEvents()
      }
    } catch (error) {
      console.error('Failed to delete event:', error)
      alert('Failed to delete event')
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800'
      case 'action': return 'bg-red-100 text-red-800'
      case 'training': return 'bg-purple-100 text-purple-800'
      case 'social': return 'bg-green-100 text-green-800'
      case 'phonebank': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEventStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="w-4 h-4 text-blue-600" />
      case 'ongoing': return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-red-600" />
      default: return null
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
                  <p className="text-2xl font-bold">12</p>
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
                  <p className="text-2xl font-bold">225</p>
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
                  <p className="text-2xl font-bold">{events.filter(e => e.status === 'upcoming').length}</p>
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
                  <p className="text-2xl font-bold">78%</p>
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