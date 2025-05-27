import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useCampaignStore } from '@/stores/campaignStore'
import { useContactStore } from '@/stores/contactStore'
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Users,
  Mail,
  Phone,
  Share2,
  Download,
  Plus,
  Loader2,
  BarChart3,
  FileText,
  Heart,
  Megaphone,
  CheckCircle,
  Clock
} from 'lucide-react'

export function CampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentCampaign, loadCampaign, isLoadingCampaign, deleteCampaign, addContactsToCampaign } = useCampaignStore()
  const { contacts, loadContacts } = useContactStore()
  const [showAddContacts, setShowAddContacts] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [isAddingContacts, setIsAddingContacts] = useState(false)

  useEffect(() => {
    if (id) {
      loadCampaign(id)
    }
  }, [id, loadCampaign])

  useEffect(() => {
    if (showAddContacts) {
      loadContacts({ limit: 100 })
    }
  }, [showAddContacts, loadContacts])

  const handleDelete = async () => {
    if (!currentCampaign || !confirm(`Are you sure you want to delete "${currentCampaign.title}"?`)) return
    
    const success = await deleteCampaign(currentCampaign.id)
    if (success) {
      navigate('/campaigns')
    } else {
      alert('Failed to delete campaign')
    }
  }

  const handleAddContacts = async () => {
    if (!id || selectedContacts.length === 0) return
    
    setIsAddingContacts(true)
    const success = await addContactsToCampaign(id, selectedContacts)
    
    if (success) {
      setShowAddContacts(false)
      setSelectedContacts([])
      loadCampaign(id) // Reload to get updated participant count
    } else {
      alert('Failed to add contacts to campaign')
    }
    setIsAddingContacts(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'petition': return <FileText className="w-5 h-5" />
      case 'event': return <Calendar className="w-5 h-5" />
      case 'donation': return <Heart className="w-5 h-5" />
      case 'email_blast': return <Mail className="w-5 h-5" />
      case 'phone_bank': return <Phone className="w-5 h-5" />
      case 'canvas': return <Users className="w-5 h-5" />
      case 'social': return <Share2 className="w-5 h-5" />
      default: return <Megaphone className="w-5 h-5" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'scheduled': return <Clock className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      default: return null
    }
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

  if (isLoadingCampaign || !currentCampaign) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </Layout>
    )
  }

  const progress = currentCampaign.goal 
    ? Math.round(((currentCampaign.campaign_stats?.[0]?.participants || 0) / currentCampaign.goal) * 100)
    : 0

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/campaigns')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-100 rounded-lg text-primary-600">
                {getTypeIcon(currentCampaign.type)}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {currentCampaign.title}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentCampaign.status)}`}>
                    {getStatusIcon(currentCampaign.status)}
                    {currentCampaign.status}
                  </span>
                  {currentCampaign.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/campaigns/${currentCampaign.id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {currentCampaign.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{currentCampaign.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Progress */}
            {currentCampaign.goal && (
              <Card>
                <CardHeader>
                  <CardTitle>Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-lg mb-2">
                      <span className="font-medium">
                        {currentCampaign.campaign_stats?.[0]?.participants || 0} of {currentCampaign.goal}
                      </span>
                      <span className="font-bold text-primary-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-primary-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {currentCampaign.campaign_stats?.[0]?.participants || 0}
                      </p>
                      <p className="text-sm text-gray-600">Participants</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {currentCampaign.campaign_stats?.[0]?.conversions || 0}
                      </p>
                      <p className="text-sm text-gray-600">Conversions</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {currentCampaign.campaign_stats?.[0]?.shares || 0}
                      </p>
                      <p className="text-sm text-gray-600">Shares</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {currentCampaign.campaign_stats?.[0]?.new_contacts || 0}
                      </p>
                      <p className="text-sm text-gray-600">New Contacts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Campaign Assets */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Campaign Assets</CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Asset
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {currentCampaign.campaign_assets?.length ? (
                  <div className="space-y-3">
                    {currentCampaign.campaign_assets.map(asset => (
                      <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-gray-600">{asset.type}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No assets uploaded yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Campaign Info */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium capitalize">{currentCampaign.type.replace('_', ' ')}</p>
                </div>
                
                {currentCampaign.start_date && (
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium">
                      {new Date(currentCampaign.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {currentCampaign.end_date && (
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-medium">
                      {new Date(currentCampaign.end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {currentCampaign.created_by_user && (
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="font-medium">{currentCampaign.created_by_user.full_name}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">
                    {new Date(currentCampaign.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setShowAddContacts(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Contacts
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Campaign
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Contacts Modal */}
        {showAddContacts && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Add Contacts to Campaign</CardTitle>
                  <button
                    onClick={() => setShowAddContacts(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                  {contacts.map(contact => (
                    <label key={contact.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContacts([...selectedContacts, contact.id])
                          } else {
                            setSelectedContacts(selectedContacts.filter(id => id !== contact.id))
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{contact.full_name}</p>
                        <p className="text-sm text-gray-600">{contact.email || contact.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddContacts(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddContacts}
                    disabled={selectedContacts.length === 0 || isAddingContacts}
                    className="flex-1"
                  >
                    {isAddingContacts ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>Add {selectedContacts.length} Contacts</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}