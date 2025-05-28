import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useCampaignStore } from '@/stores/campaignStore'
import { CampaignTemplateModal } from './CampaignTemplateModal'
import { campaignTemplates } from './campaignTemplates'
import type { CampaignTemplate } from './campaignTemplates'
import { useAuth } from '@/features/auth/AuthContext'
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
  Heart,
  Loader2,
  Trash2,
  Sparkles,
  MessageSquare
} from 'lucide-react'

export function CampaignManagement() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm] = useState('')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  
  const { campaigns, isLoadingCampaigns, loadCampaigns, deleteCampaign } = useCampaignStore()

  useEffect(() => {
    // Only load campaigns if we have an authenticated user
    if (!authLoading && user) {
      loadCampaigns({
        type: selectedType,
        status: selectedStatus,
        search: searchTerm
      })
    }
  }, [selectedType, selectedStatus, searchTerm, loadCampaigns, user, authLoading])

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

  const handleDeleteCampaign = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return
    
    const success = await deleteCampaign(id)
    if (!success) {
      alert('Failed to delete campaign')
    }
  }

  const getProgress = (campaign: any) => {
    if (!campaign.goal) return 0
    const current = campaign.stats?.participants || 0
    return Math.round((current / campaign.goal) * 100)
  }

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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/campaigns/sms-templates')}>
                SMS Templates
              </Button>
              <Button variant="outline" onClick={() => navigate('/campaigns/phonebank-scripts')}>
                Call Scripts
              </Button>
              <Button variant="outline" onClick={() => navigate('/campaigns/sms-conversations')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                SMS Inbox
              </Button>
              <Button variant="secondary" onClick={() => setShowTemplateModal(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Use Template
              </Button>
              <Button onClick={() => navigate('/campaigns/new')}>
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </div>
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

        {/* Loading State */}
        {isLoadingCampaigns ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <>
            {/* Campaign Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map(campaign => (
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
                      <span className="font-medium">{getProgress(campaign)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, getProgress(campaign))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{campaign.campaign_stats?.[0]?.participants?.toLocaleString() || 0}</span>
                      <span>Goal: {campaign.goal.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-lg font-bold">{campaign.campaign_stats?.[0]?.participants || 0}</p>
                    <p className="text-xs text-gray-600">Participants</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-lg font-bold">{campaign.campaign_stats?.[0]?.shares || 0}</p>
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
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate(`/campaigns/${campaign.id}/analytics`)}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteCampaign(campaign.id, campaign.title)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

            {campaigns.length === 0 && (
              <div className="text-center py-12">
                <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg text-gray-600 mb-4">No campaigns found</p>
                <Button onClick={() => navigate('/campaigns/new')}>
                  Create Your First Campaign
                </Button>
              </div>
            )}
          </>
        )}

        {/* Campaign Templates */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Popular Templates</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTemplateModal(true)}
              >
                View All Templates
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all"
                onClick={() => {
                  const template = campaignTemplates.find(t => t.id === 'climate-petition')
                  if (template) navigate('/campaigns/new', { state: { template } })
                }}
              >
                <span className="text-2xl mb-2 block">🌍</span>
                <h4 className="font-medium">Climate Action Petition</h4>
                <p className="text-sm text-gray-600">
                  Rally community support for climate initiatives
                </p>
              </button>
              <button 
                className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all"
                onClick={() => {
                  const template = campaignTemplates.find(t => t.id === 'gotv-phone-bank')
                  if (template) navigate('/campaigns/new', { state: { template } })
                }}
              >
                <span className="text-2xl mb-2 block">🗳️</span>
                <h4 className="font-medium">GOTV Phone Bank</h4>
                <p className="text-sm text-gray-600">
                  Mobilize voters for election day
                </p>
              </button>
              <button 
                className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all"
                onClick={() => {
                  const template = campaignTemplates.find(t => t.id === 'rapid-response')
                  if (template) navigate('/campaigns/new', { state: { template } })
                }}
              >
                <span className="text-2xl mb-2 block">🚨</span>
                <h4 className="font-medium">Rapid Response Network</h4>
                <p className="text-sm text-gray-600">
                  Mobilize quickly in response to urgent threats
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Template Modal */}
        <CampaignTemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onSelectTemplate={(template: CampaignTemplate) => {
            setShowTemplateModal(false)
            // Navigate to campaign creation with template data
            navigate('/campaigns/new', { state: { template } })
          }}
        />
    </div>
  )
}