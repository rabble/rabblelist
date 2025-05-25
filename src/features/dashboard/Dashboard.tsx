import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase, isDemoMode } from '@/lib/supabase'
import { mockDb } from '@/lib/mockData'
import { 
  Phone, 
  Users, 
  Calendar, 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react'

interface DashboardStats {
  assignedContacts: number
  callsToday: number
  callsThisWeek: number
  completionRate: number
  upcomingEvents: number
  activePathways: number
}

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    assignedContacts: 0,
    callsToday: 0,
    callsThisWeek: 0,
    completionRate: 0,
    upcomingEvents: 0,
    activePathways: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentCalls, setRecentCalls] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      if (isDemoMode) {
        // Mock data for demo mode
        const contacts = await mockDb.contacts.listByUser(user?.id || '')
        const logs = await mockDb.callLogs.list()
        
        // Calculate stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        
        const todayLogs = logs.data?.filter((log: any) => 
          new Date(log.created_at) >= today
        ) || []
        
        const weekLogs = logs.data?.filter((log: any) => 
          new Date(log.created_at) >= weekAgo
        ) || []
        
        const completedCalls = logs.data?.filter((log: any) => 
          log.outcome === 'completed' || log.outcome === 'answered'
        ).length || 0
        
        setStats({
          assignedContacts: contacts.data?.length || 0,
          callsToday: todayLogs.length,
          callsThisWeek: weekLogs.length,
          completionRate: logs.data?.length ? 
            Math.round((completedCalls / logs.data.length) * 100) : 0,
          upcomingEvents: 2,
          activePathways: 3
        })
        
        setRecentCalls(logs.data?.slice(0, 5) || [])
      } else {
        // Real Supabase queries
        const userId = user?.id
        const orgId = user?.organization_id
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)

        // Get assigned contacts count
        const { count: contactsCount } = await supabase
          .from('contact_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'active')

        // Get calls data
        const { data: todayCalls } = await supabase
          .from('call_logs')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .gte('created_at', today.toISOString())

        const { data: weekCalls } = await supabase
          .from('call_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', weekAgo.toISOString())

        // Calculate completion rate
        const completedCalls = weekCalls?.filter(call => 
          call.outcome === 'completed' || call.outcome === 'answered'
        ).length || 0
        
        const completionRate = weekCalls?.length ? 
          Math.round((completedCalls / weekCalls.length) * 100) : 0

        // Get upcoming events count
        const { count: eventsCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .gte('date', new Date().toISOString())

        setStats({
          assignedContacts: contactsCount || 0,
          callsToday: todayCalls?.length || 0,
          callsThisWeek: weekCalls?.length || 0,
          completionRate,
          upcomingEvents: eventsCount || 0,
          activePathways: 3 // This would come from pathways table
        })

        // Get recent calls
        const { data: recentCallsData } = await supabase
          .from('call_logs')
          .select(`
            *,
            contacts (
              full_name,
              phone
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentCalls(recentCallsData || [])
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickStats = [
    {
      label: 'Contacts Assigned',
      value: stats.assignedContacts,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => navigate('/contacts')
    },
    {
      label: 'Calls Today',
      value: stats.callsToday,
      icon: Phone,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: () => navigate('/contacts')
    },
    {
      label: 'This Week',
      value: stats.callsThisWeek,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: CheckCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

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
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || user?.full_name || 'Organizer'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your organizing overview for today
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat) => (
            <Card 
              key={stat.label}
              className={`cursor-pointer transition-transform hover:scale-105 ${
                stat.action ? 'hover:shadow-lg' : ''
              }`}
              onClick={stat.action}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  onClick={() => navigate('/contacts')}
                  className="justify-start h-auto py-4"
                  variant="outline"
                >
                  <Phone className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Start Calling</p>
                    <p className="text-sm text-gray-600">
                      {stats.assignedContacts} contacts in queue
                    </p>
                  </div>
                </Button>

                <Button 
                  onClick={() => navigate('/events')}
                  className="justify-start h-auto py-4"
                  variant="outline"
                >
                  <Calendar className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">View Events</p>
                    <p className="text-sm text-gray-600">
                      {stats.upcomingEvents} upcoming
                    </p>
                  </div>
                </Button>

                <Button 
                  onClick={() => navigate('/pathways')}
                  className="justify-start h-auto py-4"
                  variant="outline"
                >
                  <Target className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Pathways</p>
                    <p className="text-sm text-gray-600">
                      {stats.activePathways} active paths
                    </p>
                  </div>
                </Button>

                <Button 
                  onClick={() => navigate('/reports')}
                  className="justify-start h-auto py-4"
                  variant="outline"
                >
                  <TrendingUp className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">View Reports</p>
                    <p className="text-sm text-gray-600">
                      Track your progress
                    </p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Today's Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Make 20 calls</p>
                    <p className="text-sm text-gray-600">
                      {stats.callsToday}/20 completed
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Follow up with flagged contacts</p>
                    <p className="text-sm text-gray-600">
                      3 contacts need attention
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Target className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Complete pathway check-ins</p>
                    <p className="text-sm text-gray-600">
                      2 members ready for next step
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCalls.length > 0 ? (
              <div className="space-y-3">
                {recentCalls.map((call) => (
                  <div 
                    key={call.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        call.outcome === 'completed' ? 'bg-green-500' :
                        call.outcome === 'voicemail' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`} />
                      <div>
                        <p className="font-medium">
                          {call.contacts?.full_name || 'Unknown Contact'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {call.outcome || 'No outcome'} • {
                            new Date(call.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/contacts/${call.contact_id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No calls made yet today. Let's get started!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}