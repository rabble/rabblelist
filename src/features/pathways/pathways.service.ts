import { supabase } from '@/lib/supabase'
import { withRetry } from '@/lib/retryUtils'

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
      .order('created_at', { ascending: false })
      .order('pathway_steps.order_index', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  // Get single pathway with full details
  static async getPathway(id: string): Promise<PathwayWithSteps> {
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
      .order('pathway_steps.order_index', { ascending: true })
      .single()
    
    if (error) throw error
    return data
  }

  // Create new pathway
  static async createPathway(pathway: Partial<Pathway>) {
    const { data: user } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user?.user?.id)
      .single()

    if (!profile?.organization_id) {
      throw new Error('Organization not found')
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('pathways')
        .insert({
          ...pathway,
          organization_id: profile.organization_id,
          created_by: user?.user?.id
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    })
  }

  // Update pathway
  static async updatePathway(id: string, updates: Partial<Pathway>) {
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
  }

  // Delete pathway
  static async deletePathway(id: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from('pathways')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    })
  }

  // Pathway steps management
  static async createPathwayStep(step: Partial<PathwayStep>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('pathway_steps')
        .insert(step)
        .select()
        .single()
      
      if (error) throw error
      return data
    })
  }

  static async updatePathwayStep(id: string, updates: Partial<PathwayStep>) {
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
  }

  static async deletePathwayStep(id: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from('pathway_steps')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    })
  }

  static async reorderPathwaySteps(pathwayId: string, steps: { id: string; order_index: number }[]) {
    const updates = steps.map(step =>
      supabase
        .from('pathway_steps')
        .update({ order_index: step.order_index })
        .eq('id', step.id)
    )

    return Promise.all(updates)
  }

  // Pathway members management
  static async getPathwayMembers(pathwayId: string) {
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
  }

  static async addMemberToPathway(pathwayId: string, contactId: string) {
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
  }

  static async updateMemberProgress(memberId: string, updates: Partial<PathwayMember>) {
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
  }

  static async removeMemberFromPathway(memberId: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from('pathway_members')
        .delete()
        .eq('id', memberId)
      
      if (error) throw error
    })
  }

  // Get pathway statistics
  static async getPathwayStats(pathwayId: string) {
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