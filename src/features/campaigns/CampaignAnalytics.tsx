import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useCampaignStore } from '@/stores/campaignStore'
import { 
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  Phone,
  Share2,
  CheckCircle,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  Activity,
  Target,
  DollarSign,
  MessageSquare,
  UserPlus
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
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

  useEffect(() => {
    if (id) {
      loadCampaign(id)
    }
  }, [id, loadCampaign])

  const handleRefresh = async () => {
    if (!id) return
    setRefreshing(true)
    await loadCampaign(id)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleExport = () => {
    // Create CSV data
    const csvData = [
      ['Campaign Analytics Report'],
      ['Campaign:', currentCampaign?.title],
      ['Type:', currentCampaign?.type],
      ['Date Range:', dateRange],
      [''],
      ['Metric', 'Value'],
      ['Total Participants', currentCampaign?.campaign_stats?.[0]?.participants || 0],
      ['Conversions', currentCampaign?.campaign_stats?.[0]?.conversions || 0],
      ['Shares', currentCampaign?.campaign_stats?.[0]?.shares || 0],
      ['New Contacts', currentCampaign?.campaign_stats?.[0]?.new_contacts || 0],
      ['Emails Sent', currentCampaign?.campaign_stats?.[0]?.emails_sent || 0],
      ['Emails Opened', currentCampaign?.campaign_stats?.[0]?.emails_opened || 0],
      ['Emails Clicked', currentCampaign?.campaign_stats?.[0]?.emails_clicked || 0],
      ['Calls Made', currentCampaign?.campaign_stats?.[0]?.calls_made || 0],
      ['Calls Completed', currentCampaign?.campaign_stats?.[0]?.calls_completed || 0],
      ['Amount Raised', `$${currentCampaign?.campaign_stats?.[0]?.amount_raised || 0}`]
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentCampaign?.title || 'campaign'}-analytics.csv`
    a.click()
  }

  if (isLoadingCampaign || !currentCampaign) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const stats = currentCampaign.campaign_stats?.[0] || {
    participants: 0,
    conversions: 0,
    shares: 0,
    new_contacts: 0,
    emails_sent: 0,
    emails_opened: 0,
    emails_clicked: 0,
    calls_made: 0,
    calls_completed: 0,
    amount_raised: 0
  }

  // Mock time series data
  const timeSeriesData = [
    { date: 'Mon', participants: 12, conversions: 8 },
    { date: 'Tue', participants: 19, conversions: 15 },
    { date: 'Wed', participants: 15, conversions: 12 },
    { date: 'Thu', participants: 25, conversions: 20 },
    { date: 'Fri', participants: 22, conversions: 18 },
    { date: 'Sat', participants: 30, conversions: 25 },
    { date: 'Sun', participants: 28, conversions: 22 }
  ]

  // Engagement funnel data
  const funnelData = [
    { name: 'Reached', value: stats.participants, fill: '#3b82f6' },
    { name: 'Engaged', value: stats.conversions, fill: '#10b981' },
    { name: 'Converted', value: stats.new_contacts, fill: '#8b5cf6' }
  ]

  // Channel performance data
  const channelData = [
    { channel: 'Email', sent: stats.emails_sent, opened: stats.emails_opened, clicked: stats.emails_clicked },
    { channel: 'Phone', attempted: stats.calls_made, completed: stats.calls_completed, converted: Math.round(stats.calls_completed * 0.3) },
    { channel: 'SMS', sent: 150, delivered: 145, responded: 32 },
    { channel: 'Social', posts: 12, shares: stats.shares, clicks: 89 }
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

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
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
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
                <p className="text-2xl font-bold">{stats.participants.toLocaleString()}</p>
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
                  {stats.participants > 0 
                    ? Math.round((stats.conversions / stats.participants) * 100) 
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
                <p className="text-2xl font-bold">{stats.new_contacts}</p>
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
                    ? `$${stats.amount_raised.toLocaleString()}`
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
                    ? (channel.opened / channel.sent * 100).toFixed(1)
                    : channel.channel === 'Phone'
                    ? (channel.completed / channel.attempted * 100).toFixed(1)
                    : channel.channel === 'SMS'
                    ? (channel.responded / channel.sent * 100).toFixed(1)
                    : (channel.clicks / channel.shares * 100).toFixed(1)
                  
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
            {[
              { icon: CheckCircle, text: 'John Smith completed action', time: '2 hours ago', color: 'text-green-600' },
              { icon: Mail, text: 'Email campaign sent to 500 contacts', time: '5 hours ago', color: 'text-blue-600' },
              { icon: Users, text: '12 new participants joined', time: '1 day ago', color: 'text-purple-600' },
              { icon: Target, text: 'Campaign reached 75% of goal', time: '2 days ago', color: 'text-orange-600' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <activity.icon className={`w-5 h-5 ${activity.color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.text}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}