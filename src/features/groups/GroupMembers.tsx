import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft,
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Shield,
  Crown,
  User,
  Trash2,
  ChevronDown,
  Filter,
  Download
} from 'lucide-react'

interface GroupMember {
  id: string
  group_id: string
  contact_id: string
  role: 'member' | 'leader' | 'coordinator'
  joined_at: string
  contact?: {
    id: string
    full_name: string
    email?: string
    phone: string
    tags?: string[]
  }
}

interface Group {
  id: string
  name: string
  description?: string
  member_count: number
}

export function GroupMembers() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  useEffect(() => {
    if (id) {
      loadGroupData()
    }
  }, [id])

  const loadGroupData = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      
      // Load group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single()
      
      if (groupError) throw groupError
      setGroup(groupData)
      
      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          contact:contacts (
            id,
            full_name,
            email,
            phone,
            tags
          )
        `)
        .eq('group_id', id)
        .order('role')
        .order('joined_at', { ascending: false })
      
      if (membersError) throw membersError
      setMembers(membersData || [])
    } catch (error) {
      console.error('Failed to load group data:', error)
      alert('Failed to load group data')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: 'member' | 'leader' | 'coordinator') => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: newRole })
        .eq('id', memberId)
      
      if (error) throw error
      
      // Update local state
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ))
    } catch (error) {
      console.error('Failed to update member role:', error)
      alert('Failed to update member role')
    }
  }

  const handleRemoveMembers = async () => {
    if (selectedMembers.length === 0) return
    
    if (!confirm(`Remove ${selectedMembers.length} member(s) from the group?`)) return
    
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .in('id', selectedMembers)
      
      if (error) throw error
      
      await loadGroupData()
      setSelectedMembers([])
    } catch (error) {
      console.error('Failed to remove members:', error)
      alert('Failed to remove members')
    }
  }

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Role', 'Joined Date'],
      ...filteredMembers.map(m => [
        m.contact?.full_name || '',
        m.contact?.email || '',
        m.contact?.phone || '',
        m.role,
        new Date(m.joined_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${group?.name || 'group'}-members.csv`
    a.click()
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = searchTerm === '' || 
      member.contact?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.contact?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || member.role === filterRole
    
    return matchesSearch && matchesRole
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'coordinator': return <Crown className="w-4 h-4" />
      case 'leader': return <Shield className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
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

  if (!group) {
    return (
      <Layout>
        <div className="p-6">
          <p>Group not found</p>
          <Button onClick={() => navigate('/groups')} className="mt-4">
            Back to Groups
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
            onClick={() => navigate('/groups')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Groups
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{group.name} Members</h1>
              <p className="text-gray-600 mt-1">Manage group participants and roles</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => navigate(`/groups/${id}/add-members`)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Members
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold">{members.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Leaders</p>
                  <p className="text-2xl font-bold">
                    {members.filter(m => m.role === 'leader').length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Coordinators</p>
                  <p className="text-2xl font-bold">
                    {members.filter(m => m.role === 'coordinator').length}
                  </p>
                </div>
                <Crown className="w-8 h-8 text-purple-600" />
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
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Roles</option>
                  <option value="member">Members</option>
                  <option value="leader">Leaders</option>
                  <option value="coordinator">Coordinators</option>
                </select>
                
                {selectedMembers.length > 0 && (
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={handleRemoveMembers}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove ({selectedMembers.length})
                  </Button>
                )}
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
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers([...selectedMembers, member.id])
                            } else {
                              setSelectedMembers(selectedMembers.filter(id => id !== member.id))
                            }
                          }}
                          className="mt-1"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {member.contact?.full_name || 'Unknown'}
                            </h4>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${getRoleBadgeColor(member.role)}`}>
                              {getRoleIcon(member.role)}
                              {member.role}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
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
                          </div>
                          
                          <p className="text-xs text-gray-500 mt-2">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as any)}
                          className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="member">Member</option>
                          <option value="leader">Leader</option>
                          <option value="coordinator">Coordinator</option>
                        </select>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/contacts/${member.contact_id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No members found</p>
                <Button onClick={() => navigate(`/groups/${id}/add-members`)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Members
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}