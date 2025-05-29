import { supabase } from '@/lib/supabase'
import { withRetry } from '@/lib/retryUtils'
import { getCurrentOrganizationId, validateResourceOwnership } from '@/lib/serviceHelpers'
// import type { Inserts } from '@/lib/database.types'

export interface Group {
  id: string
  organization_id: string
  name: string
  description?: string
  member_count: number
  settings: Record<string, any>
  tags: string[]
  created_by?: string
  created_at: string
  updated_at: string
  type?: 'geographic' | 'interest' | 'working' | 'affinity'
  parent_id?: string
  active?: boolean
  leader_count?: number
  last_activity?: string
}

export interface GroupMember {
  id: string
  group_id: string
  contact_id: string
  added_at: string
  added_by?: string
  role: string
  contact?: {
    id: string
    full_name: string
    email?: string
    phone?: string
    tags?: string[]
  }
}

export class GroupsService {
  // Get all groups for the current organization
  static async getGroups(filters?: {
    search?: string
    type?: string
    active?: boolean
    limit?: number
    offset?: number
  }) {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      let query = supabase
        .from('groups')
        .select(`
          *,
          group_members(count)
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('settings->type', filters.type)
      }

      if (filters?.active !== undefined) {
        query = query.eq('settings->active', filters.active)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      // Transform data to include computed fields
      const groups = data?.map(group => ({
        ...group,
        type: group.settings?.type || 'working',
        active: group.settings?.active !== false,
        parent_id: group.settings?.parent_id,
        leader_count: 0, // Will be computed separately
        last_activity: group.updated_at
      })) || []

      return { data: groups, count: count || 0, error: null }
    } catch (error) {
      console.error('Error fetching groups:', error)
      return { data: [], count: 0, error }
    }
  }

  // Get a single group with members
  static async getGroup(id: string) {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(
            *,
            contact:contacts(*)
          )
        `)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()

      if (error) throw error

      // Transform data
      const group = {
        ...data,
        type: data.settings?.type || 'working',
        active: data.settings?.active !== false,
        parent_id: data.settings?.parent_id,
        leader_count: data.group_members?.filter((m: any) => m.role === 'leader').length || 0,
        last_activity: data.updated_at
      }

      return { data: group, error: null }
    } catch (error) {
      console.error('Error fetching group:', error)
      return { data: null, error }
    }
  }

  // Create a new group
  static async createGroup(group: {
    name: string
    description?: string
    type?: 'geographic' | 'interest' | 'working' | 'affinity'
    parent_id?: string
    active?: boolean
    tags?: string[]
  }) {
    try {
      return await withRetry(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        
        const organizationId = await getCurrentOrganizationId()

        const settings = {
          type: group.type || 'working',
          active: group.active !== false,
          parent_id: group.parent_id
        }

        const { data, error } = await supabase
          .from('groups')
          .insert({
            name: group.name,
            description: group.description,
            organization_id: organizationId,
            settings,
            tags: group.tags || [],
            created_by: user.id,
            member_count: 0
          })
          .select()
          .single()

        if (error) throw error

        return { data, error: null }
      })
    } catch (error) {
      console.error('Error creating group:', error)
      return { data: null, error }
    }
  }

  // Update a group
  static async updateGroup(id: string, updates: Partial<Group>) {
    try {
      return await withRetry(async () => {
        await validateResourceOwnership('groups', id)
        
        // Extract settings fields
        const { type, active, parent_id, ...rest } = updates
        
        const updateData: any = { ...rest, updated_at: new Date().toISOString() }
        
        // Update settings if any of those fields changed
        if (type !== undefined || active !== undefined || parent_id !== undefined) {
          const { data: currentGroup } = await supabase
            .from('groups')
            .select('settings')
            .eq('id', id)
            .single()

          updateData.settings = {
            ...currentGroup?.settings,
            ...(type !== undefined && { type }),
            ...(active !== undefined && { active }),
            ...(parent_id !== undefined && { parent_id })
          }
        }

        const { data, error } = await supabase
          .from('groups')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        return { data, error: null }
      })
    } catch (error) {
      console.error('Error updating group:', error)
      return { data: null, error }
    }
  }

  // Delete a group
  static async deleteGroup(id: string) {
    try {
      await validateResourceOwnership('groups', id)
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error deleting group:', error)
      return { error }
    }
  }

  // Get group members
  static async getGroupMembers(groupId: string, filters?: {
    search?: string
    role?: string
    limit?: number
    offset?: number
  }) {
    try {
      await validateResourceOwnership('groups', groupId)
      
      let query = supabase
        .from('group_members')
        .select(`
          *,
          contact:contacts(*)
        `, { count: 'exact' })
        .eq('group_id', groupId)
        .order('added_at', { ascending: false })

      if (filters?.role) {
        query = query.eq('role', filters.role)
      }

      if (filters?.search) {
        // This is tricky with the join, might need to filter in memory
        // or use a more complex query
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      // Filter by search term if provided (done in memory for now)
      let members = data || []
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        members = members.filter(m => 
          m.contact?.full_name?.toLowerCase().includes(searchLower) ||
          m.contact?.email?.toLowerCase().includes(searchLower) ||
          m.contact?.phone?.includes(filters.search)
        )
      }

      return { data: members, count: count || 0, error: null }
    } catch (error) {
      console.error('Error fetching group members:', error)
      return { data: [], count: 0, error }
    }
  }

  // Add members to a group
  static async addGroupMembers(groupId: string, contactIds: string[], role: string = 'member') {
    try {
      return await withRetry(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        
        await validateResourceOwnership('groups', groupId)
        
        // Validate that all contacts belong to the same organization
        for (const contactId of contactIds) {
          await validateResourceOwnership('contacts', contactId)
        }

        const members = contactIds.map(contactId => ({
          group_id: groupId,
          contact_id: contactId,
          role,
          added_by: user.id
        }))

        const { data, error } = await supabase
          .from('group_members')
          .insert(members)
          .select()

        if (error) throw error

        // Update member count
        await this.updateMemberCount(groupId)

        return { data, error: null }
      })
    } catch (error) {
      console.error('Error adding group members:', error)
      return { data: null, error }
    }
  }

  // Remove a member from a group
  static async removeGroupMember(groupId: string, contactId: string) {
    try {
      await validateResourceOwnership('groups', groupId)
      await validateResourceOwnership('contacts', contactId)
      
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('contact_id', contactId)

      if (error) throw error

      // Update member count
      await this.updateMemberCount(groupId)

      return { error: null }
    } catch (error) {
      console.error('Error removing group member:', error)
      return { error }
    }
  }

  // Update member role
  static async updateMemberRole(groupId: string, contactId: string, role: string) {
    try {
      await validateResourceOwnership('groups', groupId)
      await validateResourceOwnership('contacts', contactId)
      
      const { data, error } = await supabase
        .from('group_members')
        .update({ role })
        .eq('group_id', groupId)
        .eq('contact_id', contactId)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error updating member role:', error)
      return { data: null, error }
    }
  }

  // Update member count for a group
  private static async updateMemberCount(groupId: string) {
    try {
      await validateResourceOwnership('groups', groupId)
      
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)

      await supabase
        .from('groups')
        .update({ 
          member_count: count || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)
    } catch (error) {
      console.error('Error updating member count:', error)
    }
  }

  // Get group statistics
  static async getGroupStats(groupId: string) {
    try {
      await validateResourceOwnership('groups', groupId)
      
      // Get member count by role
      const { data: members } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)

      const stats = {
        total: members?.length || 0,
        leaders: members?.filter(m => m.role === 'leader').length || 0,
        coordinators: members?.filter(m => m.role === 'coordinator').length || 0,
        members: members?.filter(m => m.role === 'member').length || 0
      }

      return { data: stats, error: null }
    } catch (error) {
      console.error('Error fetching group stats:', error)
      return { data: null, error }
    }
  }
}