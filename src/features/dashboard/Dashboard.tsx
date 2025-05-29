import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  CheckCircle,
  TrendingUp,
  Loader2
} from 'lucide-react'
import type { DashboardStats } from '@/types'

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
    try {
      setLoading(true)

      // Get contact stats
      const { data: contacts } = await ContactService.getContacts()
      const contactStats = {
        total: contacts?.length || 0,
        new: contacts?.filter(c => {
          const createdDate = new Date(c.created_at)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return createdDate > thirtyDaysAgo
        }).length || 0
      }
      
      // Get upcoming events
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', new Date().toISOString())

      // Get active ringers (users who called today)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data: activeRingerData } = await supabase
        .from('contact_interactions')
        .select('user_id')
        .eq('type', 'call')
        .gte('created_at', today.toISOString())
      
      const uniqueRingers = new Set(activeRingerData?.map(log => log.user_id).filter(Boolean) || [])

      setStats({
        totalContacts: contactStats?.total || 0,
        contactsCalledToday: 0, // TODO: implement this metric
        upcomingEvents: eventsCount || 0,
        activeRingers: uniqueRingers?.size || 0
      })

      // Get recent calls
      const { data: recentCallsData } = await supabase
        .from('contact_interactions')
        .select(`
          *,
          contacts:contact_id (
            full_name,
            phone
          ),
          users:user_id (
            full_name
          )
        `)
        .eq('type', 'call')
        .order('created_at', { ascending: false })
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
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      action: () => navigate('/contacts')
    },
    {
      label: 'Called Today',
      value: stats.contactsCalledToday.toLocaleString(),
      icon: Phone,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      action: () => navigate('/contacts/queue')
    },
    {
      label: 'Upcoming Events',
      value: stats.upcomingEvents.toLocaleString(),
      icon: Calendar,
      color: 'text-primary-700',
      bgColor: 'bg-primary-100',
      action: () => navigate('/events')
    },
    {
      label: 'Active Ringers',
      value: stats.activeRingers.toLocaleString(),
      icon: CheckCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      action: profile?.role === 'admin' ? () => navigate('/admin') : undefined
    }
  ]

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'answered':
        return 'bg-primary-500'
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
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 sm:mb-8">
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

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions and Today's Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
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
                    <Phone className="w-5 h-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Calls Made</p>
                      <p className="text-sm text-gray-600">
                        {stats.contactsCalledToday} contacts reached
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Active Team</p>
                      <p className="text-sm text-gray-600">
                        {stats.activeRingers} ringers active today
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Target className="w-5 h-5 text-primary-700 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Daily Goal</p>
                      <p className="text-sm text-gray-600">
                        {Math.min(100, Math.round((stats.contactsCalledToday / 50) * 100))}% completed
                      </p>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-600 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((stats.contactsCalledToday / 50) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recent Calls */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Recent Calls</CardTitle>
            </CardHeader>
            <CardContent>
              {recentCalls.length > 0 ? (
                <div className="space-y-3">
                  {recentCalls.map((call) => (
                    <div 
                      key={call.id}
                      className="flex flex-col py-3 border-b last:border-0 gap-2"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                          getOutcomeColor(call.outcome)
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {call.contacts?.full_name || 'Unknown Contact'}
                          </p>
                          <p className="text-xs text-gray-600">
                            <span className="capitalize">{call.outcome.replace('_', ' ')}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(call.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {call.users && (
                            <p className="text-xs text-gray-500">
                              by {call.users.full_name}
                            </p>
                          )}
                        </div>
                      </div>
                      {call.contact_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/contacts/${call.contact_id}`)}
                          className="w-full"
                        >
                          View Contact
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Phone className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    No calls made yet today
                  </p>
                  <Button 
                    size="sm"
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
    </div>
  )
}