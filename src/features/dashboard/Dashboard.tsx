import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { ContactService } from '@/features/contacts/contacts.service'
import { supabase } from '@/lib/supabase'
import { 
  Phone, 
  Users, 
  Calendar, 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Loader2
} from 'lucide-react'
import type { DashboardStats, CallLog } from '@/types'

export function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    contactsCalledToday: 0,
    upcomingEvents: 0,
    activeRingers: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentCalls, setRecentCalls] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [profile])

  const loadDashboardData = async () => {
    if (!profile) return

    try {
      setLoading(true)

      // Get contact stats
      const contactStats = await ContactService.getContactStats()
      
      // Get upcoming events
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', new Date().toISOString())

      // Get active ringers (users who called today)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data: activeRingerData } = await supabase
        .from('call_logs')
        .select('ringer_id')
        .gte('called_at', today.toISOString())
      
      const uniqueRingers = new Set(activeRingerData?.map(log => log.ringer_id) || [])

      setStats({
        totalContacts: contactStats.totalContacts,
        contactsCalledToday: contactStats.contactsCalledToday,
        upcomingEvents: eventsCount || 0,
        activeRingers: uniqueRingers.size
      })

      // Get recent calls
      const { data: recentCallsData } = await supabase
        .from('call_logs')
        .select(`
          *,
          contacts:contact_id (
            full_name,
            phone
          ),
          ringer:ringer_id (
            full_name
          )
        `)
        .order('called_at', { ascending: false })
        .limit(5)

      setRecentCalls(recentCallsData || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickStats = [
    {
      label: 'Total Contacts',
      value: stats.totalContacts.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => navigate('/contacts')
    },
    {
      label: 'Called Today',
      value: stats.contactsCalledToday.toLocaleString(),
      icon: Phone,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: () => navigate('/contacts/queue')
    },
    {
      label: 'Upcoming Events',
      value: stats.upcomingEvents.toLocaleString(),
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: () => navigate('/events')
    },
    {
      label: 'Active Ringers',
      value: stats.activeRingers.toLocaleString(),
      icon: CheckCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: profile?.role === 'admin' ? () => navigate('/admin') : undefined
    }
  ]

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'answered':
        return 'bg-green-500'
      case 'voicemail':
        return 'bg-yellow-500'
      case 'no_answer':
        return 'bg-gray-500'
      case 'wrong_number':
      case 'disconnected':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
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
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || 'Organizer'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your organizing overview for today
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          {quickStats.map((stat) => (
            <Card 
              key={stat.label}
              className={`${
                stat.action ? 'cursor-pointer transition-transform hover:scale-105 hover:shadow-lg' : ''
              }`}
              onClick={stat.action}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor}`}>
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
                  onClick={() => navigate('/contacts/queue')}
                  className="justify-start h-auto py-4"
                  variant="outline"
                >
                  <Phone className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">Start Calling</p>
                    <p className="text-sm text-gray-600">
                      Begin your contact queue
                    </p>
                  </div>
                </Button>

                <Button 
                  onClick={() => navigate('/contacts/new')}
                  className="justify-start h-auto py-4"
                  variant="outline"
                >
                  <Users className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">Add Contact</p>
                    <p className="text-sm text-gray-600">
                      Create new contact
                    </p>
                  </div>
                </Button>

                <Button 
                  onClick={() => navigate('/events')}
                  className="justify-start h-auto py-4"
                  variant="outline"
                >
                  <Calendar className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">View Events</p>
                    <p className="text-sm text-gray-600">
                      {stats.upcomingEvents} upcoming
                    </p>
                  </div>
                </Button>

                <Button 
                  onClick={() => navigate('/contacts')}
                  className="justify-start h-auto py-4"
                  variant="outline"
                >
                  <TrendingUp className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">Manage Contacts</p>
                    <p className="text-sm text-gray-600">
                      View all contacts
                    </p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Today's Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Calls Made</p>
                    <p className="text-sm text-gray-600">
                      {stats.contactsCalledToday} contacts reached
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Active Team</p>
                    <p className="text-sm text-gray-600">
                      {stats.activeRingers} ringers active today
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Target className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Daily Goal</p>
                    <p className="text-sm text-gray-600">
                      {Math.min(100, Math.round((stats.contactsCalledToday / 50) * 100))}% completed
                    </p>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((stats.contactsCalledToday / 50) * 100))}%` }}
                      />
                    </div>
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
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b last:border-0 gap-2"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        getOutcomeColor(call.outcome)
                      }`} />
                      <div>
                        <p className="font-medium">
                          {call.contacts?.full_name || 'Unknown Contact'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="capitalize">{call.outcome.replace('_', ' ')}</span>
                          {' • '}
                          {new Date(call.called_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {call.ringer && (
                            <>
                              {' • '}
                              <span className="text-gray-500">by {call.ringer.full_name}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    {call.contact_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/contacts/${call.contact_id}`)}
                        className="self-end sm:self-auto"
                      >
                        View
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Phone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  No calls made yet today. Let's get started!
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate('/contacts/queue')}
                >
                  Start Calling
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}