import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase, isDemoMode } from '@/lib/supabase'
import { 
  Plus,
  Users,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  UserPlus,
  Mail,
  Phone,
  Activity,
  TrendingUp
} from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string
  type: 'geographic' | 'interest' | 'working' | 'affinity'
  parent_id?: string
  member_count: number
  leader_count: number
  active: boolean
  created_at: string
  last_activity?: string
  organization_id: string
}

interface GroupMember {
  id: string
  group_id: string
  contact_id: string
  role: 'member' | 'leader' | 'coordinator'
  joined_at: string
  contact?: {
    full_name: string
    email?: string
    phone: string
  }
}

export function GroupsManagement() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  // Mock data
  const mockGroups: Group[] = [
    {
      id: '1',
      name: 'Downtown Climate Action',
      description: 'Organizing climate actions in the downtown area',
      type: 'geographic',
      member_count: 45,
      leader_count: 4,
      active: true,
      created_at: '2024-01-15',
      last_activity: '2024-02-05',
      organization_id: '1'
    },
    {
      id: '2',
      name: 'Youth Organizers',
      description: 'Young activists aged 18-25 leading change',
      type: 'affinity',
      member_count: 32,
      leader_count: 3,
      active: true,
      created_at: '2024-01-20',
      last_activity: '2024-02-08',
      organization_id: '1'
    },
    {
      id: '3',
      name: 'Housing Justice Committee',
      description: 'Working group focused on affordable housing campaigns',
      type: 'working',
      member_count: 28,
      leader_count: 2,
      active: true,
      created_at: '2023-12-10',
      last_activity: '2024-02-07',
      organization_id: '1'
    },
    {
      id: '4',
      name: 'North Side Neighbors',
      description: 'Community organizing in the north neighborhoods',
      type: 'geographic',
      member_count: 67,
      leader_count: 6,
      active: true,
      created_at: '2023-11-05',
      last_activity: '2024-02-09',
      organization_id: '1'
    }
  ]

  const mockMembers: GroupMember[] = [
    {
      id: '1',
      group_id: '1',
      contact_id: '1',
      role: 'leader',
      joined_at: '2024-01-15',
      contact: {
        full_name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '555-0101'
      }
    },
    {
      id: '2',
      group_id: '1',
      contact_id: '2',
      role: 'member',
      joined_at: '2024-01-20',
      contact: {
        full_name: 'Mike Chen',
        email: 'mike@example.com',
        phone: '555-0102'
      }
    },
    {
      id: '3',
      group_id: '1',
      contact_id: '3',
      role: 'coordinator',
      joined_at: '2024-01-16',
      contact: {
        full_name: 'Lisa Rodriguez',
        email: 'lisa@example.com',
        phone: '555-0103'
      }
    }
  ]

  useEffect(() => {
    loadGroups()
  }, [filterType, searchTerm])

  useEffect(() => {
    if (selectedGroup) {
      loadGroupMembers(selectedGroup.id)
    }
  }, [selectedGroup])

  const loadGroups = async () => {
    try {
      setLoading(true)
      
      if (isDemoMode) {
        let filtered = [...mockGroups]
        
        if (filterType !== 'all') {
          filtered = filtered.filter(g => g.type === filterType)
        }
        
        if (searchTerm) {
          const search = searchTerm.toLowerCase()
          filtered = filtered.filter(g => 
            g.name.toLowerCase().includes(search) ||
            g.description.toLowerCase().includes(search)
          )
        }
        
        setGroups(filtered)
        if (filtered.length > 0 && !selectedGroup) {
          setSelectedGroup(filtered[0])
        }
      } else {
        let query = supabase
          .from('groups')
          .select('*')
          .eq('organization_id', user?.organization_id)
          .eq('active', true)
          .order('name')
        
        if (filterType !== 'all') {
          query = query.eq('type', filterType)
        }
        
        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        }
        
        const { data, error } = await query
        
        if (error) throw error
        setGroups(data || [])
        if (data && data.length > 0 && !selectedGroup) {
          setSelectedGroup(data[0])
        }
      }
    } catch (error) {
      console.error('Failed to load groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGroupMembers = async (groupId: string) => {
    try {
      if (isDemoMode) {
        const members = mockMembers.filter(m => m.group_id === groupId)
        setGroupMembers(members)
      } else {
        const { data, error } = await supabase
          .from('group_members')
          .select(`
            *,
            contacts (
              full_name,
              email,
              phone
            )
          `)
          .eq('group_id', groupId)
          .order('role')
        
        if (error) throw error
        setGroupMembers(data || [])
      }
    } catch (error) {
      console.error('Failed to load group members:', error)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return
    
    try {
      if (isDemoMode) {
        setGroups(prev => prev.filter(g => g.id !== groupId))
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(null)
        }
      } else {
        const { error } = await supabase
          .from('groups')
          .update({ active: false })
          .eq('id', groupId)
        
        if (error) throw error
        await loadGroups()
      }
    } catch (error) {
      console.error('Failed to delete group:', error)
      alert('Failed to delete group')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'geographic': return 'bg-blue-100 text-blue-800'
      case 'interest': return 'bg-green-100 text-green-800'
      case 'working': return 'bg-purple-100 text-purple-800'
      case 'affinity': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'coordinator': return 'bg-purple-100 text-purple-800'
      case 'leader': return 'bg-blue-100 text-blue-800'
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
              <h1 className="text-3xl font-bold text-gray-900">Groups & Units</h1>
              <p className="text-gray-600 mt-1">
                Manage your organizational structure and teams
              </p>
            </div>
            <Button onClick={() => navigate('/groups/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Groups</p>
                  <p className="text-2xl font-bold">{groups.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold">
                    {groups.reduce((sum, g) => sum + g.member_count, 0)}
                  </p>
                </div>
                <UserPlus className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Leaders</p>
                  <p className="text-2xl font-bold">
                    {groups.reduce((sum, g) => sum + g.leader_count, 0)}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Group Size</p>
                  <p className="text-2xl font-bold">
                    {groups.length > 0 
                      ? Math.round(groups.reduce((sum, g) => sum + g.member_count, 0) / groups.length)
                      : 0
                    }
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Groups</CardTitle>
                  <select
                    className="text-sm px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="geographic">Geographic</option>
                    <option value="interest">Interest</option>
                    <option value="working">Working</option>
                    <option value="affinity">Affinity</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search groups..."
                      className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedGroup?.id === group.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedGroup(group)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(group.type)}`}>
                          {group.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {group.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{group.member_count} members</span>
                        <span>{group.leader_count} leaders</span>
                      </div>
                    </div>
                  ))}
                  
                  {groups.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No groups found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Group Details */}
          {selectedGroup ? (
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedGroup.name}</CardTitle>
                      <p className="text-gray-600 mt-1">{selectedGroup.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/groups/${selectedGroup.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteGroup(selectedGroup.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-2xl font-bold">{selectedGroup.member_count}</p>
                        <p className="text-sm text-gray-600">Total Members</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Activity className="w-5 h-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-2xl font-bold">{selectedGroup.leader_count}</p>
                        <p className="text-sm text-gray-600">Leaders</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-600">Type</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedGroup.type)}`}>
                        {selectedGroup.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-600">Created</span>
                      <span className="font-medium">
                        {new Date(selectedGroup.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedGroup.last_activity && (
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-gray-600">Last Activity</span>
                        <span className="font-medium">
                          {new Date(selectedGroup.last_activity).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      className="w-full"
                      onClick={() => navigate(`/groups/${selectedGroup.id}/members`)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Manage Members
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Members List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Members ({groupMembers.length})</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/groups/${selectedGroup.id}/add-members`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Members
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {groupMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.contact?.full_name}</p>
                            {member.role !== 'member' && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadge(member.role)}`}>
                                {member.role}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            {member.contact?.email && (
                              <span className="flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {member.contact.email}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {member.contact?.phone}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="p-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {groupMembers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>No members yet</p>
                        <Button
                          size="sm"
                          className="mt-3"
                          onClick={() => navigate(`/groups/${selectedGroup.id}/add-members`)}
                        >
                          Add First Members
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="lg:col-span-2 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">Select a group to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}