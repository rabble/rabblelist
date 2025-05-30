import { supabase } from '@/lib/supabase'
import { getCurrentOrganizationId } from '@/lib/serviceHelpers'

export interface EmailTrackingEvent {
  id: string
  organization_id: string
  campaign_id?: string
  contact_id?: string
  email_address: string
  event_type: 'send' | 'delivered' | 'open' | 'click' | 'bounce' | 'spam' | 'unsubscribe' | 'dropped'
  event_data?: any
  clicked_url?: string
  bounce_reason?: string
  occurrence_count: number
  user_agent?: string
  ip_address?: string
  device_type?: string
  email_client?: string
  ab_variant_id?: string
  event_timestamp: string
  created_at: string
}

export interface EmailLink {
  id: string
  organization_id: string
  campaign_id: string
  original_url: string
  tracking_url: string
  link_alias?: string
  click_count: number
  unique_click_count: number
  created_at: string
  updated_at: string
}

export interface EmailStatistics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  unsubscribed: number
  spam_reports: number
  unique_opens: number
  unique_clicks: number
  open_rate: number
  click_rate: number
  bounce_rate: number
}

export class EmailTrackingService {
  private static instance: EmailTrackingService
  
  static getInstance(): EmailTrackingService {
    if (!EmailTrackingService.instance) {
      EmailTrackingService.instance = new EmailTrackingService()
    }
    return EmailTrackingService.instance
  }

  /**
   * Generate a tracking pixel URL for email opens
   */
  async generateTrackingPixel(campaignId: string, contactId?: string): Promise<string> {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
    const trackingId = crypto.randomUUID()
    
    // Store tracking pixel info in campaign assets
    await supabase
      .from('campaign_assets')
      .update({ tracking_pixel_url: `${baseUrl}/api/email/track/${trackingId}` })
      .eq('campaign_id', campaignId)
    
    return `${baseUrl}/api/email/track/open/${trackingId}?campaign=${campaignId}${contactId ? `&contact=${contactId}` : ''}`
  }

  /**
   * Generate tracking links for URLs in email content
   */
  async generateTrackingLinks(
    campaignId: string, 
    urls: { url: string; alias?: string }[]
  ): Promise<Map<string, string>> {
    const organizationId = await getCurrentOrganizationId()
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
    const linkMap = new Map<string, string>()
    
    for (const { url, alias } of urls) {
      const trackingId = crypto.randomUUID()
      const trackingUrl = `${baseUrl}/api/email/track/click/${trackingId}`
      
      // Store link mapping
      const { error } = await supabase
        .from('email_links')
        .insert({
          organization_id: organizationId,
          campaign_id: campaignId,
          original_url: url,
          tracking_url: trackingUrl,
          link_alias: alias
        })
      
      if (!error) {
        linkMap.set(url, trackingUrl)
      }
    }
    
    return linkMap
  }

