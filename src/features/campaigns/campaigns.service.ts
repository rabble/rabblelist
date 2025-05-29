import { supabase } from '@/lib/supabase'
import { withRetry } from '@/lib/retryUtils'
import { getCurrentOrganizationId, validateResourceOwnership } from '@/lib/serviceHelpers'
import type { Campaign, CampaignStats, CampaignAsset, Petition, PetitionSignature } from './campaign.types'

export class CampaignService {
  // Get all campaigns for the organization
  static async getCampaigns(filters?: {
    type?: string
    status?: string
    search?: string
  }) {
    try {
      const organizationId = await getCurrentOrganizationId()

      let query = supabase
        .from('campaigns')
        .select(`
          *,
          campaign_stats (
            stat_type,
            stat_value,
            stat_date
          )
        `)
        .eq('organization_id', organizationId)
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
    } catch (error) {
      console.error('Error in getCampaigns:', error)
      return []
    }
  }

  // Get single campaign with full details
  static async getCampaign(id: string) {
    try {
      const organizationId = await getCurrentOrganizationId()
      
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
        .eq('organization_id', organizationId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error in getCampaign:', error)
      throw error
    }
  }

  // Create new campaign
  static async createCampaign(campaign: Partial<Campaign>) {
    try {
      const organizationId = await getCurrentOrganizationId()
      const { data: { user } } = await supabase.auth.getUser()
      
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('campaigns')
          .insert({
            ...campaign,
            organization_id: organizationId,
            created_by: user?.id
          })
          .select()
          .single()
        
        if (error) throw error
        return data
      })
    } catch (error) {
      console.error('Error in createCampaign:', error)
      throw error
    }
  }

  // Update campaign
  static async updateCampaign(id: string, updates: Partial<Campaign>) {
    try {
      await validateResourceOwnership('campaigns', id)
      
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
    } catch (error) {
      console.error('Error in updateCampaign:', error)
      throw error
    }
  }

  // Delete campaign
  static async deleteCampaign(id: string) {
    try {
      await validateResourceOwnership('campaigns', id)
      
      return withRetry(async () => {
        const { error } = await supabase
          .from('campaigns')
          .delete()
          .eq('id', id)
        
        if (error) throw error
      })
    } catch (error) {
      console.error('Error in deleteCampaign:', error)
      throw error
    }
  }

  // Add contacts to campaign
  static async addContactsToCampaign(campaignId: string, contactIds: string[]) {
    try {
      await validateResourceOwnership('campaigns', campaignId)
      
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
    } catch (error) {
      console.error('Error in addContactsToCampaign:', error)
      throw error
    }
  }

  // Get campaign statistics
  static async getCampaignStats(campaignId: string, dateRange?: { start: Date; end: Date }) {
    try {
      await validateResourceOwnership('campaigns', campaignId)
      
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
    } catch (error) {
      console.error('Error in getCampaignStats:', error)
      throw error
    }
  }

  // Update campaign statistics
  static async updateCampaignStats(campaignId: string, stats: Partial<CampaignStats>) {
    try {
      await validateResourceOwnership('campaigns', campaignId)
      
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
    } catch (error) {
      console.error('Error in updateCampaignStats:', error)
      throw error
    }
  }

  // Campaign assets management
  static async getCampaignAssets(campaignId: string) {
    try {
      await validateResourceOwnership('campaigns', campaignId)
      
      const { data, error } = await supabase
        .from('campaign_assets')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error in getCampaignAssets:', error)
      throw error
    }
  }

  static async createCampaignAsset(asset: Partial<CampaignAsset>) {
    try {
      if (asset.campaign_id) {
        await validateResourceOwnership('campaigns', asset.campaign_id)
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('campaign_assets')
          .insert({
            ...asset,
            created_by: user?.id
          })
          .select()
          .single()
        
        if (error) throw error
        return data
      })
    } catch (error) {
      console.error('Error in createCampaignAsset:', error)
      throw error
    }
  }

  static async updateCampaignAsset(id: string, updates: Partial<CampaignAsset>) {
    try {
      await validateResourceOwnership('campaign_assets', id)
      
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
    } catch (error) {
      console.error('Error in updateCampaignAsset:', error)
      throw error
    }
  }

  static async deleteCampaignAsset(id: string) {
    try {
      await validateResourceOwnership('campaign_assets', id)
      
      return withRetry(async () => {
        const { error } = await supabase
          .from('campaign_assets')
          .delete()
          .eq('id', id)
        
        if (error) throw error
      })
    } catch (error) {
      console.error('Error in deleteCampaignAsset:', error)
      throw error
    }
  }

  // Petition specific methods
  static async getPetition(id: string) {
    try {
      const organizationId = await getCurrentOrganizationId()
      
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
        .eq('organization_id', organizationId)
        .order('recent_signatures.signed_at', { ascending: false })
        .limit(10, { foreignTable: 'recent_signatures' })
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error in getPetition:', error)
      throw error
    }
  }

  static async createPetition(petition: Partial<Petition>) {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('petitions')
          .insert({
            ...petition,
            organization_id: organizationId
          })
          .select()
          .single()
        
        if (error) throw error
        return data
      })
    } catch (error) {
      console.error('Error in createPetition:', error)
      throw error
    }
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
    try {
      await validateResourceOwnership('petitions', petitionId)
      
      const { data, error } = await supabase
        .from('petition_signatures')
        .select('*', { count: 'exact' })
        .eq('petition_id', petitionId)
        .order('signed_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error in getPetitionSignatures:', error)
      throw error
    }
  }
}