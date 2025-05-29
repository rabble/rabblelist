import type { Campaign, CampaignStats } from '@/types/campaign.types'

/**
 * Helper function to get a campaign stat value by type
 * Since campaign_stats uses a key-value structure with stat_type and stat_value
 */
export const getCampaignStat = (campaign: Campaign | null | undefined, statType: string): number => {
  if (!campaign?.campaign_stats || !Array.isArray(campaign.campaign_stats)) return 0
  
  const stat = campaign.campaign_stats.find((s: CampaignStats) => s.stat_type === statType)
  return stat?.stat_value || 0
}

/**
 * Helper function to get a stat from a CampaignStats array
 */
export const getStatFromArray = (stats: CampaignStats[] | undefined, statType: string): number => {
  if (!stats || !Array.isArray(stats)) return 0
  
  const stat = stats.find((s: CampaignStats) => s.stat_type === statType)
  return stat?.stat_value || 0
}

/**
 * Common stat types used in campaigns
 */
export const CAMPAIGN_STAT_TYPES = {
  PARTICIPANTS: 'participants',
  CONVERSIONS: 'conversions',
  SHARES: 'shares',
  NEW_CONTACTS: 'new_contacts',
  EMAILS_SENT: 'emails_sent',
  EMAILS_OPENED: 'emails_opened',
  EMAILS_CLICKED: 'emails_clicked',
  CALLS_MADE: 'calls_made',
  CALLS_COMPLETED: 'calls_completed',
  AMOUNT_RAISED: 'amount_raised'
} as const