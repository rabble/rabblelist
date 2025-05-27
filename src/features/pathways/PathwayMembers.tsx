import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { usePathwayStore } from '@/stores/pathwayStore'
import { useContactStore } from '@/stores/contactStore'
import { PathwayService } from './pathways.service'
import type { PathwayMember } from './pathways.service'
import { 
  ArrowLeft,
  Users,
  UserPlus,
  Search,
  MoreVertical,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  ChevronRight,
  Filter,
  Download,
  X
} from 'lucide-react'

export function PathwayMembers() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentPathway, loadPathway } = usePathwayStore()
  const { contacts, loadContacts } = useContactStore()
  
  const [members, setMembers] = useState<PathwayMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all')
  const [showAddMembers, setShowAddMembers] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])

  useEffect(() => {
    if (id) {
      loadPathwayData()
    }
  }, [id])

  const loadPathwayData = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      await loadPathway(id)
      const pathwayMembers = await PathwayService.getPathwayMembers(id)
      setMembers(pathwayMembers)
    } catch (error) {
      console.error('Failed to load pathway data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMembers = async () => {
    if (!id || selectedContacts.length === 0) return
    
    try {
      // Add each selected contact to the pathway
      for (const contactId of selectedContacts) {
        await PathwayService.addMemberToPathway(id, contactId)
      }
      
      // Reload members
      await loadPathwayData()
      setShowAddMembers(false)
      setSelectedContacts([])
    } catch (error) {
      console.error('Failed to add members:', error)
      alert('Failed to add members to pathway')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the pathway?')) return
    
    try {
      await PathwayService.removeMemberFromPathway(memberId)
      await loadPathwayData()
    } catch (error) {
      console.error('Failed to remove member:', error)
      alert('Failed to remove member')
    }
  }

  const handleUpdateProgress = async (memberId: string, newStep: number) => {
    try {
      await PathwayService.updateMemberProgress(memberId, { current_step: newStep })
      await loadPathwayData()
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = searchTerm === '' || 
      member.contact?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'completed' && member.completed_at) ||
      (filterStatus === 'active' && !member.completed_at)
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    totalMembers: members.length,
    completedMembers: members.filter(m => m.completed_at).length,
    activeMembers: members.filter(m => !m.completed_at).length,
    completionRate: members.length > 0 
      ? Math.round((members.filter(m => m.completed_at).length / members.length) * 100)
      : 0
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

  if (!currentPathway) {
    return (
      <Layout>
        <div className="p-6">
          <p>Pathway not found</p>
          <Button onClick={() => navigate('/pathways')} className="mt-4">
            Back to Pathways
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/pathways')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pathways
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentPathway.name} Members</h1>
              <p className="text-gray-600 mt-1">Manage pathway participants and track progress</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {}}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => {
                loadContacts()
                setShowAddMembers(true)
              }}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Members
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold">{stats.totalMembers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold">{stats.activeMembers}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{stats.completedMembers}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold">{stats.completionRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Members</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Members ({filteredMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMembers.length > 0 ? (
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {member.contact?.full_name || 'Unknown'}
                          </h4>
                          {member.completed_at ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              In Progress
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          {member.contact?.email && (
                            <span className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {member.contact.email}
                            </span>
                          )}
                          {member.contact?.phone && (
                            <span className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {member.contact.phone}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Started {new Date(member.started_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">
                              Step {member.current_step + 1} of {currentPathway.pathway_steps?.length || 0}
                            </span>
                            <span className="text-gray-600">
                              {Math.round(((member.current_step + 1) / (currentPathway.pathway_steps?.length || 1)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${((member.current_step + 1) / (currentPathway.pathway_steps?.length || 1)) * 100}%`
                              }}
                            />
                          </div>
                        </div>

                        {/* Current Step */}
                        {currentPathway.pathway_steps && currentPathway.pathway_steps[member.current_step] && (
                          <p className="text-sm text-gray-600">
                            Current: {currentPathway.pathway_steps[member.current_step].name}
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <Button size="sm" variant="outline" className="p-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/contacts/${member.contact_id}`)}
                      >
                        View Contact
                      </Button>
                      {!member.completed_at && member.current_step < (currentPathway.pathway_steps?.length || 0) - 1 && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateProgress(member.id, member.current_step + 1)}
                        >
                          <ChevronRight className="w-4 h-4 mr-1" />
                          Next Step
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No members found</p>
                <Button onClick={() => {
                  loadContacts()
                  setShowAddMembers(true)
                }}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Members
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Members Modal */}
        {showAddMembers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Add Members to Pathway</h2>
                <button
                  onClick={() => {
                    setShowAddMembers(false)
                    setSelectedContacts([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-2">
                  {contacts
                    .filter(contact => !members.some(m => m.contact_id === contact.id))
                    .map(contact => (
                      <label
                        key={contact.id}
                        className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
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
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{contact.full_name}</p>
                          <div className="flex gap-4 text-sm text-gray-600">
                            {contact.email && <span>{contact.email}</span>}
                            {contact.phone && <span>{contact.phone}</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              <div className="p-6 border-t flex justify-between">
                <span className="text-sm text-gray-600">
                  {selectedContacts.length} contacts selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddMembers(false)
                      setSelectedContacts([])
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddMembers}
                    disabled={selectedContacts.length === 0}
                  >
                    Add Members
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}