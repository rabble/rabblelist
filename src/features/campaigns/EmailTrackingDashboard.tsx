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
// import { EmailService } from '@/services/email.service'
// import type { Database } from '@/lib/database.types'

type EmailEvent = {
  id: string
  campaign_id: string
  contact_id: string
  type: 'email' | 'sms' | 'call'
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
  metadata: any
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

      // Get email communication logs for this campaign
      let query = supabase
        .from('communication_logs')
        .select(`
          *,
          contacts(full_name, email)
        `)
        .eq('campaign_id', campaignId)
        .eq('type', 'email')

      // Apply time range filter
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
        query = query.gte('created_at', startDate.toISOString())
      }

      const { data: emailLogs } = await query

      // Calculate statistics
      const sentEmails = emailLogs?.filter(log => log.status === 'sent') || []
      const deliveredEmails = emailLogs?.filter(log => 
        ['sent', 'opened', 'clicked'].includes(log.status || '')
      ) || []
      const openedEmails = emailLogs?.filter(log => 
        ['opened', 'clicked'].includes(log.status || '')
      ) || []
      const clickedEmails = emailLogs?.filter(log => log.status === 'clicked') || []
      const bouncedEmails = emailLogs?.filter(log => log.status === 'bounced') || []
      const complaintEmails = emailLogs?.filter(log => log.status === 'complained') || []
      const unsubscribedEmails = emailLogs?.filter(log => log.status === 'unsubscribed') || []

      // Get unique opens and clicks by contact
      const uniqueOpens = new Set(openedEmails.map(e => e.contact_id)).size
      const uniqueClicks = new Set(clickedEmails.map(e => e.contact_id)).size

      // Calculate rates
      const delivered = deliveredEmails.length
      const openRate = delivered > 0 ? (uniqueOpens / delivered) * 100 : 0
      const clickRate = delivered > 0 ? (uniqueClicks / delivered) * 100 : 0
      const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0

      setStats({
        sent: sentEmails.length,
        delivered,
        opens: openedEmails.length,
        uniqueOpens,
        clicks: clickedEmails.length,
        uniqueClicks,
        bounces: bouncedEmails.length,
        complaints: complaintEmails.length,
        unsubscribes: unsubscribedEmails.length,
        openRate,
        clickRate,
        clickToOpenRate
      })

      // Get recent events
      const recent = emailLogs
        ?.filter(log => ['opened', 'clicked', 'bounced', 'unsubscribed'].includes(log.status || ''))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20) || []

      setRecentEvents(recent)

      // Analyze clicked links
      const linkClicks = clickedEmails.reduce((acc, event) => {
        const url = (event.metadata as any)?.url || 'Unknown Link'
        if (!acc[url]) {
          acc[url] = { total: 0, unique: new Set() }
        }
        acc[url].total++
        (acc[url] as any).unique.add(event.contact_id)
        return acc
      }, {} as Record<string, { total: number; unique: Set<string> }>)

      const totalClicks = Object.values(linkClicks).reduce((sum, link: any) => sum + link.total, 0)
      
      const links: LinkStats[] = Object.entries(linkClicks)
        .map(([url, data]: [string, any]) => ({
          url,
          clicks: data.total,
          uniqueClicks: (data as any).unique.size,
          percentage: (totalClicks as number) > 0 ? (data.total / (totalClicks as number)) * 100 : 0
        }))
        .sort((a, b) => b.clicks - a.clicks)

      setLinkStats(links)
    } catch (error) {
      console.error('Error loading email data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getEventIcon = (status: string) => {
    switch (status) {
      case 'opened': return <Eye className="w-4 h-4 text-blue-500" />
      case 'clicked': return <MousePointer className="w-4 h-4 text-green-500" />
      case 'bounced': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'unsubscribed': return <ExternalLink className="w-4 h-4 text-gray-500" />
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
                    {getEventIcon(event.status || '')}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.contacts?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {event.status === 'opened' && 'Opened email'}
                        {event.status === 'clicked' && `Clicked ${(event.metadata as any)?.url || 'link'}`}
                        {event.status === 'bounced' && 'Email bounced'}
                        {event.status === 'failed' && 'Failed to deliver'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTime(event.created_at)}
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