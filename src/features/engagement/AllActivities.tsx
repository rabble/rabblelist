import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { AnalyticsService } from '@/services/analytics.service'
import { useAuth } from '@/features/auth/AuthContext'
import { 
  ArrowLeft,
  Activity,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  Zap,
  Share2,
  Download,
  Loader2,
  Clock
} from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'email' | 'sms' | 'call' | 'event' | 'action' | 'social'
  contact: string
  description: string
  timestamp: Date
  status: 'completed' | 'pending' | 'failed'
}

export function AllActivities() {
  const navigate = useNavigate()
  const { profile: user } = useAuth()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [timeRange, setTimeRange] = useState('7d')
  const [page, setPage] = useState(1)
  const itemsPerPage = 50

  useEffect(() => {
    if (user?.organization_id) {
      loadActivities()
    }
  }, [user?.organization_id, filterType, timeRange, page])

  const loadActivities = async () => {
    if (!user?.organization_id) return
    
    setLoading(true)
    try {
      const limit = itemsPerPage
      const allActivities = await AnalyticsService.getRecentEngagementActivities(
        user.organization_id, 
        limit * page
      )
      
      // Filter by type if needed
      const filtered = filterType === 'all' 
        ? allActivities 
        : allActivities.filter(a => a.type === filterType)
      
      // Paginate
      const startIndex = (page - 1) * itemsPerPage
      const paginatedActivities = filtered.slice(startIndex, startIndex + itemsPerPage)
      
      setActivities(paginatedActivities)
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setLoading(false)
    }
  }

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
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email': return 'text-blue-600 bg-blue-50'
      case 'sms': return 'text-green-600 bg-green-50'
      case 'call': return 'text-purple-600 bg-purple-50'
      case 'event': return 'text-orange-600 bg-orange-50'
      case 'action': return 'text-yellow-600 bg-yellow-50'
      case 'social': return 'text-pink-600 bg-pink-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const exportActivities = () => {
    const csv = [
      ['Time', 'Contact', 'Type', 'Description', 'Status'],
      ...activities.map(activity => [
        activity.timestamp.toISOString(),
        activity.contact,
        activity.type,
        activity.description,
        activity.status
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activities-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/engagement')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Engagement
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Activities</h1>
              <p className="text-gray-600 mt-1">
                Complete activity history for your organization
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => {
                  setTimeRange(e.target.value)
                  setPage(1)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <Button variant="outline" onClick={exportActivities}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Filter by type:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setFilterType('all')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {['email', 'sms', 'call', 'event', 'action', 'social'].map(type => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type)
                  setPage(1)
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Activities List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">No activities found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {activity.contact}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.description}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm text-gray-500">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                              activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                              activity.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {activity.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {activities.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, activities.length)} activities
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={activities.length < itemsPerPage}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}