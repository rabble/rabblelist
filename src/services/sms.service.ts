import { supabase } from '@/lib/supabase'
import { twilioConfig } from '@/lib/twilio.config'
import { withRetry } from '@/lib/retryUtils'
import { OrganizationAPIKeyService } from './api-key.service'

export interface SMSMessage {
  to: string[]
  body: string
  campaignId?: string
  tags?: string[]
  mediaUrl?: string
}

export interface SMSCampaignMessage {
  body: string
  mediaUrl?: string
  personalizeFields?: string[] // e.g., ['firstName', 'lastName']
}

export interface SMSRecipient {
  id: string
  phone: string
  firstName?: string
  lastName?: string
  [key: string]: any
}

export interface SMSCampaignResult {
  successCount: number
  failureCount: number
  failedRecipients: string[]
}

export class SMSService {
  private static twilioWorkerUrl = import.meta.env.VITE_TELEPHONY_WEBHOOK_URL || '/api/telephony'
  private static apiKeyService = OrganizationAPIKeyService.getInstance()

  /**
   * Get current organization ID
   */
  private static async getCurrentOrgId(): Promise<string> {
    const { data } = await supabase.rpc('get_user_current_organization')
    if (!data) throw new Error('No organization found')
    return data
  }

  /**
   * Send a single SMS message
   */
  static async sendSMS(message: SMSMessage) {
    return withRetry(async () => {
      // Get organization ID and service configuration
      const orgId = await this.getCurrentOrgId()
      const serviceConfig = await this.apiKeyService.getServiceConfig(orgId, 'twilio')
      
      // Prepare request payload with org-specific or system keys
      const payload = {
        to: message.to,
        body: message.body,
        from: twilioConfig.phoneNumbers.US,
        mediaUrl: message.mediaUrl,
        statusCallback: `${this.twilioWorkerUrl}/sms/status`,
        // Include keys for the worker to use
        twilioConfig: serviceConfig.useCustomKeys ? {
          accountSid: serviceConfig.keys.account_sid,
          authToken: serviceConfig.keys.auth_token
        } : undefined
      }
      
      // Call our Cloudflare Worker which has the Twilio credentials
      const response = await fetch(`${this.twilioWorkerUrl}/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Failed to send SMS: ${response.statusText}`)
      }

      const result = await response.json()

      // Track usage if using system keys
      if (!serviceConfig.useCustomKeys) {
        await this.apiKeyService.trackUsage(
          orgId,
          'twilio',
          'sms_sent',
          message.to.length,
          message.to.length * 1 // Approximate cost: 1 cent per SMS
        )
      }

      // Log SMS activity
      await this.logSMSActivity({
        to: message.to,
        body: message.body,
        campaignId: message.campaignId,
        tags: message.tags,
        status: 'sent',
        messageId: result.sid
      })

      return result
    })
  }

  /**
   * Send SMS campaign to multiple recipients
   */
  static async sendCampaignSMS(
    campaignId: string,
    recipients: SMSRecipient[],
    message: SMSCampaignMessage
  ): Promise<SMSCampaignResult> {
    const results = {
      successCount: 0,
      failureCount: 0,
      failedRecipients: [] as string[]
    }

    // Process in batches to avoid overwhelming the API
    const batchSize = 10
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (recipient) => {
          try {
            // Personalize message
            let personalizedBody = message.body
            if (message.personalizeFields) {
              message.personalizeFields.forEach(field => {
                const value = recipient[field] || ''
                personalizedBody = personalizedBody.replace(`{{${field}}}`, value)
              })
            }

            await this.sendSMS({
              to: [recipient.phone],
              body: personalizedBody,
              campaignId,
              mediaUrl: message.mediaUrl,
              tags: ['campaign', 'bulk']
            })

            results.successCount++
          } catch (error) {
            console.error(`Failed to send SMS to ${recipient.phone}:`, error)
            results.failureCount++
            results.failedRecipients.push(recipient.phone)
          }
        })
      )

      // Add delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Update campaign stats
    await this.updateCampaignStats(campaignId, results.successCount)

    return results
  }

  /**
   * Get SMS delivery status
   */
  static async getSMSStatus(messageId: string) {
    return withRetry(async () => {
      const response = await fetch(`${this.twilioWorkerUrl}/sms/status/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get SMS status: ${response.statusText}`)
      }

      return response.json()
    })
  }

  /**
   * Log SMS activity to database
   */
  private static async logSMSActivity(activity: {
    to: string[]
    body: string
    campaignId?: string
    tags?: string[]
    status: string
    messageId?: string
  }) {
    return withRetry(async () => {
      const { error } = await supabase
        .from('communication_logs')
        .insert({
          type: 'sms',
          recipients: activity.to,
          subject: 'SMS Message',
          body: activity.body,
          campaign_id: activity.campaignId,
          tags: activity.tags || [],
          status: activity.status,
          metadata: {
            message_id: activity.messageId,
            sent_at: new Date().toISOString()
          }
        })

      if (error) throw error
    })
  }

  /**
   * Update campaign statistics
   */
  private static async updateCampaignStats(campaignId: string, sentCount: number) {
    return withRetry(async () => {
      // Get current stats
      const { data: currentStats } = await supabase
        .from('campaign_stats')
        .select('*')
        .eq('campaign_id', campaignId)
        .single()

      if (currentStats) {
        // Update existing stats
        await supabase
          .from('campaign_stats')
          .update({
            participants: (currentStats.participants || 0) + sentCount,
            updated_at: new Date().toISOString()
          })
          .eq('campaign_id', campaignId)
      } else {
        // Create new stats
        await supabase
          .from('campaign_stats')
          .insert({
            campaign_id: campaignId,
            participants: sentCount,
            conversions: 0,
            shares: 0,
            new_contacts: 0
          })
      }
    })
  }

  /**
   * Get auth token for worker authentication
   */
  private static async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ''
  }

  /**
   * Schedule SMS for later delivery
   */
  static async scheduleSMS(
    message: SMSMessage,
    scheduledFor: Date
  ) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('scheduled_communications')
        .insert({
          type: 'sms',
          scheduled_for: scheduledFor.toISOString(),
          recipients: message.to,
          content: {
            body: message.body,
            mediaUrl: message.mediaUrl
          },
          campaign_id: message.campaignId,
          tags: message.tags || [],
          status: 'scheduled'
        })
        .select()
        .single()

      if (error) throw error
      return data
    })
  }

  /**
   * Get SMS templates
   */
  static async getSMSTemplates(organizationId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    })
  }

  /**
   * Save SMS template
   */
  static async saveSMSTemplate(template: {
    name: string
    body: string
    tags: string[]
    organizationId: string
  }) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('sms_templates')
        .insert({
          name: template.name,
          body: template.body,
          tags: template.tags,
          organization_id: template.organizationId
        })
        .select()
        .single()

      if (error) throw error
      return data
    })
  }
}