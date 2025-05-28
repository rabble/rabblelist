import { supabase } from '@/lib/supabase'
import { withRetry } from '@/lib/retryUtils'
import type { Campaign, CampaignStats, CampaignAsset, Petition, PetitionSignature } from './campaign.types'

export class CampaignService {
  // Get all campaigns for the organization
  static async getCampaigns(filters?: {
    type?: string
    status?: string
    search?: string
  }) {
    // Get current user's organization
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) {
      console.error('No authenticated user')
      return []
    }

    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.user.id)
      .single()

    if (!profile?.organization_id) {
      console.error('No organization found for user')
      return []
    }

    let query = supabase
      .from('campaigns')
      .select(`
        *,
        campaign_stats (
          participants,
          conversions,
          shares,
          new_contacts
        )
      `)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type)
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching campaigns:', error)
      throw error
    }
    return data || []
  }

  // Get single campaign with full details
  static async getCampaign(id: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_stats (*),
        campaign_assets (*),
        campaign_contacts (count),
        created_by:users!campaigns_created_by_fkey (
          full_name,
          email
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  // Create new campaign
  static async createCampaign(campaign: Partial<Campaign>) {
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
        .from('campaigns')
        .insert({
          ...campaign,
          organization_id: profile.organization_id,
          created_by: user?.user?.id
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    })
  }

  // Update campaign
  static async updateCampaign(id: string, updates: Partial<Campaign>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('campaigns')
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

  // Delete campaign
  static async deleteCampaign(id: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    })
  }

  // Add contacts to campaign
  static async addContactsToCampaign(campaignId: string, contactIds: string[]) {
    const inserts = contactIds.map(contactId => ({
      campaign_id: campaignId,
      contact_id: contactId
    }))

    return withRetry(async () => {
      const { error } = await supabase
        .from('campaign_contacts')
        .upsert(inserts, { onConflict: 'campaign_id,contact_id' })
      
      if (error) throw error
    })
  }

  // Get campaign statistics
  static async getCampaignStats(campaignId: string, dateRange?: { start: Date; end: Date }) {
    let query = supabase
      .from('campaign_stats')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('date', { ascending: true })

    if (dateRange) {
      query = query
        .gte('date', dateRange.start.toISOString())
        .lte('date', dateRange.end.toISOString())
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  // Update campaign statistics
  static async updateCampaignStats(campaignId: string, stats: Partial<CampaignStats>) {
    const today = new Date().toISOString().split('T')[0]
    
    return withRetry(async () => {
      const { error } = await supabase
        .from('campaign_stats')
        .upsert({
          campaign_id: campaignId,
          date: today,
          ...stats
        }, { onConflict: 'campaign_id,date' })
      
      if (error) throw error
    })
  }

  // Campaign assets management
  static async getCampaignAssets(campaignId: string) {
    const { data, error } = await supabase
      .from('campaign_assets')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createCampaignAsset(asset: Partial<CampaignAsset>) {
    const { data: user } = await supabase.auth.getUser()
    
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('campaign_assets')
        .insert({
          ...asset,
          created_by: user?.user?.id
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    })
  }

  static async updateCampaignAsset(id: string, updates: Partial<CampaignAsset>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('campaign_assets')
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

  static async deleteCampaignAsset(id: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from('campaign_assets')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    })
  }

  // Petition specific methods
  static async getPetition(id: string) {
    const { data, error } = await supabase
      .from('petitions')
      .select(`
        *,
        signatures:petition_signatures (count),
        recent_signatures:petition_signatures (
          id,
          signer_name,
          comment,
          signed_at
        )
      `)
      .eq('id', id)
      .order('recent_signatures.signed_at', { ascending: false })
      .limit(10, { foreignTable: 'recent_signatures' })
      .single()
    
    if (error) throw error
    return data
  }

  static async createPetition(petition: Partial<Petition>) {
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
        .from('petitions')
        .insert({
          ...petition,
          organization_id: profile.organization_id
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    })
  }

  static async signPetition(petitionId: string, signature: Partial<PetitionSignature>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('petition_signatures')
        .insert({
          petition_id: petitionId,
          ...signature,
          ip_address: window.location.hostname,
          user_agent: navigator.userAgent
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    })
  }

  static async getPetitionSignatures(petitionId: string, limit = 100, offset = 0) {
    const { data, error } = await supabase
      .from('petition_signatures')
      .select('*', { count: 'exact' })
      .eq('petition_id', petitionId)
      .order('signed_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    return data
  }
}