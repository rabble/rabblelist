import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase, isDemoMode } from '@/lib/supabase'
import { mockDb } from '@/lib/mockData'
import { Phone, Users, Calendar, TrendingUp, UserPlus, Upload } from 'lucide-react'
import type { Contact } from '@/types'

interface Stats {
  totalContacts: number
  totalCalls: number
  totalEvents: number
  activeRingers: number
}

export function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    totalCalls: 0,
    totalEvents: 0,
    activeRingers: 0
  })
  const [recentContacts, setRecentContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      if (isDemoMode) {
        // Mock data for demo mode
        const contacts = await mockDb.contacts.list()
        const logs = await mockDb.callLogs.list()
        
        setStats({
          totalContacts: contacts.data?.length || 0,
          totalCalls: logs.data?.length || 0,
          totalEvents: 3,
          activeRingers: 1
        })
        
        setRecentContacts(contacts.data?.slice(0, 5) || [])
      } else {
        // Real Supabase queries
        const orgId = user?.organization_id

        // Get stats
        const [contactsCount, callsCount, eventsCount, ringersCount] = await Promise.all([
          supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
          supabase.from('call_logs').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
          supabase.from('events').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('role', 'ringer')
        ])

        setStats({
          totalContacts: contactsCount.count || 0,
          totalCalls: callsCount.count || 0,
          totalEvents: eventsCount.count || 0,
          activeRingers: ringersCount.count || 0
        })

        // Get recent contacts
        const { data: contacts } = await supabase
          .from('contacts')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentContacts(contacts || [])
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Contacts',
      value: stats.totalContacts,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Calls',
      value: stats.totalCalls,
      icon: Phone,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Active Events',
      value: stats.totalEvents,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Active Ringers',
      value: stats.activeRingers,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your organization's contacts and ringers</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="justify-start" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Contacts
              </Button>
              <Button className="justify-start" variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Ringer
              </Button>
              <Button className="justify-start" variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{contact.full_name}</p>
                    <p className="text-sm text-gray-600">{contact.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {contact.tags.join(', ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {contact.last_contact_date 
                        ? `Last contact: ${new Date(contact.last_contact_date).toLocaleDateString()}`
                        : 'Never contacted'}
                    </p>
                  </div>
                </div>
              ))}
              
              {recentContacts.length === 0 && (
                <p className="text-gray-500 text-center py-4">No contacts yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}