import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/common/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp,
  Activity,
  ArrowLeft,
  RefreshCw,
  Download,
  Camera,
  UserPlus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { QRScanner } from './QRScanner'

interface AttendanceStats {
  total_registered: number
  checked_in: number
  waitlisted: number
  cancelled: number
  no_shows: number
  check_in_rate: number
  last_check_in?: string
}

interface RecentCheckIn {
  id: string
  first_name: string
  last_name: string
  email: string
  check_in_time: string
  ticket_type?: string
}

export function EventAttendanceDashboard() {
  const { id: eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<any>(null)
  const [stats, setStats] = useState<AttendanceStats>({
    total_registered: 0,
    checked_in: 0,
    waitlisted: 0,
    cancelled: 0,
    no_shows: 0,
    check_in_rate: 0
  })
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (eventId) {
      loadEventData()
      
      // Set up real-time subscription
      const subscription = supabase
        .channel(`event-checkins-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'event_registrations',
            filter: `event_id=eq.${eventId}`
          },
          (payload) => {
            // Refresh data when a check-in occurs
            if (payload.new && (payload.new as any).checked_in) {
              loadAttendanceData()
            }
          }
        )
        .subscribe()

      // Auto-refresh every 30 seconds if enabled
      const interval = autoRefresh ? setInterval(() => {
        loadAttendanceData()
      }, 30000) : null

      return () => {
        subscription.unsubscribe()
        if (interval) clearInterval(interval)
      }
    }
  }, [eventId, autoRefresh])

  const loadEventData = async () => {
    try {
      setLoading(true)
      
      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      await loadAttendanceData()
    } catch (error) {
      console.error('Error loading event data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAttendanceData = async () => {
    if (!eventId) return

    try {
      setRefreshing(true)

      // Get attendance statistics
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)

      if (regError) throw regError

      const total = registrations?.length || 0
      const checkedIn = registrations?.filter(r => r.checked_in).length || 0
      const waitlisted = registrations?.filter(r => r.status === 'waitlisted').length || 0
      const cancelled = registrations?.filter(r => r.status === 'cancelled').length || 0
      const registered = registrations?.filter(r => r.status === 'registered').length || 0
      const noShows = registered - checkedIn

      const lastCheckIn = registrations
        ?.filter(r => r.checked_in && r.check_in_time)
        .sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime())[0]

      setStats({
        total_registered: registered,
        checked_in: checkedIn,
        waitlisted,
        cancelled,
        no_shows: noShows > 0 ? noShows : 0,
        check_in_rate: registered > 0 ? (checkedIn / registered) * 100 : 0,
        last_check_in: lastCheckIn?.check_in_time
      })

      // Get recent check-ins (last 10)
      const recent = registrations
        ?.filter(r => r.checked_in && r.check_in_time)
        .sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime())
        .slice(0, 10)
        .map(r => ({
          id: r.id,
          first_name: r.first_name || r.guest_name?.split(' ')[0] || '',
          last_name: r.last_name || r.guest_name?.split(' ').slice(1).join(' ') || '',
          email: r.email || r.guest_email || '',
          check_in_time: r.check_in_time,
          ticket_type: r.ticket_type
        }))

      setRecentCheckIns(recent || [])
    } catch (error) {
      console.error('Error loading attendance data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const exportAttendanceReport = async () => {
    if (!eventId || !event) return

    try {
      const { data: registrations, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('check_in_time', { ascending: false })

      if (error) throw error

      // Create CSV content
      const headers = ['Name', 'Email', 'Status', 'Checked In', 'Check-in Time', 'Ticket Type']
      const rows = registrations?.map(r => [
        `${r.first_name || r.guest_name || ''} ${r.last_name || ''}`.trim(),
        r.email || r.guest_email || '',
        r.status,
        r.checked_in ? 'Yes' : 'No',
        r.check_in_time ? format(new Date(r.check_in_time), 'yyyy-MM-dd HH:mm:ss') : '',
        r.ticket_type || ''
      ])

      const csv = [
        headers.join(','),
        ...(rows?.map(row => row.map(cell => `"${cell}"`).join(',')) || [])
      ].join('\n')

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${event.name.replace(/[^a-z0-9]/gi, '-')}-attendance-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting attendance:', error)
      alert('Failed to export attendance report')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Activity className="w-12 h-12 animate-pulse text-primary-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading attendance dashboard...</p>
          </div>
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

  const checkInProgress = stats.total_registered > 0 ? (stats.checked_in / stats.total_registered) * 100 : 0

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/events/${eventId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Attendance Dashboard
              </h1>
              <p className="text-lg text-gray-600">{event.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'text-green-600' : ''}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportAttendanceReport}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button
            onClick={() => setShowQRScanner(true)}
            className="h-20 text-lg"
          >
            <Camera className="w-6 h-6 mr-3" />
            Scan QR Code
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/events/${eventId}/check-in/walk-in`)}
            className="h-20 text-lg"
          >
            <UserPlus className="w-6 h-6 mr-3" />
            Walk-in Registration
          </Button>
          <Button
            variant="outline"
            onClick={loadAttendanceData}
            disabled={refreshing}
            className="h-20 text-lg"
          >
            <RefreshCw className={`w-6 h-6 mr-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Registered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.total_registered}</span>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Checked In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">{stats.checked_in}</span>
                <UserCheck className="w-8 h-8 text-green-400" />
              </div>
              <div className="mt-2">
                <div className="text-sm text-gray-600">Check-in Rate</div>
                <div className="text-lg font-semibold">{stats.check_in_rate.toFixed(1)}%</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Waitlisted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-yellow-600">{stats.waitlisted}</span>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                No-shows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-600">{stats.no_shows}</span>
                <TrendingUp className="w-8 h-8 text-red-400 rotate-180" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Check-in Progress */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Check-in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-gray-600">
                    {stats.checked_in} / {stats.total_registered}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${checkInProgress}%` }}
                  />
                </div>
              </div>
              
              {stats.last_check_in && (
                <div className="text-sm text-gray-600">
                  Last check-in: {format(new Date(stats.last_check_in), 'h:mm a')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCheckIns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No check-ins yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCheckIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {checkIn.first_name} {checkIn.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{checkIn.email}</p>
                      {checkIn.ticket_type && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded">
                          {checkIn.ticket_type}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        ✓ Checked in
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(checkIn.check_in_time), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && eventId && (
        <QRScanner
          eventId={eventId}
          onClose={() => setShowQRScanner(false)}
          onSuccess={() => {
            loadAttendanceData()
          }}
        />
      )}
    </Layout>
  )
}