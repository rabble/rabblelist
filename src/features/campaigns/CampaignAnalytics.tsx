import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useCampaignStore } from '@/stores/campaignStore'
import { AnalyticsService } from '@/services/analytics.service'
import type { CampaignAnalytics } from '@/services/analytics.service'
import { getCampaignStat, CAMPAIGN_STAT_TYPES } from './campaignHelpers'
import { 
  ArrowLeft,
  TrendingUp,
  Users,
  Mail,
  Phone,
  Share2,
  CheckCircle,
  Download,
  RefreshCw,
  Activity,
  DollarSign,
  MessageSquare,
  UserPlus
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

export function CampaignAnalytics() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentCampaign, loadCampaign, isLoadingCampaign } = useCampaignStore()
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('7d')
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null)
  const [_loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    if (id) {
      loadCampaign(id)
      loadAnalytics(id)
    }
  }, [id, loadCampaign])

  useEffect(() => {
    if (id) {
      loadAnalytics(id)
    }
  }, [dateRange])

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh || !id) return

    const interval = setInterval(() => {
      loadAnalytics(id)
      setLastRefresh(new Date())
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, id, dateRange])

  const loadAnalytics = async (campaignId: string) => {
    setLoadingAnalytics(true)
    try {
      const data = await AnalyticsService.getCampaignAnalytics(campaignId, dateRange)
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const handleRefresh = async () => {
    if (!id) return
    setRefreshing(true)
    await Promise.all([
      loadCampaign(id),
      loadAnalytics(id)
    ])
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleExport = () => {
    // Create CSV data
    const csvData = [
      ['Campaign Analytics Report'],
      ['Campaign:', currentCampaign?.name || currentCampaign?.title],
      ['Type:', currentCampaign?.type],
      ['Date Range:', dateRange],
      [''],
      ['Metric', 'Value'],
      ['Total Participants', getCampaignStat(currentCampaign, CAMPAIGN_STAT_TYPES.PARTICIPANTS)],
      ['Conversions', getCampaignStat(currentCampaign, CAMPAIGN_STAT_TYPES.CONVERSIONS)],
      ['Shares', getCampaignStat(currentCampaign, CAMPAIGN_STAT_TYPES.SHARES)],
      ['New Contacts', getCampaignStat(currentCampaign, CAMPAIGN_STAT_TYPES.NEW_CONTACTS)],
      ['Emails Sent', getCampaignStat(currentCampaign, CAMPAIGN_STAT_TYPES.EMAILS_SENT)],
      ['Emails Opened', getCampaignStat(currentCampaign, CAMPAIGN_STAT_TYPES.EMAILS_OPENED)],
      ['Emails Clicked', getCampaignStat(currentCampaign, CAMPAIGN_STAT_TYPES.EMAILS_CLICKED)],
      ['Calls Made', getCampaignStat(currentCampaign, CAMPAIGN_STAT_TYPES.CALLS_MADE)],
      ['Calls Completed', getCampaignStat(currentCampaign, CAMPAIGN_STAT_TYPES.CALLS_COMPLETED)],
      ['Amount Raised', `$${getCampaignStat(currentCampaign, CAMPAIGN_STAT_TYPES.AMOUNT_RAISED)}`]
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentCampaign?.name || currentCampaign?.title || 'campaign'}-analytics.csv`
    a.click()
  }

  if (isLoadingCampaign || !currentCampaign) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Helper to get stats with proper typing
  const getStatValue = (statType: string) => getCampaignStat(currentCampaign, statType)

  // Use real data from analytics or fallback to defaults
  const timeSeriesData = analytics?.timeSeriesData || []

  // Engagement funnel data
  const funnelData = [
    { name: 'Reached', value: getStatValue(CAMPAIGN_STAT_TYPES.PARTICIPANTS), fill: '#3b82f6' },
    { name: 'Engaged', value: getStatValue(CAMPAIGN_STAT_TYPES.CONVERSIONS), fill: '#10b981' },
    { name: 'Converted', value: getStatValue(CAMPAIGN_STAT_TYPES.NEW_CONTACTS), fill: '#8b5cf6' }
  ]

  // Channel performance data from real analytics
  const channelData = analytics ? [
    { 
      channel: 'Email', 
      sent: analytics.channelPerformance.email.sent, 
      opened: analytics.channelPerformance.email.opened, 
      clicked: analytics.channelPerformance.email.clicked 
    },
    { 
      channel: 'Phone', 
      attempted: analytics.channelPerformance.phone.attempted, 
      completed: analytics.channelPerformance.phone.completed, 
      converted: analytics.channelPerformance.phone.converted 
    },
    { 
      channel: 'SMS', 
      sent: analytics.channelPerformance.sms.sent, 
      delivered: analytics.channelPerformance.sms.delivered, 
      responded: analytics.channelPerformance.sms.responded 
    },
    { 
      channel: 'Social', 
      posts: analytics.channelPerformance.social.posts, 
      shares: analytics.channelPerformance.social.shares, 
      clicks: analytics.channelPerformance.social.clicks 
    }
  ] : []


  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/campaigns/${id}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaign
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaign Analytics</h1>
            <p className="text-gray-600 mt-1">{currentCampaign.title}</p>
          </div>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                title={lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString()}` : ''}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reach</p>
                <p className="text-2xl font-bold">{getStatValue(CAMPAIGN_STAT_TYPES.PARTICIPANTS).toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">+12% from last period</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {getStatValue(CAMPAIGN_STAT_TYPES.PARTICIPANTS) > 0 
                    ? Math.round((getStatValue(CAMPAIGN_STAT_TYPES.CONVERSIONS) / getStatValue(CAMPAIGN_STAT_TYPES.PARTICIPANTS)) * 100) 
                    : 0}%
                </p>
                <p className="text-sm text-green-600 mt-1">+5% from last period</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Contacts</p>
                <p className="text-2xl font-bold">{getStatValue(CAMPAIGN_STAT_TYPES.NEW_CONTACTS)}</p>
                <p className="text-sm text-green-600 mt-1">+8 this week</p>
              </div>
              <UserPlus className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {currentCampaign.type === 'donation' ? 'Amount Raised' : 'Engagement Score'}
                </p>
                <p className="text-2xl font-bold">
                  {currentCampaign.type === 'donation' 
                    ? `$${getStatValue(CAMPAIGN_STAT_TYPES.AMOUNT_RAISED).toLocaleString()}`
                    : '87%'
                  }
                </p>
                <p className="text-sm text-green-600 mt-1">Above target</p>
              </div>
              {currentCampaign.type === 'donation' 
                ? <DollarSign className="w-8 h-8 text-green-600" />
                : <Activity className="w-8 h-8 text-orange-600" />
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Participation Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Participation Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="participants" 
                    stroke="#3b82f6" 
                    name="Participants"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversions" 
                    stroke="#10b981" 
                    name="Conversions"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6">
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Channel</th>
                  <th className="text-right py-3 px-4">Sent/Attempted</th>
                  <th className="text-right py-3 px-4">Opened/Completed</th>
                  <th className="text-right py-3 px-4">Clicked/Converted</th>
                  <th className="text-right py-3 px-4">Rate</th>
                </tr>
              </thead>
              <tbody>
                {channelData.map((channel) => {
                  const rate = channel.channel === 'Email' 
                    ? ((channel.opened || 0) / (channel.sent || 1) * 100).toFixed(1)
                    : channel.channel === 'Phone'
                    ? ((channel.completed || 0) / (channel.attempted || 1) * 100).toFixed(1)
                    : channel.channel === 'SMS'
                    ? ((channel.responded || 0) / (channel.sent || 1) * 100).toFixed(1)
                    : ((channel.clicks || 0) / (channel.shares || 1) * 100).toFixed(1)
                  
                  return (
                    <tr key={channel.channel} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {channel.channel === 'Email' && <Mail className="w-4 h-4 text-gray-400" />}
                          {channel.channel === 'Phone' && <Phone className="w-4 h-4 text-gray-400" />}
                          {channel.channel === 'SMS' && <MessageSquare className="w-4 h-4 text-gray-400" />}
                          {channel.channel === 'Social' && <Share2 className="w-4 h-4 text-gray-400" />}
                          {channel.channel}
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        {channel.sent || channel.attempted || channel.posts || 0}
                      </td>
                      <td className="text-right py-3 px-4">
                        {channel.opened || channel.completed || channel.delivered || channel.shares || 0}
                      </td>
                      <td className="text-right py-3 px-4">
                        {channel.clicked || channel.converted || channel.responded || channel.clicks || 0}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={`font-medium ${
                          parseFloat(rate) > 50 ? 'text-green-600' : 
                          parseFloat(rate) > 20 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(analytics?.recentActivity || []).length > 0 ? (
              analytics?.recentActivity.map((activity) => {
                const getIcon = () => {
                  switch (activity.type) {
                    case 'signature': return Users
                    case 'call': return Phone
                    case 'email': return Mail
                    default: return CheckCircle
                  }
                }
                const Icon = getIcon()
                const timeAgo = new Date(activity.timestamp).toRelativeTimeString()
                
                return (
                  <div key={activity.id} className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500">{timeAgo}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-500 text-center">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}