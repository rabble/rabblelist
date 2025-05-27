import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { 
  Plus,
  Users,
  Mail,
  Calendar,
  Edit,
  BarChart3,
  FileText,
  Phone,
  Share2,
  Megaphone,
  Vote,
  Heart
} from 'lucide-react'

interface Campaign {
  id: string
  title: string
  type: 'petition' | 'event' | 'donation' | 'email_blast' | 'phone_bank' | 'canvas' | 'social'
  status: 'draft' | 'active' | 'scheduled' | 'completed' | 'archived'
  description: string
  goal?: number
  progress?: number
  startDate?: Date
  endDate?: Date
  stats: {
    participants: number
    conversions: number
    shares: number
    newContacts: number
  }
  tags: string[]
}

export function CampaignManagement() {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Mock campaigns data
  const campaigns: Campaign[] = [
    {
      id: '1',
      title: 'Climate Action Now Petition',
      type: 'petition',
      status: 'active',
      description: 'Demand immediate action on climate change from local representatives',
      goal: 2000,
      progress: 1847,
      startDate: new Date('2024-02-01'),
      stats: {
        participants: 1847,
        conversions: 423,
        shares: 567,
        newContacts: 267
      },
      tags: ['climate', 'urgent', 'featured']
    },
    {
      id: '2',
      title: 'March 15 Day of Action',
      type: 'event',
      status: 'scheduled',
      description: 'Nationwide day of action for housing justice',
      goal: 500,
      progress: 124,
      startDate: new Date('2024-03-15'),
      endDate: new Date('2024-03-15'),
      stats: {
        participants: 124,
        conversions: 45,
        shares: 89,
        newContacts: 34
      },
      tags: ['housing', 'mobilization']
    },
    {
      id: '3',
      title: 'Emergency Relief Fund',
      type: 'donation',
      status: 'active',
      description: 'Support families affected by recent flooding',
      goal: 50000,
      progress: 32450,
      startDate: new Date('2024-02-10'),
      stats: {
        participants: 287,
        conversions: 287,
        shares: 145,
        newContacts: 89
      },
      tags: ['emergency', 'mutual-aid']
    },
    {
      id: '4',
      title: 'Voter Registration Drive',
      type: 'canvas',
      status: 'completed',
      description: 'Door-to-door voter registration in key districts',
      goal: 1000,
      progress: 1234,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-02-01'),
      stats: {
        participants: 89,
        conversions: 1234,
        shares: 45,
        newContacts: 1234
      },
      tags: ['voting', 'fieldwork']
    }
  ]

  const campaignTypes = [
    { value: 'petition', label: 'Petition', icon: <FileText className="w-4 h-4" /> },
    { value: 'event', label: 'Event', icon: <Calendar className="w-4 h-4" /> },
    { value: 'donation', label: 'Fundraiser', icon: <Heart className="w-4 h-4" /> },
    { value: 'email_blast', label: 'Email', icon: <Mail className="w-4 h-4" /> },
    { value: 'phone_bank', label: 'Phone Bank', icon: <Phone className="w-4 h-4" /> },
    { value: 'canvas', label: 'Canvas', icon: <Users className="w-4 h-4" /> },
    { value: 'social', label: 'Social', icon: <Share2 className="w-4 h-4" /> }
  ]

  const getTypeIcon = (type: string) => {
    const typeConfig = campaignTypes.find(t => t.value === type)
    return typeConfig?.icon || <Megaphone className="w-4 h-4" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      case 'archived': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    if (selectedType !== 'all' && campaign.type !== selectedType) return false
    if (selectedStatus !== 'all' && campaign.status !== selectedStatus) return false
    return true
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
              <p className="text-gray-600 mt-1">
                Create and manage your organizing campaigns
              </p>
            </div>
            <Button onClick={() => navigate('/campaigns/new')}>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {campaignTypes.map(type => (
            <button
              key={type.value}
              onClick={() => navigate(`/campaigns/new?type=${type.value}`)}
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all"
            >
              <div className="text-primary-600">{type.icon}</div>
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              {campaignTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Campaign Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map(campaign => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="text-gray-600 mt-1">{getTypeIcon(campaign.type)}</div>
                    <div>
                      <CardTitle className="text-lg">{campaign.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                        {campaign.tags.includes('featured') && (
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {campaign.description}
                </p>

                {/* Progress Bar */}
                {campaign.goal && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">
                        {Math.round((campaign.progress! / campaign.goal) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (campaign.progress! / campaign.goal) * 100)}%` 
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{campaign.progress?.toLocaleString()}</span>
                      <span>Goal: {campaign.goal.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-lg font-bold">{campaign.stats.participants}</p>
                    <p className="text-xs text-gray-600">Participants</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-lg font-bold">{campaign.stats.shares}</p>
                    <p className="text-xs text-gray-600">Shares</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  >
                    View Details
                  </Button>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg text-gray-600 mb-4">No campaigns found</p>
            <Button onClick={() => navigate('/campaigns/new')}>
              Create Your First Campaign
            </Button>
          </div>
        )}

        {/* Campaign Templates */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Start Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                <Vote className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="font-medium">Petition Drive</h4>
                <p className="text-sm text-gray-600">
                  Collect signatures for your cause
                </p>
              </button>
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                <Users className="w-8 h-8 text-green-600 mb-2" />
                <h4 className="font-medium">Volunteer Recruitment</h4>
                <p className="text-sm text-gray-600">
                  Build your organizing team
                </p>
              </button>
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                <Megaphone className="w-8 h-8 text-purple-600 mb-2" />
                <h4 className="font-medium">Rapid Response</h4>
                <p className="text-sm text-gray-600">
                  Mobilize quickly for urgent actions
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}