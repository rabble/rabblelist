import { supabase } from '@/lib/supabase'
import { withRetry } from '@/lib/retryUtils'
import { getCurrentOrganizationId, validateResourceOwnership } from '@/lib/serviceHelpers'

export interface Pathway {
  id: string
  organization_id: string
  name: string
  description?: string
  is_active: boolean
  settings?: Record<string, any>
  tags: string[]
  created_by?: string
  created_at: string
  updated_at: string
}

export interface PathwayStep {
  id: string
  pathway_id: string
  name: string
  description?: string
  order_index: number
  step_type: string
  settings?: Record<string, any>
  is_required: boolean
  created_at: string
}

export interface PathwayMember {
  id: string
  pathway_id: string
  contact_id: string
  current_step: number
  started_at: string
  completed_at?: string
  metadata?: Record<string, any>
  contact?: {
    id: string
    full_name: string
    email?: string
    phone?: string
  }
}

// Extended types with relations
export interface PathwayWithSteps extends Pathway {
  pathway_steps?: PathwayStep[]
}

export interface PathwayWithDetails extends PathwayWithSteps {
  member_count?: number
  completion_rate?: number
  average_duration?: number
}

export class PathwayService {
  // Get all pathways for the organization
  static async getPathways(): Promise<PathwayWithDetails[]> {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      const { data, error } = await supabase
        .from('pathways')
        .select(`
          *,
          pathway_steps (
            id,
            name,
            description,
            order_index,
            step_type,
            is_required
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .order('pathway_steps.order_index', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error in getPathways:', error)
      throw error
    }
  }

  // Get single pathway with full details
  static async getPathway(id: string): Promise<PathwayWithSteps> {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      const { data, error } = await supabase
        .from('pathways')
        .select(`
          *,
          pathway_steps (*),
          created_by:users!pathways_created_by_fkey (
            full_name,
            email
          )
        `)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .order('pathway_steps.order_index', { ascending: true })
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error in getPathway:', error)
      throw error
    }
  }

  // Create new pathway
  static async createPathway(pathway: Partial<Pathway>) {
    try {
      const organizationId = await getCurrentOrganizationId()
      const { data: { user } } = await supabase.auth.getUser()
      
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('pathways')
          .insert({
            ...pathway,
            organization_id: organizationId,
            created_by: user?.id
          })
          .select()
          .single()
        
        if (error) throw error
        return data
      })
    } catch (error) {
      console.error('Error in createPathway:', error)
      throw error
    }
  }

  // Update pathway
  static async updatePathway(id: string, updates: Partial<Pathway>) {
    try {
      await validateResourceOwnership('pathways', id)
      
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('pathways')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        return data
      })
    } catch (error) {
      console.error('Error in updatePathway:', error)
      throw error
    }
  }

  // Delete pathway
  static async deletePathway(id: string) {
    try {
      await validateResourceOwnership('pathways', id)
      
      return withRetry(async () => {
        const { error } = await supabase
          .from('pathways')
          .delete()
          .eq('id', id)
        
        if (error) throw error
      })
    } catch (error) {
      console.error('Error in deletePathway:', error)
      throw error
    }
  }

  // Pathway steps management
  static async createPathwayStep(step: Partial<PathwayStep>) {
    try {
      if (step.pathway_id) {
        await validateResourceOwnership('pathways', step.pathway_id)
      }
      
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('pathway_steps')
          .insert(step)
          .select()
          .single()
        
        if (error) throw error
        return data
      })
    } catch (error) {
      console.error('Error in createPathwayStep:', error)
      throw error
    }
  }

  static async updatePathwayStep(id: string, updates: Partial<PathwayStep>) {
    try {
      await validateResourceOwnership('pathway_steps', id)
      
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('pathway_steps')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        return data
      })
    } catch (error) {
      console.error('Error in updatePathwayStep:', error)
      throw error
    }
  }

  static async deletePathwayStep(id: string) {
    try {
      await validateResourceOwnership('pathway_steps', id)
      
      return withRetry(async () => {
        const { error } = await supabase
          .from('pathway_steps')
          .delete()
          .eq('id', id)
        
        if (error) throw error
      })
    } catch (error) {
      console.error('Error in deletePathwayStep:', error)
      throw error
    }
  }

  static async reorderPathwaySteps(pathwayId: string, steps: { id: string; order_index: number }[]) {
    try {
      await validateResourceOwnership('pathways', pathwayId)
      
      const updates = steps.map(step =>
        supabase
          .from('pathway_steps')
          .update({ order_index: step.order_index })
          .eq('id', step.id)
      )

      return Promise.all(updates)
    } catch (error) {
      console.error('Error in reorderPathwaySteps:', error)
      throw error
    }
  }

  // Pathway members management
  static async getPathwayMembers(pathwayId: string) {
    try {
      await validateResourceOwnership('pathways', pathwayId)
      
      const { data, error } = await supabase
        .from('pathway_members')
        .select(`
          *,
          contact:contacts (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('pathway_id', pathwayId)
        .order('started_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error in getPathwayMembers:', error)
      throw error
    }
  }

  static async addMemberToPathway(pathwayId: string, contactId: string) {
    try {
      await validateResourceOwnership('pathways', pathwayId)
      await validateResourceOwnership('contacts', contactId)
      
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('pathway_members')
          .insert({
            pathway_id: pathwayId,
            contact_id: contactId,
            current_step: 0
          })
          .select()
          .single()
        
        if (error) throw error
        return data
      })
    } catch (error) {
      console.error('Error in addMemberToPathway:', error)
      throw error
    }
  }

  static async updateMemberProgress(memberId: string, updates: Partial<PathwayMember>) {
    try {
      await validateResourceOwnership('pathway_members', memberId)
      
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('pathway_members')
          .update(updates)
          .eq('id', memberId)
          .select()
          .single()
        
        if (error) throw error
        return data
      })
    } catch (error) {
      console.error('Error in updateMemberProgress:', error)
      throw error
    }
  }

  static async removeMemberFromPathway(memberId: string) {
    try {
      await validateResourceOwnership('pathway_members', memberId)
      
      return withRetry(async () => {
        const { error } = await supabase
          .from('pathway_members')
          .delete()
          .eq('id', memberId)
        
        if (error) throw error
      })
    } catch (error) {
      console.error('Error in removeMemberFromPathway:', error)
      throw error
    }
  }

  // Get pathway statistics
  static async getPathwayStats(pathwayId: string) {
    try {
      await validateResourceOwnership('pathways', pathwayId)
      
      const { data: members, error: membersError } = await supabase
        .from('pathway_members')
        .select('*')
        .eq('pathway_id', pathwayId)

      if (membersError) throw membersError

    const totalMembers = members?.length || 0
    const completedMembers = members?.filter(m => m.completed_at).length || 0
    const completionRate = totalMembers > 0 ? (completedMembers / totalMembers) * 100 : 0

    // Calculate average duration for completed members
    const completedWithDuration = members?.filter(m => m.completed_at) || []
    const totalDuration = completedWithDuration.reduce((sum, member) => {
      const start = new Date(member.started_at).getTime()
      const end = new Date(member.completed_at!).getTime()
      return sum + (end - start)
    }, 0)

    const averageDuration = completedWithDuration.length > 0
      ? totalDuration / completedWithDuration.length
      : 0

      return {
        totalMembers,
        completedMembers,
        completionRate,
        averageDuration,
        activeMembersPerStep: await this.getActiveMembersPerStep(pathwayId, members || [])
      }
    } catch (error) {
      console.error('Error in getPathwayStats:', error)
      throw error
    }
  }

  private static async getActiveMembersPerStep(pathwayId: string, members: PathwayMember[]) {
    const { data: steps } = await supabase
      .from('pathway_steps')
      .select('*')
      .eq('pathway_id', pathwayId)
      .order('order_index')

    if (!steps) return []

    return steps.map(step => ({
      stepId: step.id,
      stepName: step.name,
      orderIndex: step.order_index,
      activeMembers: members.filter(m => m.current_step === step.order_index && !m.completed_at).length
    }))
  }
}