import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { usePathwayStore } from '@/stores/pathwayStore'
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
  Activity,
  Loader2
} from 'lucide-react'

export function PathwaysManagement() {
  const navigate = useNavigate()
  const { 
    pathways, 
    currentPathway,
    pathwayMembers, 
    isLoadingPathways,
    isLoadingMembers,
    loadPathways, 
    loadPathway,
    loadPathwayMembers,
    deletePathway 
  } = usePathwayStore()
  
  const [selectedPathwayId, setSelectedPathwayId] = useState<string | null>(null)

  useEffect(() => {
    loadPathways()
  }, [loadPathways])

  useEffect(() => {
    if (selectedPathwayId) {
      loadPathway(selectedPathwayId)
      loadPathwayMembers(selectedPathwayId)
    }
  }, [selectedPathwayId, loadPathway, loadPathwayMembers])

  useEffect(() => {
    if (pathways.length > 0 && !selectedPathwayId) {
      setSelectedPathwayId(pathways[0].id)
    }
  }, [pathways, selectedPathwayId])

  const handleDeletePathway = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return
    
    const success = await deletePathway(id)
    if (!success) {
      alert('Failed to delete pathway')
    } else if (selectedPathwayId === id) {
      setSelectedPathwayId(pathways[0]?.id || null)
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

  if (isLoadingPathways) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Default to engagement type if not specified
  const getPathwayType = (pathway: any) => {
    return pathway.tags?.includes('leadership') ? 'leadership' :
           pathway.tags?.includes('skill') ? 'skill' :
           pathway.tags?.includes('custom') ? 'custom' : 'engagement'
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
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
                  <p className="text-2xl font-bold">{pathways.filter(p => p.is_active).length}</p>
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
                    {pathways.reduce((sum, p) => sum + (p.member_count || 0), 0)}
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
                      ? Math.round(pathways.reduce((sum, p) => sum + (p.completion_rate || 0), 0) / pathways.length)
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
                  <p className="text-2xl font-bold">+{pathwayMembers.filter(m => {
                    const startDate = new Date(m.started_at)
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return startDate > weekAgo
                  }).length}</p>
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
                        selectedPathwayId === pathway.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPathwayId(pathway.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{pathway.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(getPathwayType(pathway))}`}>
                          {getPathwayType(pathway)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {pathway.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center text-gray-500">
                          <Users className="w-3 h-3 mr-1" />
                          {pathway.member_count || 0} members
                        </span>
                        <span className="flex items-center text-gray-500">
                          <Activity className="w-3 h-3 mr-1" />
                          {pathway.completion_rate || 0}% complete
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {pathways.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">No pathways created yet</p>
                    <Button onClick={() => navigate('/pathways/new')}>
                      Create First Pathway
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pathway Details */}
          {currentPathway && selectedPathwayId ? (
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{currentPathway.name}</CardTitle>
                      <p className="text-gray-600 mt-1">{currentPathway.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/pathways/${currentPathway.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeletePathway(currentPathway.id, currentPathway.name)}
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
                      {currentPathway.pathway_steps?.map((step, index) => (
                        <div key={step.id} className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="ml-4 flex-1">
                            <h4 className="font-medium text-gray-900">{step.name}</h4>
                            <p className="text-sm text-gray-600">{step.description}</p>
                            {step.settings?.requirements && (
                              <div className="mt-1 text-xs text-gray-500">
                                Prerequisites: {step.settings.requirements.join(', ')}
                              </div>
                            )}
                            {step.settings?.estimated_duration && (
                              <div className="mt-1 text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {step.settings.estimated_duration}
                              </div>
                            )}
                          </div>
                          {currentPathway.pathway_steps && index < currentPathway.pathway_steps.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-gray-400 ml-4 mt-2" />
                          )}
                        </div>
                      ))}
                    </div>

                    {(!currentPathway.pathway_steps || currentPathway.pathway_steps.length === 0) && (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No steps defined yet</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => navigate(`/pathways/${currentPathway.id}/edit`)}
                        >
                          Add Steps
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Average Duration</p>
                      <p className="text-lg font-semibold">{(currentPathway as any).average_duration || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completion Rate</p>
                      <p className="text-lg font-semibold">{(currentPathway as any).completion_rate || 0}%</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button 
                      className="w-full"
                      onClick={() => navigate(`/pathways/${currentPathway.id}/members`)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Manage Members ({(currentPathway as any).member_count || 0})
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
                  {isLoadingMembers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pathwayMembers.slice(0, 5).map((member) => (
                        <div key={member.id} className="flex items-center justify-between py-3 border-b last:border-0">
                          <div className="flex-1">
                            <p className="font-medium">{member.contact?.full_name || 'Unknown'}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Target className="w-3 h-3 mr-1" />
                                Step {member.current_step} of {currentPathway.pathway_steps?.length || 0}
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
                                  style={{ width: `${(member.current_step / (currentPathway.pathway_steps?.length || 1)) * 100}%` }}
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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => navigate(`/pathways/${currentPathway.id}/members`)}
                          >
                            Add Members
                          </Button>
                        </div>
                      )}

                      {pathwayMembers.length > 5 && (
                        <div className="text-center pt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/pathways/${currentPathway.id}/members`)}
                          >
                            View All {pathwayMembers.length} Members
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
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
  )
}