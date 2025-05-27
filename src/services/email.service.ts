import { emailConfig } from '@/lib/email.config'
import { supabase } from '@/lib/supabase'
import { withRetry } from '@/lib/retryUtils'

export interface EmailMessage {
  to: string[]
  subject: string
  text?: string
  html?: string
  template?: string
  variables?: Record<string, any>
  tags?: string[]
  campaignId?: string
  trackOpens?: boolean
  trackClicks?: boolean
}

export interface EmailCampaign {
  id: string
  name: string
  subject: string
  fromName: string
  fromEmail: string
  template?: string
  html?: string
  text?: string
  recipientCount: number
  sentCount: number
  openCount: number
  clickCount: number
  status: 'draft' | 'scheduled' | 'sending' | 'sent'
  scheduledFor?: string
  sentAt?: string
}

export class EmailService {
  // Mock Mailgun API endpoint (in production, this would be a Cloudflare Worker)
  private static async callMailgunAPI(endpoint: string, data: any) {
    // In production, this would make an actual API call to Mailgun
    // For now, we'll mock the response and log to Supabase
    console.log(`[MOCK] Mailgun API Call: ${endpoint}`, data)
    
    // Log email activity to Supabase
    await supabase.from('email_logs').insert({
      endpoint,
      payload: data,
      status: 'mocked',
      created_at: new Date().toISOString()
    })
    
    return {
      id: `mock-${Date.now()}`,
      message: 'Queued. Thank you.'
    }
  }
  
  // Send single email
  static async sendEmail(message: EmailMessage) {
    return withRetry(async () => {
      const payload = {
        from: `${emailConfig.defaultFrom.name} <${emailConfig.defaultFrom.email}>`,
        to: message.to.join(','),
        subject: message.subject,
        text: message.text,
        html: message.html,
        'o:tag': message.tags || [],
        'o:tracking': message.trackOpens !== false,
        'o:tracking-clicks': message.trackClicks !== false,
        'v:campaign_id': message.campaignId,
        ...message.variables
      }
      
      const result = await this.callMailgunAPI('/messages', payload)
      
      // Log to our database
      await supabase.from('email_messages').insert({
        message_id: result.id,
        campaign_id: message.campaignId,
        recipients: message.to,
        subject: message.subject,
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      
      return result
    })
  }
  
  // Send bulk email campaign
  static async sendCampaignEmail(
    campaignId: string, 
    recipients: Array<{ id: string; email: string; firstName?: string; lastName?: string }>,
    emailData: { subject: string; html: string; tags?: string[] }
  ) {
    return withRetry(async () => {
      // Send emails with personalization
      const sendPromises = recipients.map(recipient => {
        // Personalize the email
        let personalizedHtml = emailData.html
        if (recipient.firstName) {
          personalizedHtml = personalizedHtml.replace(/{{firstName}}/g, recipient.firstName)
        }
        if (recipient.lastName) {
          personalizedHtml = personalizedHtml.replace(/{{lastName}}/g, recipient.lastName)
        }

        return this.sendEmail({
          to: [recipient.email],
          subject: emailData.subject,
          html: personalizedHtml,
          campaignId,
          tags: emailData.tags
        })
      })

      const results = await Promise.allSettled(sendPromises)
      
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const failureCount = results.filter(r => r.status === 'rejected').length

      console.log(`Campaign sent: ${successCount} successful, ${failureCount} failed`)

      return { successCount, failureCount }
    })
  }
  
  // Create email campaign
  static async createCampaign(campaign: Partial<EmailCampaign>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          ...campaign,
          status: 'draft',
          sent_count: 0,
          open_count: 0,
          click_count: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
        
      if (error) throw error
      return data
    })
  }
  
  // Get campaign analytics
  static async getCampaignAnalytics(campaignId: string) {
    return withRetry(async () => {
      // In production, this would fetch from Mailgun's API
      // For now, return mock data
      const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()
        
      return {
        sent: campaign?.sent_count || 0,
        delivered: campaign?.sent_count || 0,
        opens: campaign?.open_count || Math.floor((campaign?.sent_count || 0) * 0.22),
        clicks: campaign?.click_count || Math.floor((campaign?.sent_count || 0) * 0.03),
        bounces: 0,
        complaints: 0,
        unsubscribes: 0,
        openRate: 22,
        clickRate: 3
      }
    })
  }
  
  // Handle webhooks (in production, this would be in a Cloudflare Worker)
  static async handleWebhook(event: any) {
    // Process Mailgun webhook events
    switch (event.event) {
      case 'delivered':
      case 'opened':
      case 'clicked':
      case 'bounced':
      case 'complained':
      case 'unsubscribed':
        await supabase.from('email_events').insert({
          message_id: event['message-id'],
          event: event.event,
          recipient: event.recipient,
          campaign_id: event['user-variables']?.campaign_id,
          timestamp: new Date(event.timestamp * 1000).toISOString(),
          data: event
        })
        break
    }
  }
  
  // Get email templates
  static async getTemplates() {
    // In production, these would be stored in Mailgun or a CMS
    return [
      {
        id: 'welcome-volunteer',
        name: 'Welcome New Volunteer',
        subject: 'Welcome to {{organization_name}}!',
        variables: ['first_name', 'organization_name']
      },
      {
        id: 'event-reminder',
        name: 'Event Reminder',
        subject: 'Reminder: {{event_name}} is tomorrow!',
        variables: ['first_name', 'event_name', 'event_time', 'event_location']
      },
      {
        id: 'campaign-update',
        name: 'Campaign Update',
        subject: '{{campaign_name}} Update: {{update_title}}',
        variables: ['first_name', 'campaign_name', 'update_title', 'update_content']
      },
      {
        id: 'petition-thanks',
        name: 'Petition Thank You',
        subject: 'Thank you for signing {{petition_title}}',
        variables: ['first_name', 'petition_title', 'signature_count']
      },
      {
        id: 'donation-receipt',
        name: 'Donation Receipt',
        subject: 'Thank you for your donation to {{organization_name}}',
        variables: ['first_name', 'donation_amount', 'organization_name', 'tax_id']
      }
    ]
  }
}