  /**
   * Replace URLs in email content with tracking URLs
   */
  replaceLinksWithTracking(content: string, linkMap: Map<string, string>): string {
    let trackedContent = content
    
    linkMap.forEach((trackingUrl, originalUrl) => {
      // Replace all occurrences of the original URL
      const regex = new RegExp(originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      trackedContent = trackedContent.replace(regex, trackingUrl)
    })
    
    return trackedContent
  }

  /**
   * Track an email event
   */
  async trackEvent(event: Partial<EmailTrackingEvent>): Promise<void> {
    const organizationId = await getCurrentOrganizationId()
    
    const { error } = await supabase
      .from('email_tracking_events')
      .insert({
        ...event,
        organization_id: organizationId,
        event_timestamp: event.event_timestamp || new Date().toISOString()
      })
    
    if (error) {
      console.error('Error tracking email event:', error)
    }
  }

  /**
   * Get email statistics for a campaign
   */
  async getCampaignStatistics(campaignId: string): Promise<EmailStatistics | null> {
    const { data, error } = await supabase
      .from('campaign_assets')
      .select('email_statistics')
      .eq('campaign_id', campaignId)
      .single()
    
    if (error || !data) {
      console.error('Error fetching email statistics:', error)
      return null
    }
    
    return data.email_statistics as EmailStatistics
  }

  /**
   * Get tracking events for a campaign
   */
  async getCampaignTrackingEvents(
    campaignId: string,
    filters?: {
      event_type?: EmailTrackingEvent['event_type']
      contact_id?: string
      start_date?: string
      end_date?: string
    }
  ): Promise<EmailTrackingEvent[]> {
    let query = supabase
      .from('email_tracking_events')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('event_timestamp', { ascending: false })
    
    if (filters?.event_type) {
      query = query.eq('event_type', filters.event_type)
    }
    
    if (filters?.contact_id) {
      query = query.eq('contact_id', filters.contact_id)
    }
    
    if (filters?.start_date) {
      query = query.gte('event_timestamp', filters.start_date)
    }
    
    if (filters?.end_date) {
      query = query.lte('event_timestamp', filters.end_date)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching tracking events:', error)
      return []
    }
    
    return data || []
  }

  /**
   * Get click data for all links in a campaign
   */
  async getCampaignLinkStats(campaignId: string): Promise<EmailLink[]> {
    const { data, error } = await supabase
      .from('email_links')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('click_count', { ascending: false })
    
    if (error) {
      console.error('Error fetching link stats:', error)
      return []
    }
    
    return data || []
  }

  /**
   * Get timeline of email interactions for a contact
   */
  async getContactEmailTimeline(contactId: string): Promise<EmailTrackingEvent[]> {
    const { data, error } = await supabase
      .from('email_tracking_events')
      .select('*')
      .eq('contact_id', contactId)
      .order('event_timestamp', { ascending: false })
    
    if (error) {
      console.error('Error fetching contact email timeline:', error)
      return []
    }
    
    return data || []
  }

  /**
   * Handle webhook from email service provider
   */
  async handleWebhook(
    provider: 'sendgrid' | 'mailgun',
    webhookData: any
  ): Promise<void> {
    // Parse webhook based on provider format
    const events = this.parseWebhookData(provider, webhookData)
    
    // Track each event
    for (const event of events) {
      await this.trackEvent(event)
    }
  }

  /**
   * Parse webhook data from different providers
   */
  private parseWebhookData(
    provider: 'sendgrid' | 'mailgun',
    data: any
  ): Partial<EmailTrackingEvent>[] {
    const events: Partial<EmailTrackingEvent>[] = []
    
    if (provider === 'sendgrid') {
      // SendGrid sends arrays of events
      const sgEvents = Array.isArray(data) ? data : [data]
      
      for (const event of sgEvents) {
        events.push({
          email_address: event.email,
          event_type: this.mapSendGridEvent(event.event),
          event_timestamp: new Date(event.timestamp * 1000).toISOString(),
          campaign_id: event.campaign_id,
          contact_id: event.contact_id,
          clicked_url: event.url,
          bounce_reason: event.reason,
          user_agent: event.useragent,
          ip_address: event.ip,
          event_data: event
        })
      }
    } else if (provider === 'mailgun') {
      // Mailgun webhook format
      events.push({
        email_address: data.recipient,
        event_type: this.mapMailgunEvent(data.event),
        event_timestamp: new Date(data.timestamp * 1000).toISOString(),
        campaign_id: data['user-variables']?.campaign_id,
        contact_id: data['user-variables']?.contact_id,
        clicked_url: data.url,
        bounce_reason: data.error,
        user_agent: data['client-info']?.['user-agent'],
        ip_address: data.ip,
        device_type: data['client-info']?.['device-type'],
        email_client: data['client-info']?.['client-name'],
        event_data: data
      })
    }
    
    return events
  }

  private mapSendGridEvent(event: string): EmailTrackingEvent['event_type'] {
    const eventMap: Record<string, EmailTrackingEvent['event_type']> = {
      'processed': 'send',
      'delivered': 'delivered',
      'open': 'open',
      'click': 'click',
      'bounce': 'bounce',
      'spamreport': 'spam',
      'unsubscribe': 'unsubscribe',
      'dropped': 'dropped'
    }
    
    return eventMap[event] || 'send'
  }

  private mapMailgunEvent(event: string): EmailTrackingEvent['event_type'] {
    const eventMap: Record<string, EmailTrackingEvent['event_type']> = {
      'accepted': 'send',
      'delivered': 'delivered',
      'opened': 'open',
      'clicked': 'click',
      'failed': 'bounce',
      'complained': 'spam',
      'unsubscribed': 'unsubscribe'
    }
    
    return eventMap[event] || 'send'
  }
}