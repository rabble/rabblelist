import { create } from 'zustand'
import { CampaignService } from '@/features/campaigns/campaigns.service'
import type { Campaign, CampaignStats } from '@/features/campaigns/campaign.types'

interface CampaignStore {
  campaigns: Campaign[]
  currentCampaign: Campaign | null
  isLoadingCampaigns: boolean
  isLoadingCampaign: boolean
  totalCampaigns: number
  
  // Actions
  loadCampaigns: (filters?: { type?: string; status?: string; search?: string }) => Promise<void>
  loadCampaign: (id: string) => Promise<void>
  createCampaign: (campaign: Partial<Campaign>) => Promise<Campaign | null>
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<boolean>
  deleteCampaign: (id: string) => Promise<boolean>
  addContactsToCampaign: (campaignId: string, contactIds: string[]) => Promise<boolean>
  updateCampaignStats: (campaignId: string, stats: Partial<CampaignStats>) => Promise<boolean>
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  campaigns: [],
  currentCampaign: null,
  isLoadingCampaigns: false,
  isLoadingCampaign: false,
  totalCampaigns: 0,

  loadCampaigns: async (filters) => {
    set({ isLoadingCampaigns: true })
    
    try {
      const data = await CampaignService.getCampaigns(filters)
      
      // Transform campaign stats from array to aggregated object
      const campaignsWithStats = (data || []).map((campaign: any) => {
        const stats = campaign.campaign_stats || []
        const aggregatedStats = stats.reduce((acc: any, stat: any) => ({
          participants: acc.participants + (stat.participants || 0),
          conversions: acc.conversions + (stat.conversions || 0),
          shares: acc.shares + (stat.shares || 0),
          new_contacts: acc.new_contacts + (stat.new_contacts || 0)
        }), { participants: 0, conversions: 0, shares: 0, new_contacts: 0 })

        return {
          ...campaign,
          stats: aggregatedStats
        }
      })

      set({ 
        campaigns: campaignsWithStats,
        totalCampaigns: data?.length || 0
      })
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      set({ isLoadingCampaigns: false })
    }
  },

  loadCampaign: async (id: string) => {
    set({ isLoadingCampaign: true })
    
    try {
      const data = await CampaignService.getCampaign(id)
      
      if (data) {
        set({ currentCampaign: data })
      }
    } catch (error) {
      console.error('Error loading campaign:', error)
    } finally {
      set({ isLoadingCampaign: false })
    }
  },

  createCampaign: async (campaign: Partial<Campaign>) => {
    try {
      const data = await CampaignService.createCampaign(campaign)
      
      if (data) {
        // Reload campaigns to include the new one
        await get().loadCampaigns()
        return data
      }
      
      return null
    } catch (error) {
      console.error('Error creating campaign:', error)
      return null
    }
  },

  updateCampaign: async (id: string, updates: Partial<Campaign>) => {
    try {
      const data = await CampaignService.updateCampaign(id, updates)
      
      if (data) {
        // Update in local state
        set(state => ({
          campaigns: state.campaigns.map(c => c.id === id ? { ...c, ...updates } : c),
          currentCampaign: state.currentCampaign?.id === id ? { ...state.currentCampaign, ...updates } : state.currentCampaign
        }))
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error updating campaign:', error)
      return false
    }
  },

  deleteCampaign: async (id: string) => {
    try {
      await CampaignService.deleteCampaign(id)
      
      // Remove from local state
      set(state => ({
        campaigns: state.campaigns.filter(c => c.id !== id),
        currentCampaign: state.currentCampaign?.id === id ? null : state.currentCampaign
      }))
      
      return true
    } catch (error) {
      console.error('Error deleting campaign:', error)
      return false
    }
  },

  addContactsToCampaign: async (campaignId: string, contactIds: string[]) => {
    try {
      await CampaignService.addContactsToCampaign(campaignId, contactIds)
      return true
    } catch (error) {
      console.error('Error adding contacts to campaign:', error)
      return false
    }
  },

  updateCampaignStats: async (campaignId: string, stats: Partial<CampaignStats>) => {
    try {
      await CampaignService.updateCampaignStats(campaignId, stats)
      
      // Optionally reload the campaign to get updated stats
      if (get().currentCampaign?.id === campaignId) {
        await get().loadCampaign(campaignId)
      }
      
      return true
    } catch (error) {
      console.error('Error updating campaign stats:', error)
      return false
    }
  }
}))