import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { supabase } from '@/lib/supabase'
import { Phone, Users, Calendar, TrendingUp, UserPlus, Upload, Loader2, Settings, Key, Activity, Database } from 'lucide-react'
import type { Contact } from '@/types'

interface Stats {
  totalContacts: number
  totalCalls: number
  totalEvents: number
  activeRingers: number
}

export function AdminDashboard() {
  const navigate = useNavigate()
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

      // Get organization ID
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) {
        console.error('No organization found')
        return
      }

      // Get stats in parallel
      const [contactsCount, callsCount, eventsCount, ringersCount] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('contact_interactions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('type', 'call'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).neq('role', 'admin')
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
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
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
              <Button 
                className="justify-start" 
                variant="outline"
                onClick={() => navigate('/contacts/import')}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Contacts
              </Button>
              <Button 
                className="justify-start" 
                variant="outline"
                onClick={() => navigate('/admin/invite')}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Users
              </Button>
              <Button 
                className="justify-start" 
                variant="outline"
                onClick={() => navigate('/events/new')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Create Event
              </Button>
              <Button 
                className="justify-start" 
                variant="outline"
                onClick={() => navigate('/admin/custom-fields')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Custom Fields
              </Button>
              <Button 
                className="justify-start" 
                variant="outline"
                onClick={() => navigate('/admin/api-keys')}
              >
                <Key className="w-4 h-4 mr-2" />
                API Keys
              </Button>
              <Button 
                className="justify-start" 
                variant="outline"
                onClick={() => navigate('/contacts/scoring')}
              >
                <Activity className="w-4 h-4 mr-2" />
                Contact Scoring
              </Button>
              <Button 
                className="justify-start" 
                variant="outline"
                onClick={() => navigate('/admin/database-debug')}
              >
                <Database className="w-4 h-4 mr-2" />
                Database Debug
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
  )
}