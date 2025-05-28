import { create } from 'zustand'
import { GroupsService, type Group, type GroupMember } from '@/services/groups.service'

interface GroupStore {
  // Groups state
  groups: Group[]
  isLoadingGroups: boolean
  totalGroups: number
  
  // Selected group state
  selectedGroup: Group | null
  groupMembers: GroupMember[]
  isLoadingMembers: boolean
  totalMembers: number
  
  // Actions - Groups
  loadGroups: (filters?: {
    search?: string
    type?: string
    active?: boolean
    limit?: number
    offset?: number
  }) => Promise<void>
  createGroup: (group: {
    name: string
    description?: string
    type?: 'geographic' | 'interest' | 'working' | 'affinity'
    parent_id?: string
    active?: boolean
    tags?: string[]
  }) => Promise<Group | null>
  updateGroup: (id: string, updates: Partial<Group>) => Promise<boolean>
  deleteGroup: (id: string) => Promise<boolean>
  
  // Actions - Members
  selectGroup: (groupId: string) => Promise<void>
  loadGroupMembers: (groupId: string, filters?: {
    search?: string
    role?: string
    limit?: number
    offset?: number
  }) => Promise<void>
  addGroupMembers: (groupId: string, contactIds: string[], role?: string) => Promise<boolean>
  removeGroupMember: (groupId: string, contactId: string) => Promise<boolean>
  updateMemberRole: (groupId: string, contactId: string, role: string) => Promise<boolean>
  
  // Utility
  clearSelection: () => void
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  // Initial state
  groups: [],
  isLoadingGroups: false,
  totalGroups: 0,
  selectedGroup: null,
  groupMembers: [],
  isLoadingMembers: false,
  totalMembers: 0,

  // Load groups
  loadGroups: async (filters) => {
    set({ isLoadingGroups: true })
    
    try {
      const { data, count, error } = await GroupsService.getGroups(filters)
      
      if (!error) {
        set({ 
          groups: data || [], 
          totalGroups: count || 0,
          isLoadingGroups: false 
        })
      } else {
        console.error('Error loading groups:', error)
        set({ isLoadingGroups: false })
      }
    } catch (error) {
      console.error('Error loading groups:', error)
      set({ isLoadingGroups: false })
    }
  },

  // Create group
  createGroup: async (groupData) => {
    try {
      const { data, error } = await GroupsService.createGroup(groupData)
      
      if (!error && data) {
        // Reload groups list
        get().loadGroups()
        return data as Group
      } else {
        console.error('Error creating group:', error)
        return null
      }
    } catch (error) {
      console.error('Error creating group:', error)
      return null
    }
  },

  // Update group
  updateGroup: async (id, updates) => {
    try {
      const { error } = await GroupsService.updateGroup(id, updates)
      
      if (!error) {
        // Update local state
        set(state => ({
          groups: state.groups.map(g => 
            g.id === id ? { ...g, ...updates } : g
          ),
          selectedGroup: state.selectedGroup?.id === id 
            ? { ...state.selectedGroup, ...updates }
            : state.selectedGroup
        }))
        return true
      } else {
        console.error('Error updating group:', error)
        return false
      }
    } catch (error) {
      console.error('Error updating group:', error)
      return false
    }
  },

  // Delete group
  deleteGroup: async (id) => {
    try {
      const { error } = await GroupsService.deleteGroup(id)
      
      if (!error) {
        // Remove from local state
        set(state => ({
          groups: state.groups.filter(g => g.id !== id),
          totalGroups: state.totalGroups - 1,
          selectedGroup: state.selectedGroup?.id === id ? null : state.selectedGroup
        }))
        return true
      } else {
        console.error('Error deleting group:', error)
        return false
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      return false
    }
  },

  // Select group and load details
  selectGroup: async (groupId) => {
    set({ isLoadingMembers: true })
    
    try {
      const { data, error } = await GroupsService.getGroup(groupId)
      
      if (!error && data) {
        set({ 
          selectedGroup: data as Group,
          groupMembers: data.group_members || [],
          totalMembers: data.group_members?.length || 0,
          isLoadingMembers: false
        })
      } else {
        console.error('Error loading group:', error)
        set({ isLoadingMembers: false })
      }
    } catch (error) {
      console.error('Error loading group:', error)
      set({ isLoadingMembers: false })
    }
  },

  // Load group members
  loadGroupMembers: async (groupId, filters) => {
    set({ isLoadingMembers: true })
    
    try {
      const { data, count, error } = await GroupsService.getGroupMembers(groupId, filters)
      
      if (!error) {
        set({ 
          groupMembers: data || [],
          totalMembers: count || 0,
          isLoadingMembers: false
        })
      } else {
        console.error('Error loading members:', error)
        set({ isLoadingMembers: false })
      }
    } catch (error) {
      console.error('Error loading members:', error)
      set({ isLoadingMembers: false })
    }
  },

  // Add members to group
  addGroupMembers: async (groupId, contactIds, role = 'member') => {
    try {
      const { error } = await GroupsService.addGroupMembers(groupId, contactIds, role)
      
      if (!error) {
        // Reload members
        get().loadGroupMembers(groupId)
        // Update group member count
        set(state => ({
          groups: state.groups.map(g => 
            g.id === groupId 
              ? { ...g, member_count: g.member_count + contactIds.length }
              : g
          )
        }))
        return true
      } else {
        console.error('Error adding members:', error)
        return false
      }
    } catch (error) {
      console.error('Error adding members:', error)
      return false
    }
  },

  // Remove member from group
  removeGroupMember: async (groupId, contactId) => {
    try {
      const { error } = await GroupsService.removeGroupMember(groupId, contactId)
      
      if (!error) {
        // Update local state
        set(state => ({
          groupMembers: state.groupMembers.filter(m => m.contact_id !== contactId),
          totalMembers: state.totalMembers - 1,
          groups: state.groups.map(g => 
            g.id === groupId 
              ? { ...g, member_count: Math.max(0, g.member_count - 1) }
              : g
          )
        }))
        return true
      } else {
        console.error('Error removing member:', error)
        return false
      }
    } catch (error) {
      console.error('Error removing member:', error)
      return false
    }
  },

  // Update member role
  updateMemberRole: async (groupId, contactId, role) => {
    try {
      const { error } = await GroupsService.updateMemberRole(groupId, contactId, role)
      
      if (!error) {
        // Update local state
        set(state => ({
          groupMembers: state.groupMembers.map(m => 
            m.contact_id === contactId ? { ...m, role } : m
          )
        }))
        return true
      } else {
        console.error('Error updating role:', error)
        return false
      }
    } catch (error) {
      console.error('Error updating role:', error)
      return false
    }
  },

  // Clear selection
  clearSelection: () => {
    set({ 
      selectedGroup: null,
      groupMembers: [],
      totalMembers: 0
    })
  }
}))