import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { AnalyticsService } from '@/services/analytics.service'
import { useAuthStore } from '@/stores/authStore'
import { 
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  MessageSquare,
  Mail,
  Phone,
  Activity,
  Target,
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Zap,
  UserCheck,
  Share2
} from 'lucide-react'

interface EngagementMetric {
  label: string
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
  color: string
}

interface EngagementActivity {
  id: string
  type: 'email' | 'sms' | 'call' | 'event' | 'action' | 'social'
  contact: string
  description: string
  timestamp: Date
  status: 'completed' | 'pending' | 'failed'
}

interface EngagementSegment {
  name: string
  count: number
  percentage: number
  color: string
}

export function EngagementDashboard() {
  const navigate = useNavigate()
  const [timeframe, setTimeframe] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [engagementStats, setEngagementStats] = useState<any>(null)
  const [recentActivities, setRecentActivities] = useState<EngagementActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [ladderData, setLadderData] = useState<any>(null)
  const [campaignPerformance, setCampaignPerformance] = useState<any[]>([])
  const { user } = useAuthStore()

  useEffect(() => {
    if (user?.organization_id) {
      loadEngagementStats()
      loadRecentActivities()
      loadLadderData()
      loadCampaignPerformance()
    }
  }, [user?.organization_id, timeframe])

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh || !user?.organization_id) return

    const interval = setInterval(() => {
      loadEngagementStats()
      loadRecentActivities()
      loadLadderData()
      loadCampaignPerformance()
      setLastRefresh(new Date())
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, user?.organization_id, timeframe])

  const loadEngagementStats = async () => {
    if (!user?.organization_id) return
    
    setLoading(true)
    try {
      const stats = await AnalyticsService.getEngagementStats(user.organization_id)
      setEngagementStats(stats)
    } catch (error) {
      console.error('Failed to load engagement stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentActivities = async () => {
    if (!user?.organization_id) return
    
    try {
      const activities = await AnalyticsService.getRecentEngagementActivities(user.organization_id)
      setRecentActivities(activities)
    } catch (error) {
      console.error('Failed to load recent activities:', error)
    }
  }

  const loadLadderData = async () => {
    if (!user?.organization_id) return
    
    try {
      const data = await AnalyticsService.getEngagementLadder(user.organization_id)
      setLadderData(data)
    } catch (error) {
      console.error('Failed to load ladder data:', error)
    }
  }

  const loadCampaignPerformance = async () => {
    if (!user?.organization_id) return
    
    try {
      const data = await AnalyticsService.getCampaignPerformance(user.organization_id)
      setCampaignPerformance(data)
    } catch (error) {
      console.error('Failed to load campaign performance:', error)
    }
  }

  // Calculate metrics from real data
  const metrics: EngagementMetric[] = engagementStats ? [
    {
      label: 'Total Members',
      value: engagementStats.totalMembers,
      change: engagementStats.newThisMonth,
      trend: engagementStats.newThisMonth > 0 ? 'up' : 'neutral',
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-600'
    },
    {
      label: 'Engagement Rate',
      value: engagementStats.engagementRate,
      change: 0, // Would need historical data to calculate
      trend: 'neutral',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      label: 'Active This Week',
      value: engagementStats.activeThisWeek,
      change: 0, // Would need historical data
      trend: 'neutral',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-purple-600'
    },
    {
      label: 'New This Month',
      value: engagementStats.newThisMonth,
      change: 0, // Would need historical data
      trend: 'neutral',
      icon: <UserCheck className="w-5 h-5" />,
      color: 'text-orange-600'
    }
  ] : []

  // Engagement segments
  const totalSegmentContacts = 
    (engagementStats?.segments?.highlyEngaged || 0) +
    (engagementStats?.segments?.moderate || 0) +
    (engagementStats?.segments?.low || 0) +
    (engagementStats?.segments?.inactive || 0)
  
  const segments: EngagementSegment[] = [
    { 
      name: 'Highly Engaged', 
      count: engagementStats?.segments?.highlyEngaged || 0, 
      percentage: totalSegmentContacts > 0 
        ? Math.round((engagementStats?.segments?.highlyEngaged || 0) / totalSegmentContacts * 100)
        : 0,
      color: 'bg-green-500' 
    },
    { 
      name: 'Moderately Engaged', 
      count: engagementStats?.segments?.moderate || 0, 
      percentage: totalSegmentContacts > 0
        ? Math.round((engagementStats?.segments?.moderate || 0) / totalSegmentContacts * 100)
        : 0,
      color: 'bg-blue-500' 
    },
    { 
      name: 'Low Engagement', 
      count: engagementStats?.segments?.low || 0, 
      percentage: totalSegmentContacts > 0
        ? Math.round((engagementStats?.segments?.low || 0) / totalSegmentContacts * 100)
        : 0,
      color: 'bg-yellow-500' 
    },
    { 
      name: 'Inactive', 
      count: engagementStats?.segments?.inactive || 0, 
      percentage: totalSegmentContacts > 0
        ? Math.round((engagementStats?.segments?.inactive || 0) / totalSegmentContacts * 100)
        : 0,
      color: 'bg-red-500' 
    }
  ]

  // Engagement ladder stages using real data
  const ladderStages = ladderData ? [
    { stage: 'Supporter', count: ladderData.supporter || 0, icon: <Users className="w-4 h-4" /> },
    { stage: 'Volunteer', count: ladderData.volunteer || 0, icon: <UserCheck className="w-4 h-4" /> },
    { stage: 'Organizer', count: ladderData.organizer || 0, icon: <Target className="w-4 h-4" /> },
    { stage: 'Leader', count: ladderData.leader || 0, icon: <Zap className="w-4 h-4" /> }
  ] : []

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />
      case 'sms': return <MessageSquare className="w-4 h-4" />
      case 'call': return <Phone className="w-4 h-4" />
      case 'event': return <Calendar className="w-4 h-4" />
      case 'action': return <Zap className="w-4 h-4" />
      case 'social': return <Share2 className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 1000 / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        loadEngagementStats(),
        loadRecentActivities(),
        loadLadderData(),
        loadCampaignPerformance()
      ])
      setLastRefresh(new Date())
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Engagement Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Track member engagement and optimize your outreach
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                  Auto
                </label>
                <Button 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title={lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString()}` : ''}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric) => (
            <Card 
              key={metric.label}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedMetric === metric.label ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => setSelectedMetric(metric.label)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={metric.color}>{metric.icon}</div>
                  <div className={`flex items-center text-sm ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {metric.value}{metric.label.includes('Rate') ? '%' : ''}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{metric.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Engagement Segments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Member Segments</CardTitle>
                <PieChart className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {segments.map((segment) => (
                  <div key={segment.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{segment.name}</span>
                      <span className="text-sm text-gray-600">
                        {segment.count} ({segment.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${segment.color} h-2 rounded-full`}
                        style={{ width: `${segment.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button className="w-full" variant="outline">
                  View Segment Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Ladder */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Engagement Ladder</CardTitle>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ladderStages.map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-primary-600">{stage.icon}</div>
                        <span className="font-medium">{stage.stage}</span>
                      </div>
                      <span className="text-lg font-bold">{stage.count}</span>
                    </div>
                    {index < ladderStages.length - 1 && (
                      <div className="absolute left-6 top-full h-3 w-0.5 bg-gray-300" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Tip: Move members up</p>
                    <p className="text-blue-700">
                      23 volunteers are ready to become organizers
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="text-gray-400 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.contact}</span>
                        {' '}
                        <span className="text-gray-600">{activity.description}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate('/engagement/activities')}
                >
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ActionNetwork-style Features */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaign Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignPerformance.length > 0 ? (
                  campaignPerformance.slice(0, 2).map((campaign) => (
                    <div key={campaign.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{campaign.name}</h4>
                        <span className={`text-sm font-medium ${
                          campaign.status === 'active' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {campaign.status === 'active' ? 'Active' : 'Completed'}
                        </span>
                      </div>
                      {campaign.type === 'petition' && campaign.metrics && (
                        <>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Signatures</p>
                              <p className="font-bold text-lg">{campaign.metrics.signatures}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Goal</p>
                              <p className="font-bold text-lg">{campaign.metrics.goal}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Goal Progress</span>
                              <span className="font-medium">{campaign.metrics.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${Math.min(campaign.metrics.progress, 100)}%` }} 
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    <p>No active campaigns</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => navigate('/campaigns')}
                    >
                      Create Campaign
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Automated Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>Automated Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Welcome Series</p>
                      <p className="text-sm text-gray-600">3 emails over 2 weeks</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">87%</p>
                    <p className="text-xs text-gray-600">Open rate</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Event Reminders</p>
                      <p className="text-sm text-gray-600">SMS 24h before</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">92%</p>
                    <p className="text-xs text-gray-600">Delivery rate</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Birthday Messages</p>
                      <p className="text-sm text-gray-600">Personalized greetings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">156</p>
                    <p className="text-xs text-gray-600">Sent this month</p>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={() => navigate('/engagement/automations')}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Create Automation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}