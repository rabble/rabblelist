import { supabase } from '@/lib/supabase'

export interface ABTestVariant {
  id: string
  name: string
  allocation: number // Percentage 0-100
  subject?: string
  content?: string
  template_id?: string
  // Additional variant-specific data
  [key: string]: any
}

export interface ABTestConfig {
  variants: ABTestVariant[]
  winning_criteria: 'open_rate' | 'click_rate' | 'conversion_rate'
  test_duration_hours: number
  minimum_sample_size: number
  confidence_level: number // 0.90, 0.95, 0.99
}

export interface ABTestAssignment {
  id: string
  campaign_id: string
  contact_id: string
  variant_id: string
  assigned_at: string
}

export interface ABTestResult {
  id: string
  campaign_id: string
  variant_id: string
  metric_name: string
  metric_value: number
  sample_size: number
  conversions: number
  confidence_score?: number
  is_winner: boolean
  calculated_at: string
}

export interface ABTestStatus {
  is_running: boolean
  has_winner: boolean
  winning_variant_id?: string
  results: ABTestResult[]
  total_participants: number
  test_start_time?: string
  test_end_time?: string
  time_remaining_hours?: number
}

export class ABTestingService {
  private static instance: ABTestingService
  
  static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService()
    }
    return ABTestingService.instance
  }

  /**
   * Create or update A/B test configuration for a campaign
   */
  async configureABTest(campaignId: string, config: ABTestConfig): Promise<void> {
    // Validate allocations sum to 100%
    const totalAllocation = config.variants.reduce((sum, v) => sum + v.allocation, 0)
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Variant allocations must sum to 100%')
    }
    
    // Validate at least 2 variants
    if (config.variants.length < 2) {
      throw new Error('A/B test requires at least 2 variants')
    }
    
    const { error } = await supabase
      .from('campaigns')
      .update({
        is_ab_test: true,
        ab_test_config: config
      })
      .eq('id', campaignId)
    
    if (error) {
      console.error('Error configuring A/B test:', error)
      throw error
    }
  }

  /**
   * Get variant assignment for a contact in a campaign
   */
  async getVariantAssignment(
    campaignId: string, 
    contactId: string
  ): Promise<string | null> {
    // Check existing assignment
    const { data: existing } = await supabase
      .from('ab_test_assignments')
      .select('variant_id')
      .eq('campaign_id', campaignId)
      .eq('contact_id', contactId)
      .single()
    
    if (existing) {
      return existing.variant_id
    }
    
    // Assign new variant using database function
    const { data, error } = await supabase
      .rpc('assign_ab_test_variant', {
        p_campaign_id: campaignId,
        p_contact_id: contactId
      })
    
    if (error) {
      console.error('Error assigning variant:', error)
      return null
    }
    
    return data
  }

  /**
   * Get variant assignments for multiple contacts
   */
  async getBulkVariantAssignments(
    campaignId: string,
    contactIds: string[]
  ): Promise<Map<string, string>> {
    const assignments = new Map<string, string>()
    
    // Get existing assignments
    const { data: existing } = await supabase
      .from('ab_test_assignments')
      .select('contact_id, variant_id')
      .eq('campaign_id', campaignId)
      .in('contact_id', contactIds)
    
    // Add existing assignments to map
    existing?.forEach(assignment => {
      assignments.set(assignment.contact_id, assignment.variant_id)
    })
    
    // Find contacts without assignments
    const unassigned = contactIds.filter(id => !assignments.has(id))
    
    // Assign variants to unassigned contacts
    for (const contactId of unassigned) {
      const variantId = await this.getVariantAssignment(campaignId, contactId)
      if (variantId) {
        assignments.set(contactId, variantId)
      }
    }
    
    return assignments
  }

  /**
   * Get A/B test configuration for a campaign
   */
  async getABTestConfig(campaignId: string): Promise<ABTestConfig | null> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('ab_test_config, is_ab_test')
      .eq('id', campaignId)
      .single()
    
    if (error || !data?.is_ab_test || !data.ab_test_config) {
      return null
    }
    
    return data.ab_test_config as ABTestConfig
  }

  /**
   * Calculate and update A/B test results
   */
  async calculateResults(campaignId: string): Promise<void> {
    const { error } = await supabase
      .rpc('calculate_ab_test_results', {
        p_campaign_id: campaignId
      })
    
    if (error) {
      console.error('Error calculating A/B test results:', error)
      throw error
    }
  }

  /**
   * Get current A/B test status and results
   */
  async getTestStatus(campaignId: string): Promise<ABTestStatus | null> {
    // Get campaign info
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('is_ab_test, ab_test_config, winning_variant_id, ab_test_ended_at, created_at')
      .eq('id', campaignId)
      .single()
    
    if (!campaign?.is_ab_test) {
      return null
    }
    
    const config = campaign.ab_test_config as ABTestConfig
    
    // Get results
    const { data: results } = await supabase
      .from('ab_test_results')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('variant_id')
    
    // Get total participants
    const { count: totalParticipants } = await supabase
      .from('ab_test_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
    
    // Calculate time remaining
    const testStartTime = new Date(campaign.created_at)
    const testEndTime = new Date(testStartTime.getTime() + config.test_duration_hours * 60 * 60 * 1000)
    const now = new Date()
    const timeRemainingMs = testEndTime.getTime() - now.getTime()
    const timeRemainingHours = Math.max(0, timeRemainingMs / (60 * 60 * 1000))
    
    return {
      is_running: !campaign.ab_test_ended_at && timeRemainingHours > 0,
      has_winner: !!campaign.winning_variant_id,
      winning_variant_id: campaign.winning_variant_id,
      results: results || [],
      total_participants: totalParticipants || 0,
      test_start_time: campaign.created_at,
      test_end_time: campaign.ab_test_ended_at || testEndTime.toISOString(),
      time_remaining_hours: campaign.ab_test_ended_at ? 0 : timeRemainingHours
    }
  }

  /**
   * End A/B test early and declare a winner
   */
  async endTest(campaignId: string, winningVariantId?: string): Promise<void> {
    const updates: any = {
      ab_test_ended_at: new Date().toISOString()
    }
    
    if (winningVariantId) {
      updates.winning_variant_id = winningVariantId
    }
    
    const { error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId)
    
    if (error) {
      console.error('Error ending A/B test:', error)
      throw error
    }
  }

  /**
   * Get variant content for a specific variant
   */
  async getVariantContent(
    campaignId: string, 
    variantId: string
  ): Promise<ABTestVariant | null> {
    const config = await this.getABTestConfig(campaignId)
    if (!config) return null
    
    return config.variants.find(v => v.id === variantId) || null
  }

  /**
   * Check if A/B test should be auto-ended
   */
  async checkTestCompletion(campaignId: string): Promise<boolean> {
    const status = await this.getTestStatus(campaignId)
    if (!status || !status.is_running) return false
    
    const config = await this.getABTestConfig(campaignId)
    if (!config) return false
    
    // Check if minimum sample size reached
    const minSamplePerVariant = Math.floor(config.minimum_sample_size / config.variants.length)
    const allVariantsHaveMinSample = status.results
      .filter(r => r.metric_name === config.winning_criteria)
      .every(r => r.sample_size >= minSamplePerVariant)
    
    // Check if test duration exceeded
    const testDurationExceeded = (status.time_remaining_hours || 0) <= 0
    
    // Auto-end if conditions met
    if (allVariantsHaveMinSample || testDurationExceeded) {
      await this.calculateResults(campaignId)
      
      // Get winner from results
      const winnerResult = status.results
        .filter(r => r.metric_name === config.winning_criteria && r.is_winner)
        .sort((a, b) => b.metric_value - a.metric_value)[0]
      
      if (winnerResult) {
        await this.endTest(campaignId, winnerResult.variant_id)
        return true
      }
    }
    
    return false
  }

  /**
   * Apply winning variant to all future sends
   */
  async applyWinningVariant(campaignId: string): Promise<void> {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('winning_variant_id, ab_test_config')
      .eq('id', campaignId)
      .single()
    
    if (!campaign?.winning_variant_id || !campaign.ab_test_config) {
      throw new Error('No winning variant found')
    }
    
    const config = campaign.ab_test_config as ABTestConfig
    const winningVariant = config.variants.find(v => v.id === campaign.winning_variant_id)
    
    if (!winningVariant) {
      throw new Error('Winning variant not found in config')
    }
    
    // Update campaign to use winning variant content
    // This depends on campaign type - email, SMS, etc.
    // Implementation would vary based on your campaign structure
    console.log('Applying winning variant:', winningVariant)
  }

  /**
   * Calculate statistical significance between two variants
   */
  calculateSignificance(
    variantA: { conversions: number; sample_size: number },
    variantB: { conversions: number; sample_size: number }
  ): number {
    // Simplified z-test for proportions
    const p1 = variantA.conversions / variantA.sample_size
    const p2 = variantB.conversions / variantB.sample_size
    const n1 = variantA.sample_size
    const n2 = variantB.sample_size
    
    const pooledP = (variantA.conversions + variantB.conversions) / (n1 + n2)
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2))
    
    if (se === 0) return 0
    
    const z = Math.abs(p1 - p2) / se
    
    // Convert z-score to confidence level
    // Simplified - in production use proper statistical library
    if (z >= 2.58) return 0.99  // 99% confidence
    if (z >= 1.96) return 0.95  // 95% confidence
    if (z >= 1.64) return 0.90  // 90% confidence
    return z / 2.58  // Proportional confidence
  }
}