import { supabase } from '@/lib/supabase'
import { retryWithBackoff } from '@/lib/retryUtils'
import type { Campaign, CampaignStats, CampaignAsset, Petition, PetitionSignature } from './campaign.types'

export class CampaignService {
  // Get all campaigns for the organization
  static async getCampaigns(filters?: {
    type?: string
    status?: string
    search?: string
  }) {
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
      .order('created_at', { ascending: false })

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type)
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    return retryWithBackoff(() => query)
  }

  // Get single campaign with full details
  static async getCampaign(id: string) {
    return retryWithBackoff(() =>
      supabase
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
    )
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

    return retryWithBackoff(() =>
      supabase
        .from('campaigns')
        .insert({
          ...campaign,
          organization_id: profile.organization_id,
          created_by: user?.user?.id
        })
        .select()
        .single()
    )
  }

  // Update campaign
  static async updateCampaign(id: string, updates: Partial<Campaign>) {
    return retryWithBackoff(() =>
      supabase
        .from('campaigns')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    )
  }

  // Delete campaign
  static async deleteCampaign(id: string) {
    return retryWithBackoff(() =>
      supabase
        .from('campaigns')
        .delete()
        .eq('id', id)
    )
  }

  // Add contacts to campaign
  static async addContactsToCampaign(campaignId: string, contactIds: string[]) {
    const inserts = contactIds.map(contactId => ({
      campaign_id: campaignId,
      contact_id: contactId
    }))

    return retryWithBackoff(() =>
      supabase
        .from('campaign_contacts')
        .upsert(inserts, { onConflict: 'campaign_id,contact_id' })
    )
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

    return retryWithBackoff(() => query)
  }

  // Update campaign statistics
  static async updateCampaignStats(campaignId: string, stats: Partial<CampaignStats>) {
    const today = new Date().toISOString().split('T')[0]
    
    return retryWithBackoff(() =>
      supabase
        .from('campaign_stats')
        .upsert({
          campaign_id: campaignId,
          date: today,
          ...stats
        }, { onConflict: 'campaign_id,date' })
    )
  }

  // Campaign assets management
  static async getCampaignAssets(campaignId: string) {
    return retryWithBackoff(() =>
      supabase
        .from('campaign_assets')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
    )
  }

  static async createCampaignAsset(asset: Partial<CampaignAsset>) {
    const { data: user } = await supabase.auth.getUser()
    
    return retryWithBackoff(() =>
      supabase
        .from('campaign_assets')
        .insert({
          ...asset,
          created_by: user?.user?.id
        })
        .select()
        .single()
    )
  }

  static async updateCampaignAsset(id: string, updates: Partial<CampaignAsset>) {
    return retryWithBackoff(() =>
      supabase
        .from('campaign_assets')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    )
  }

  static async deleteCampaignAsset(id: string) {
    return retryWithBackoff(() =>
      supabase
        .from('campaign_assets')
        .delete()
        .eq('id', id)
    )
  }

  // Petition specific methods
  static async getPetition(id: string) {
    return retryWithBackoff(() =>
      supabase
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
    )
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

    return retryWithBackoff(() =>
      supabase
        .from('petitions')
        .insert({
          ...petition,
          organization_id: profile.organization_id
        })
        .select()
        .single()
    )
  }

  static async signPetition(petitionId: string, signature: Partial<PetitionSignature>) {
    return retryWithBackoff(() =>
      supabase
        .from('petition_signatures')
        .insert({
          petition_id: petitionId,
          ...signature,
          ip_address: window.location.hostname,
          user_agent: navigator.userAgent
        })
        .select()
        .single()
    )
  }

  static async getPetitionSignatures(petitionId: string, limit = 100, offset = 0) {
    return retryWithBackoff(() =>
      supabase
        .from('petition_signatures')
        .select('*', { count: 'exact' })
        .eq('petition_id', petitionId)
        .order('signed_at', { ascending: false })
        .range(offset, offset + limit - 1)
    )
  }
}