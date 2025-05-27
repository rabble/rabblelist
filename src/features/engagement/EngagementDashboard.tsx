import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
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
  const [timeframe, setTimeframe] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  // Mock data for engagement metrics
  const metrics: EngagementMetric[] = [
    {
      label: 'Active Members',
      value: 342,
      change: 12,
      trend: 'up',
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-600'
    },
    {
      label: 'Engagement Rate',
      value: 78,
      change: -3,
      trend: 'down',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      label: 'Actions Taken',
      value: 1248,
      change: 23,
      trend: 'up',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-purple-600'
    },
    {
      label: 'Response Rate',
      value: 64,
      change: 5,
      trend: 'up',
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'text-orange-600'
    }
  ]

  // Mock recent activities
  const recentActivities: EngagementActivity[] = [
    {
      id: '1',
      type: 'email',
      contact: 'Alex Rivera',
      description: 'Opened campaign update email',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'completed'
    },
    {
      id: '2',
      type: 'event',
      contact: 'Jamie Chen',
      description: 'Registered for Phone Bank Training',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'completed'
    },
    {
      id: '3',
      type: 'action',
      contact: 'Morgan Smith',
      description: 'Signed petition',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      status: 'completed'
    },
    {
      id: '4',
      type: 'social',
      contact: 'Sam Johnson',
      description: 'Shared campaign on Twitter',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      status: 'completed'
    },
    {
      id: '5',
      type: 'sms',
      contact: 'Taylor Brown',
      description: 'Replied to SMS survey',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      status: 'completed'
    }
  ]

  // Engagement segments
  const segments: EngagementSegment[] = [
    { name: 'Highly Engaged', count: 89, percentage: 26, color: 'bg-green-500' },
    { name: 'Moderately Engaged', count: 156, percentage: 46, color: 'bg-blue-500' },
    { name: 'Low Engagement', count: 67, percentage: 20, color: 'bg-yellow-500' },
    { name: 'Inactive', count: 30, percentage: 8, color: 'bg-red-500' }
  ]

  // Engagement ladder stages
  const ladderStages = [
    { stage: 'Supporter', count: 1523, icon: <Users className="w-4 h-4" /> },
    { stage: 'Volunteer', count: 342, icon: <UserCheck className="w-4 h-4" /> },
    { stage: 'Organizer', count: 87, icon: <Target className="w-4 h-4" /> },
    { stage: 'Leader', count: 23, icon: <Zap className="w-4 h-4" /> }
  ]

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
              <Button size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
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
                <Button className="w-full" variant="outline">
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
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Climate Action Petition</h4>
                    <span className="text-sm text-green-600 font-medium">Active</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Signatures</p>
                      <p className="font-bold text-lg">1,847</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Shares</p>
                      <p className="font-bold text-lg">423</p>
                    </div>
                    <div>
                      <p className="text-gray-600">New Contacts</p>
                      <p className="font-bold text-lg">267</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Goal Progress</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Day of Action - March 15</h4>
                    <span className="text-sm text-blue-600 font-medium">Upcoming</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">RSVPs</p>
                      <p className="font-bold text-lg">124</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Volunteers</p>
                      <p className="font-bold text-lg">45</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Locations</p>
                      <p className="font-bold text-lg">8</p>
                    </div>
                  </div>
                </div>
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

                <Button className="w-full">
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