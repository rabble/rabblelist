import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { 
  Mail,
  MousePointer,
  Eye,
  Send,
  AlertCircle,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Activity,
  Link,
  ExternalLink
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EmailTrackingService } from '@/services/emailTracking.service'
// import type { Database } from '@/lib/database.types'

type EmailEvent = {
  id: string
  campaign_id?: string
  contact_id?: string
  email_address: string
  event_type: 'send' | 'delivered' | 'open' | 'click' | 'bounce' | 'spam' | 'unsubscribe' | 'dropped'
  event_data?: any
  clicked_url?: string
  bounce_reason?: string
  user_agent?: string
  ip_address?: string
  device_type?: string
  email_client?: string
  event_timestamp: string
  created_at: string
  contacts?: {
    full_name: string
    email: string
  }
}

interface EmailStats {
  sent: number
  delivered: number
  opens: number
  uniqueOpens: number
  clicks: number
  uniqueClicks: number
  bounces: number
  complaints: number
  unsubscribes: number
  openRate: number
  clickRate: number
  clickToOpenRate: number
}

interface LinkStats {
  url: string
  clicks: number
  uniqueClicks: number
  percentage: number
}

export function EmailTrackingDashboard() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const trackingService = EmailTrackingService.getInstance()
  const [stats, setStats] = useState<EmailStats>({
    sent: 0,
    delivered: 0,
    opens: 0,
    uniqueOpens: 0,
    clicks: 0,
    uniqueClicks: 0,
    bounces: 0,
    complaints: 0,
    unsubscribes: 0,
    openRate: 0,
    clickRate: 0,
    clickToOpenRate: 0
  })
  const [recentEvents, setRecentEvents] = useState<EmailEvent[]>([])
  const [linkStats, setLinkStats] = useState<LinkStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [campaign, setCampaign] = useState<any>(null)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d')

  useEffect(() => {
    if (campaignId) {
      loadEmailData()
    }
  }, [campaignId, timeRange])

  const loadEmailData = async () => {
    setIsLoading(true)
    try {
      // Get campaign details
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      setCampaign(campaignData)

      // Get email statistics from tracking service
      const emailStats = await trackingService.getCampaignStatistics(campaignId!)
      
      if (emailStats) {
        setStats({
          sent: emailStats.sent,
          delivered: emailStats.delivered,
          opens: emailStats.opened,
          uniqueOpens: emailStats.unique_opens,
          clicks: emailStats.clicked,
          uniqueClicks: emailStats.unique_clicks,
          bounces: emailStats.bounced,
          complaints: emailStats.spam_reports,
          unsubscribes: emailStats.unsubscribed,
          openRate: emailStats.open_rate,
          clickRate: emailStats.click_rate,
          clickToOpenRate: emailStats.unique_opens > 0 
            ? (emailStats.unique_clicks / emailStats.unique_opens) * 100 
            : 0
        })
      }

      // Get tracking events based on time range
      const filters: any = {}
      if (timeRange !== 'all') {
        const now = new Date()
        const startDate = new Date()
        if (timeRange === '24h') {
          startDate.setHours(now.getHours() - 24)
        } else if (timeRange === '7d') {
          startDate.setDate(now.getDate() - 7)
        } else if (timeRange === '30d') {
          startDate.setDate(now.getDate() - 30)
        }
        filters.start_date = startDate.toISOString()
      }

      // Get all tracking events
      const trackingEvents = await trackingService.getCampaignTrackingEvents(campaignId!, filters)
      
      // Filter for recent activity (opens, clicks, bounces, unsubscribes)
      const recentActivity = trackingEvents
        .filter(event => ['open', 'click', 'bounce', 'unsubscribe'].includes(event.event_type))
        .slice(0, 20)
      
      // Fetch contact information for recent events
      const contactIds = [...new Set(recentActivity.map(e => e.contact_id).filter(Boolean))]
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, full_name, email')
        .in('id', contactIds)
      
      const contactMap = new Map(contacts?.map(c => [c.id, c]) || [])
      
      // Map events with contact info
      const recentWithContacts = recentActivity.map(event => ({
        ...event,
        contacts: event.contact_id ? contactMap.get(event.contact_id) : undefined
      })) as any[]
      
      setRecentEvents(recentWithContacts)

      // Get link statistics
      const linkData = await trackingService.getCampaignLinkStats(campaignId!)
      const links: LinkStats[] = linkData.map(link => ({
        url: link.original_url,
        clicks: link.click_count,
        uniqueClicks: link.unique_click_count,
        percentage: 0 // Will calculate after
      }))
      
      // Calculate percentages
      const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0)
      links.forEach(link => {
        link.percentage = totalClicks > 0 ? (link.clicks / totalClicks) * 100 : 0
      })
      
      setLinkStats(links)
    } catch (error) {
      console.error('Error loading email data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'open': return <Eye className="w-4 h-4 text-blue-500" />
      case 'click': return <MousePointer className="w-4 h-4 text-green-500" />
      case 'bounce': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'unsubscribe': return <ExternalLink className="w-4 h-4 text-gray-500" />
      case 'spam': return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'delivered': return <Mail className="w-4 h-4 text-green-400" />
      default: return <Mail className="w-4 h-4 text-gray-400" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/campaigns/${campaignId}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaign
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Email Tracking Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              {campaign?.name} - Email Performance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>

            <Button
              variant="outline"
              onClick={loadEmailData}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sent</p>
                <p className="text-2xl font-bold">{stats.sent}</p>
              </div>
              <Send className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
                <p className="text-xs text-gray-500">
                  {stats.sent > 0 ? `${((stats.delivered / stats.sent) * 100).toFixed(1)}%` : '0%'}
                </p>
              </div>
              <Mail className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Opens</p>
                <p className="text-2xl font-bold">{stats.uniqueOpens}</p>
                <p className="text-xs text-gray-500">
                  {stats.openRate.toFixed(1)}% open rate
                </p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Clicks</p>
                <p className="text-2xl font-bold">{stats.uniqueClicks}</p>
                <p className="text-xs text-gray-500">
                  {stats.clickRate.toFixed(1)}% click rate
                </p>
              </div>
              <MousePointer className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Opens</p>
                <p className="text-xl font-bold">{stats.opens}</p>
              </div>
              <Activity className="w-6 h-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clicks</p>
                <p className="text-xl font-bold">{stats.clicks}</p>
              </div>
              <BarChart3 className="w-6 h-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Click/Open</p>
                <p className="text-xl font-bold">{stats.clickToOpenRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-6 h-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bounces</p>
                <p className="text-xl font-bold">{stats.bounces}</p>
              </div>
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unsubscribes</p>
                <p className="text-xl font-bold">{stats.unsubscribes}</p>
              </div>
              <ExternalLink className="w-6 h-6 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Link Performance */}
        {linkStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Link Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {linkStats.map((link, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {link.url.length > 40 ? link.url.substring(0, 40) + '...' : link.url}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 text-right">
                        {link.clicks} clicks ({link.uniqueClicks} unique)
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${link.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    {getEventIcon(event.event_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.contacts?.full_name || event.email_address || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {event.event_type === 'open' && 'Opened email'}
                        {event.event_type === 'click' && `Clicked ${event.clicked_url || 'link'}`}
                        {event.event_type === 'bounce' && `Email bounced${event.bounce_reason ? `: ${event.bounce_reason}` : ''}`}
                        {event.event_type === 'unsubscribe' && 'Unsubscribed'}
                        {event.event_type === 'spam' && 'Marked as spam'}
                        {event.event_type === 'delivered' && 'Email delivered'}
                      </p>
                      {event.device_type && (
                        <p className="text-xs text-gray-400">
                          {event.device_type} {event.email_client ? `- ${event.email_client}` : ''}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTime(event.event_timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement Timeline */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Engagement Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Engagement timeline visualization would go here</p>
              <p className="text-sm text-gray-400 mt-1">
                Shows opens and clicks over time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}