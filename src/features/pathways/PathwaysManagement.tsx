import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { 
  Plus,
  Target,
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  TrendingUp,
  Activity
} from 'lucide-react'

interface PathwayStep {
  id: string
  name: string
  description: string
  order: number
  requirements?: string[]
  estimated_duration?: string
}

interface Pathway {
  id: string
  name: string
  description: string
  type: 'engagement' | 'leadership' | 'skill' | 'custom'
  steps: PathwayStep[]
  active: boolean
  member_count: number
  completion_rate: number
  average_duration: string
  created_at: string
}

interface PathwayMember {
  id: string
  pathway_id: string
  contact_id: string
  current_step: number
  started_at: string
  completed_at?: string
  contact: {
    full_name: string
    email?: string
  }
}

export function PathwaysManagement() {
  const navigate = useNavigate()
  const [pathways, setPathways] = useState<Pathway[]>([])
  const [selectedPathway, setSelectedPathway] = useState<Pathway | null>(null)
  const [pathwayMembers, setPathwayMembers] = useState<PathwayMember[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data
  const mockPathways: Pathway[] = [
    {
      id: '1',
      name: 'New Volunteer Onboarding',
      description: 'Standard pathway for new volunteers to get involved',
      type: 'engagement',
      steps: [
        {
          id: '1-1',
          name: 'Welcome Meeting',
          description: 'Attend orientation and meet the team',
          order: 1,
          estimated_duration: '1 week'
        },
        {
          id: '1-2',
          name: 'First Action',
          description: 'Participate in your first campaign action',
          order: 2,
          estimated_duration: '2 weeks'
        },
        {
          id: '1-3',
          name: 'Phone Banking Training',
          description: 'Learn how to make effective calls',
          order: 3,
          requirements: ['Complete orientation'],
          estimated_duration: '1 week'
        },
        {
          id: '1-4',
          name: 'Join a Team',
          description: 'Find your place in a working group',
          order: 4,
          estimated_duration: '3 weeks'
        }
      ],
      active: true,
      member_count: 45,
      completion_rate: 68,
      average_duration: '4 weeks',
      created_at: '2024-01-01'
    },
    {
      id: '2',
      name: 'Leadership Development',
      description: 'Develop skills to become a team leader',
      type: 'leadership',
      steps: [
        {
          id: '2-1',
          name: 'Leadership Training',
          description: '2-day intensive leadership workshop',
          order: 1,
          requirements: ['6 months membership', 'Team recommendation'],
          estimated_duration: '2 weeks'
        },
        {
          id: '2-2',
          name: 'Shadow a Leader',
          description: 'Work alongside an experienced organizer',
          order: 2,
          estimated_duration: '4 weeks'
        },
        {
          id: '2-3',
          name: 'Lead First Meeting',
          description: 'Facilitate your first team meeting',
          order: 3,
          estimated_duration: '2 weeks'
        },
        {
          id: '2-4',
          name: 'Campaign Planning',
          description: 'Design and launch a mini-campaign',
          order: 4,
          estimated_duration: '6 weeks'
        }
      ],
      active: true,
      member_count: 12,
      completion_rate: 75,
      average_duration: '12 weeks',
      created_at: '2024-01-15'
    },
    {
      id: '3',
      name: 'Digital Organizer',
      description: 'Master online organizing and social media',
      type: 'skill',
      steps: [
        {
          id: '3-1',
          name: 'Social Media Basics',
          description: 'Learn effective social media strategies',
          order: 1,
          estimated_duration: '1 week'
        },
        {
          id: '3-2',
          name: 'Content Creation',
          description: 'Create compelling campaign content',
          order: 2,
          estimated_duration: '2 weeks'
        },
        {
          id: '3-3',
          name: 'Digital Security',
          description: 'Protect yourself and the movement online',
          order: 3,
          estimated_duration: '1 week'
        }
      ],
      active: true,
      member_count: 28,
      completion_rate: 82,
      average_duration: '6 weeks',
      created_at: '2024-02-01'
    }
  ]

  const mockMembers: PathwayMember[] = [
    {
      id: '1',
      pathway_id: '1',
      contact_id: '1',
      current_step: 2,
      started_at: '2024-02-01',
      contact: {
        full_name: 'Alex Rivera',
        email: 'alex@example.com'
      }
    },
    {
      id: '2',
      pathway_id: '1',
      contact_id: '2',
      current_step: 4,
      started_at: '2024-01-15',
      completed_at: '2024-02-08',
      contact: {
        full_name: 'Jamie Chen',
        email: 'jamie@example.com'
      }
    },
    {
      id: '3',
      pathway_id: '1',
      contact_id: '3',
      current_step: 1,
      started_at: '2024-02-05',
      contact: {
        full_name: 'Morgan Smith'
      }
    }
  ]

  useEffect(() => {
    loadPathways()
  }, [])

  useEffect(() => {
    if (selectedPathway) {
      loadPathwayMembers(selectedPathway.id)
    }
  }, [selectedPathway])

  const loadPathways = async () => {
    try {
      setLoading(true)
      // In demo mode, use mock data
      setPathways(mockPathways)
      if (mockPathways.length > 0 && !selectedPathway) {
        setSelectedPathway(mockPathways[0])
      }
    } catch (error) {
      console.error('Failed to load pathways:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPathwayMembers = async (pathwayId: string) => {
    try {
      const members = mockMembers.filter(m => m.pathway_id === pathwayId)
      setPathwayMembers(members)
    } catch (error) {
      console.error('Failed to load pathway members:', error)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'engagement': return 'bg-blue-100 text-blue-800'
      case 'leadership': return 'bg-purple-100 text-purple-800'
      case 'skill': return 'bg-green-100 text-green-800'
      case 'custom': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pathways</h1>
              <p className="text-gray-600 mt-1">
                Guide members through their organizing journey
              </p>
            </div>
            <Button onClick={() => navigate('/pathways/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Pathway
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Pathways</p>
                  <p className="text-2xl font-bold">{pathways.filter(p => p.active).length}</p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Members in Pathways</p>
                  <p className="text-2xl font-bold">
                    {pathways.reduce((sum, p) => sum + p.member_count, 0)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Completion</p>
                  <p className="text-2xl font-bold">
                    {pathways.length > 0
                      ? Math.round(pathways.reduce((sum, p) => sum + p.completion_rate, 0) / pathways.length)
                      : 0
                    }%
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold">+8</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pathways List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Pathways</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pathways.map((pathway) => (
                    <div
                      key={pathway.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedPathway?.id === pathway.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPathway(pathway)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{pathway.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(pathway.type)}`}>
                          {pathway.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {pathway.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center text-gray-500">
                          <Users className="w-3 h-3 mr-1" />
                          {pathway.member_count} members
                        </span>
                        <span className="flex items-center text-gray-500">
                          <Activity className="w-3 h-3 mr-1" />
                          {pathway.completion_rate}% complete
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pathway Details */}
          {selectedPathway ? (
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedPathway.name}</CardTitle>
                      <p className="text-gray-600 mt-1">{selectedPathway.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/pathways/${selectedPathway.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Pathway Steps */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Pathway Steps</h3>
                    <div className="space-y-3">
                      {selectedPathway.steps.map((step, index) => (
                        <div key={step.id} className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="ml-4 flex-1">
                            <h4 className="font-medium text-gray-900">{step.name}</h4>
                            <p className="text-sm text-gray-600">{step.description}</p>
                            {step.requirements && (
                              <div className="mt-1 text-xs text-gray-500">
                                Prerequisites: {step.requirements.join(', ')}
                              </div>
                            )}
                            {step.estimated_duration && (
                              <div className="mt-1 text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {step.estimated_duration}
                              </div>
                            )}
                          </div>
                          {index < selectedPathway.steps.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-gray-400 ml-4 mt-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Average Duration</p>
                      <p className="text-lg font-semibold">{selectedPathway.average_duration}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completion Rate</p>
                      <p className="text-lg font-semibold">{selectedPathway.completion_rate}%</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button 
                      className="w-full"
                      onClick={() => navigate(`/pathways/${selectedPathway.id}/members`)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Manage Members ({selectedPathway.member_count})
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Members in Pathway */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Members in Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pathwayMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex-1">
                          <p className="font-medium">{member.contact.full_name}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Target className="w-3 h-3 mr-1" />
                              Step {member.current_step} of {selectedPathway.steps.length}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              Started {new Date(member.started_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.completed_at ? (
                            <span className="flex items-center text-green-600 text-sm">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Completed
                            </span>
                          ) : (
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary-500 h-2 rounded-full"
                                style={{ width: `${(member.current_step / selectedPathway.steps.length) * 100}%` }}
                              />
                            </div>
                          )}
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}

                    {pathwayMembers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>No members in this pathway yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="lg:col-span-2 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">Select a pathway to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}