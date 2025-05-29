import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Download, 
  QrCode,
  Search,
  CheckCircle,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'

interface EventRegistration {
  id: string
  event_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  status: string
  checked_in: boolean
  check_in_time?: string
  ticket_type?: string
  additional_info?: string
  created_at: string
}

export function EventAttendanceDashboard() {
  const { id: eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<any>(null)
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked-in' | 'not-checked-in'>('all')

  useEffect(() => {
    if (eventId) {
      loadEventAndRegistrations()
    }
  }, [eventId])

  const loadEventAndRegistrations = async () => {
    try {
      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // Load registrations
      const { data: regData, error: regError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (regError) throw regError
      setRegistrations(regData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickCheckIn = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({
          checked_in: true,
          check_in_time: new Date().toISOString(),
          status: 'attended'
        })
        .eq('id', registrationId)

      if (error) throw error

      // Update local state
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId 
          ? { ...reg, checked_in: true, check_in_time: new Date().toISOString(), status: 'attended' }
          : reg
      ))
    } catch (error) {
      console.error('Failed to check in:', error)
      alert('Failed to check in attendee')
    }
  }

  const exportAttendees = () => {
    const csvContent = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Ticket Type', 'Status', 'Checked In', 'Check-in Time'],
      ...registrations.map(reg => [
        reg.first_name,
        reg.last_name,
        reg.email,
        reg.phone || '',
        reg.ticket_type || '',
        reg.status,
        reg.checked_in ? 'Yes' : 'No',
        reg.check_in_time ? format(new Date(reg.check_in_time), 'yyyy-MM-dd HH:mm') : ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event?.name || 'event'}-attendance-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filter registrations
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = searchTerm === '' || 
      `${reg.first_name} ${reg.last_name} ${reg.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'checked-in' && reg.checked_in) ||
      (filterStatus === 'not-checked-in' && !reg.checked_in)

    return matchesSearch && matchesFilter
  })

  // Calculate statistics
  const stats = {
    total: registrations.length,
    checkedIn: registrations.filter(r => r.checked_in).length,
    notCheckedIn: registrations.filter(r => !r.checked_in).length,
    attendanceRate: registrations.length > 0 
      ? Math.round((registrations.filter(r => r.checked_in).length / registrations.length) * 100)
      : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Dashboard</h1>
          <p className="text-gray-600">{event?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/events/${eventId}/check-in/qr`)}
          >
            <QrCode className="w-4 h-4 mr-2" />
            QR Scanner
          </Button>
          <Button
            variant="outline"
            onClick={exportAttendees}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Registered</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Checked In</p>
                <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Not Checked In</p>
                <p className="text-2xl font-bold text-red-600">{stats.notCheckedIn}</p>
              </div>
              <UserX className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</p>
              </div>
              <div className="relative w-16 h-16">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - stats.attendanceRate / 100)}`}
                    className="text-blue-600"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendee List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendees</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search attendees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Attendees</option>
                <option value="checked-in">Checked In</option>
                <option value="not-checked-in">Not Checked In</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRegistrations.map(registration => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {registration.first_name} {registration.last_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{registration.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {registration.ticket_type || 'General'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {registration.checked_in ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Not Checked In
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {registration.check_in_time 
                        ? format(new Date(registration.check_in_time), 'h:mm a')
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {!registration.checked_in && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickCheckIn(registration.id)}
                        >
                          Check In
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRegistrations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No attendees found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}