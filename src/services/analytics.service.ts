import { supabase } from '@/lib/supabase'
import { withRetry } from '@/lib/retryUtils'

export interface CampaignAnalytics {
  timeSeriesData: Array<{
    date: string
    participants: number
    conversions: number
    emails_sent?: number
    calls_made?: number
  }>
  channelPerformance: {
    email: { sent: number; opened: number; clicked: number }
    sms: { sent: number; delivered: number; responded: number }
    phone: { attempted: number; completed: number; converted: number }
    social: { posts: number; shares: number; clicks: number }
  }
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
  }>
}

export class AnalyticsService {
  /**
   * Get campaign analytics for a specific time range
   */
  static async getCampaignAnalytics(
    campaignId: string,
    dateRange: '7d' | '30d' | 'all' = '7d'
  ): Promise<CampaignAnalytics> {
    return withRetry(async () => {
      // Calculate date range
      const now = new Date()
      const startDate = new Date()
      
      if (dateRange === '7d') {
        startDate.setDate(now.getDate() - 7)
      } else if (dateRange === '30d') {
        startDate.setDate(now.getDate() - 30)
      } else {
        startDate.setFullYear(2020) // All time
      }

      // Get time series data from campaign_stats
      const { data: statsData } = await supabase
        .from('campaign_stats')
        .select('*')
        .eq('campaign_id', campaignId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      // Get communication logs for this campaign
      const { data: emailLogs } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('type', 'email')
        .gte('created_at', startDate.toISOString())

      const { data: smsLogs } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('type', 'sms')
        .gte('created_at', startDate.toISOString())

      const { data: callLogs } = await supabase
        .from('phonebank_sessions')
        .select('*')
        .eq('campaign_id', campaignId)
        .gte('created_at', startDate.toISOString())

      // Process time series data
      const timeSeriesData = this.processTimeSeriesData(statsData || [], startDate, now)

      // Calculate channel performance
      const channelPerformance = {
        email: {
          sent: emailLogs?.filter(l => l.status === 'sent').length || 0,
          opened: emailLogs?.filter(l => l.status === 'opened').length || 0,
          clicked: emailLogs?.filter(l => l.status === 'clicked').length || 0
        },
        sms: {
          sent: smsLogs?.filter(l => l.status === 'sent').length || 0,
          delivered: smsLogs?.filter(l => l.status === 'delivered').length || 0,
          responded: smsLogs?.filter(l => l.metadata?.responded).length || 0
        },
        phone: {
          attempted: callLogs?.length || 0,
          completed: callLogs?.filter(c => c.status === 'completed').length || 0,
          converted: callLogs?.filter(c => c.outcome === 'supporter').length || 0
        },
        social: {
          posts: 0, // Would need social media integration
          shares: statsData?.[0]?.shares || 0,
          clicks: 0 // Would need tracking
        }
      }

      // Get recent activity
      const recentActivity = await this.getRecentActivity(campaignId)

      return {
        timeSeriesData,
        channelPerformance,
        recentActivity
      }
    })
  }

  /**
   * Process raw stats into time series data
   */
  private static processTimeSeriesData(
    statsData: any[],
    startDate: Date,
    endDate: Date
  ) {
    // Create a map of dates to stats
    const statsByDate = new Map<string, any>()
    
    statsData.forEach(stat => {
      const date = new Date(stat.created_at).toISOString().split('T')[0]
      statsByDate.set(date, stat)
    })

    // Generate data for each day in range
    const timeSeriesData = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayName = currentDate.toLocaleDateString('en', { weekday: 'short' })
      const stats = statsByDate.get(dateStr)
      
      timeSeriesData.push({
        date: dayName,
        participants: stats?.participants || 0,
        conversions: stats?.conversions || 0,
        emails_sent: stats?.emails_sent || 0,
        calls_made: stats?.calls_made || 0
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return timeSeriesData
  }

  /**
   * Get recent activity for a campaign
   */
  private static async getRecentActivity(campaignId: string) {
    const activities: any[] = []

    // Get recent signatures
    const { data: signatures } = await supabase
      .from('petition_signatures')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('signed_at', { ascending: false })
      .limit(5)

    signatures?.forEach(sig => {
      activities.push({
        id: sig.id,
        type: 'signature',
        description: `${sig.full_name} signed the petition`,
        timestamp: sig.signed_at
      })
    })

    // Get recent phone bank sessions
    const { data: sessions } = await supabase
      .from('phonebank_sessions')
      .select('*, contacts(*)')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(5)

    sessions?.forEach(session => {
      if (session.outcome === 'answered') {
        activities.push({
          id: session.id,
          type: 'call',
          description: `Called ${session.contacts?.full_name || 'Contact'}`,
          timestamp: session.created_at
        })
      }
    })

    // Sort by timestamp and return top 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  }

  /**
   * Get engagement dashboard statistics
   */
  static async getEngagementStats(organizationId: string) {
    return withRetry(async () => {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Get contact engagement metrics
      const { data: contacts, count: totalContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)

      // Get recent activity counts
      const { count: recentCalls } = await supabase
        .from('contact_interactions')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('type', 'call')
        .gte('created_at', sevenDaysAgo.toISOString())

      // Calculate engagement segments
      const { data: activeContacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', organizationId)
        .gte('last_contact_date', thirtyDaysAgo.toISOString())

      const engagementRate = totalContacts ? (activeContacts?.length || 0) / totalContacts : 0

      return {
        totalMembers: totalContacts || 0,
        newThisMonth: contacts?.filter(c => 
          new Date(c.created_at) >= thirtyDaysAgo
        ).length || 0,
        engagementRate: Math.round(engagementRate * 100),
        activeThisWeek: recentCalls || 0,
        segments: {
          highlyEngaged: Math.round((activeContacts?.length || 0) * 0.2),
          moderate: Math.round((activeContacts?.length || 0) * 0.3),
          low: Math.round((activeContacts?.length || 0) * 0.3),
          inactive: (totalContacts || 0) - (activeContacts?.length || 0)
        }
      }
    })
  }

  /**
   * Get campaign activities for a specific contact
   */
  static async getCampaignActivitiesByContact(contactId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('campaign_activities')
        .select(`
          *,
          campaigns(name, type)
        `)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    })
  }

  /**
   * Get event registrations for a specific contact
   */
  static async getEventRegistrationsByContact(contactId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events(name, date, location)
        `)
        .eq('contact_id', contactId)
        .order('registered_at', { ascending: false })

      if (error) throw error
      return data || []
    })
  }

  /**
   * Get engagement ladder statistics
   */
  static async getEngagementLadder(organizationId: string) {
    return withRetry(async () => {
      // Count contacts by their tags
      const { data: contacts } = await supabase
        .from('contacts')
        .select('tags')
        .eq('organization_id', organizationId)
        .eq('status', 'active')

      let supporter = 0
      let volunteer = 0
      let organizer = 0
      let leader = 0

      contacts?.forEach(contact => {
        const tags = contact.tags || []
        if (tags.includes('leader') || tags.includes('board-member')) {
          leader++
        } else if (tags.includes('organizer') || tags.includes('event-organizer')) {
          organizer++
        } else if (tags.includes('volunteer') || tags.includes('phone-banker') || tags.includes('canvasser')) {
          volunteer++
        } else {
          supporter++
        }
      })

      return {
        supporter,
        volunteer,
        organizer,
        leader
      }
    })
  }

  /**
   * Get campaign performance data
   */
  static async getCampaignPerformance(organizationId: string) {
    return withRetry(async () => {
      // Get active campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false })
        .limit(5)

      const campaignData = []

      for (const campaign of campaigns || []) {
        if (campaign.type === 'petition') {
          // Get petition signature count
          const { count } = await supabase
            .from('petition_signatures')
            .select('*', { count: 'exact' })
            .eq('campaign_id', campaign.id)

          campaignData.push({
            id: campaign.id,
            name: campaign.name,
            type: campaign.type,
            status: campaign.status,
            metrics: {
              signatures: count || 0,
              goal: campaign.goal || 0,
              progress: campaign.goal ? Math.round(((count || 0) / campaign.goal) * 100) : 0
            }
          })
        } else if (campaign.type === 'event') {
          // For event campaigns, count registrations
          const { count } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact' })
            .eq('organization_id', organizationId)

          campaignData.push({
            id: campaign.id,
            name: campaign.name,
            type: campaign.type,
            status: campaign.status,
            metrics: {
              registrations: count || 0,
              goal: campaign.goal || 0
            }
          })
        }
      }

      return campaignData
    })
  }

  /**
   * Get recent engagement activities for an organization
   */
  static async getRecentEngagementActivities(organizationId: string, limit = 10) {
    return withRetry(async () => {
      const activities: any[] = []

      // Get recent event registrations
      const { data: registrations } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events!inner(name, organization_id),
          contacts(full_name)
        `)
        .eq('events.organization_id', organizationId)
        .order('registered_at', { ascending: false })
        .limit(limit)

      registrations?.forEach(reg => {
        activities.push({
          id: reg.id,
          type: 'event',
          contact: reg.contacts?.full_name || 'Unknown',
          description: `Registered for ${reg.events.name}`,
          timestamp: new Date(reg.registered_at),
          status: 'completed' as const
        })
      })

      // Get recent petition signatures
      const { data: signatures } = await supabase
        .from('petition_signatures')
        .select(`
          *,
          campaigns!inner(name, organization_id)
        `)
        .eq('campaigns.organization_id', organizationId)
        .order('signed_at', { ascending: false })
        .limit(limit)

      signatures?.forEach(sig => {
        activities.push({
          id: sig.id,
          type: 'action',
          contact: sig.full_name,
          description: `Signed ${sig.campaigns.name}`,
          timestamp: new Date(sig.signed_at),
          status: 'completed' as const
        })
      })

      // Get recent communication logs
      const { data: communications } = await supabase
        .from('communication_logs')
        .select(`
          *,
          contacts(full_name)
        `)
        .eq('organization_id', organizationId)
        .in('status', ['opened', 'clicked', 'responded'])
        .order('created_at', { ascending: false })
        .limit(limit)

      communications?.forEach(comm => {
        const typeMap = {
          email: 'email' as const,
          sms: 'sms' as const
        }
        const actionMap = {
          opened: 'opened',
          clicked: 'clicked on',
          responded: 'responded to'
        }
        
        activities.push({
          id: comm.id,
          type: typeMap[comm.type as keyof typeof typeMap] || 'email',
          contact: comm.contacts?.full_name || 'Unknown',
          description: `${actionMap[comm.status as keyof typeof actionMap] || comm.status} ${comm.type}`,
          timestamp: new Date(comm.created_at),
          status: 'completed' as const
        })
      })

      // Get recent volunteer actions from pathways
      const { data: pathwayActions } = await supabase
        .from('pathway_members')
        .select(`
          *,
          contacts(full_name),
          pathways(name)
        `)
        .eq('organization_id', organizationId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(limit)

      pathwayActions?.forEach(action => {
        activities.push({
          id: action.id,
          type: 'action',
          contact: action.contacts?.full_name || 'Unknown',
          description: `Completed ${action.pathways?.name || 'pathway'}`,
          timestamp: new Date(action.completed_at),
          status: 'completed' as const
        })
      })

      // Sort all activities by timestamp and return top items
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)
    })
  }
}