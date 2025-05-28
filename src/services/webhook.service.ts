import { supabase } from '@/lib/supabase'
import { withRetry } from '@/lib/retryUtils'

export interface WebhookConfig {
  id: string
  organization_id: string
  name: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  last_triggered_at?: string
  failure_count: number
}

export interface WebhookEvent {
  id: string
  webhook_id: string
  event_type: string
  payload: any
  status: 'pending' | 'success' | 'failed'
  attempts: number
  response_status?: number
  response_body?: string
  error?: string
  created_at: string
  delivered_at?: string
}

export type WebhookEventType = 
  | 'contact.created'
  | 'contact.updated'
  | 'contact.deleted'
  | 'contact.tagged'
  | 'campaign.created'
  | 'campaign.started'
  | 'campaign.completed'
  | 'campaign.participant_added'
  | 'event.created'
  | 'event.registration'
  | 'event.attendance_marked'
  | 'event.cancelled'
  | 'pathway.started'
  | 'pathway.step_completed'
  | 'pathway.completed'
  | 'communication.sent'
  | 'communication.opened'
  | 'communication.clicked'
  | 'petition.signed'
  | 'donation.received'
  | 'phonebank.call_completed'

export class WebhookService {
  /**
   * Get all webhook configurations for an organization
   */
  static async getWebhooks(organizationId: string): Promise<WebhookConfig[]> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('webhook_configs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    })
  }

  /**
   * Create a new webhook configuration
   */
  static async createWebhook(webhook: Omit<WebhookConfig, 'id' | 'created_at' | 'updated_at' | 'failure_count'>): Promise<WebhookConfig> {
    return withRetry(async () => {
      // Generate a secure secret for webhook verification
      const secret = this.generateWebhookSecret()

      const { data, error } = await supabase
        .from('webhook_configs')
        .insert({
          ...webhook,
          secret,
          failure_count: 0
        })
        .select()
        .single()

      if (error) throw error
      return data
    })
  }

  /**
   * Update webhook configuration
   */
  static async updateWebhook(id: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('webhook_configs')
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

  /**
   * Delete webhook configuration
   */
  static async deleteWebhook(id: string): Promise<void> {
    return withRetry(async () => {
      const { error } = await supabase
        .from('webhook_configs')
        .delete()
        .eq('id', id)

      if (error) throw error
    })
  }

  /**
   * Get webhook event history
   */
  static async getWebhookEvents(webhookId: string, limit = 50): Promise<WebhookEvent[]> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    })
  }

  /**
   * Trigger a webhook event
   */
  static async triggerWebhook(
    organizationId: string, 
    eventType: WebhookEventType, 
    payload: any
  ): Promise<void> {
    try {
      // Get active webhooks that subscribe to this event
      const webhooks = await this.getWebhooks(organizationId)
      const activeWebhooks = webhooks.filter(w => 
        w.is_active && 
        (w.events.includes(eventType) || w.events.includes('*'))
      )

      // Queue webhook events for delivery
      for (const webhook of activeWebhooks) {
        await this.queueWebhookEvent(webhook, eventType, payload)
      }
    } catch (error) {
      console.error('Error triggering webhooks:', error)
    }
  }

  /**
   * Queue a webhook event for delivery
   */
  private static async queueWebhookEvent(
    webhook: WebhookConfig,
    eventType: string,
    payload: any
  ): Promise<void> {
    const { error } = await supabase
      .from('webhook_events')
      .insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload: {
          event: eventType,
          data: payload,
          timestamp: new Date().toISOString(),
          organization_id: webhook.organization_id
        },
        status: 'pending',
        attempts: 0
      })

    if (error) {
      console.error('Error queueing webhook event:', error)
    }
  }

  /**
   * Process pending webhook events (called by worker)
   */
  static async processPendingWebhooks(): Promise<void> {
    const { data: pendingEvents, error } = await supabase
      .from('webhook_events')
      .select(`
        *,
        webhook_configs!inner(*)
      `)
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10)

    if (error || !pendingEvents) return

    for (const event of pendingEvents) {
      await this.deliverWebhookEvent(event)
    }
  }

  /**
   * Deliver a webhook event
   */
  private static async deliverWebhookEvent(event: any): Promise<void> {
    const webhook = event.webhook_configs
    const signature = this.generateSignature(event.payload, webhook.secret)

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event.event_type,
          'X-Webhook-ID': event.id
        },
        body: JSON.stringify(event.payload)
      })

      const responseBody = await response.text()

      if (response.ok) {
        // Mark as successful
        await supabase
          .from('webhook_events')
          .update({
            status: 'success',
            response_status: response.status,
            response_body: responseBody.substring(0, 1000),
            delivered_at: new Date().toISOString()
          })
          .eq('id', event.id)

        // Reset failure count on success
        await supabase
          .from('webhook_configs')
          .update({
            failure_count: 0,
            last_triggered_at: new Date().toISOString()
          })
          .eq('id', webhook.id)
      } else {
        throw new Error(`HTTP ${response.status}: ${responseBody}`)
      }
    } catch (error: any) {
      // Update attempt count and error
      await supabase
        .from('webhook_events')
        .update({
          attempts: event.attempts + 1,
          error: error.message,
          status: event.attempts >= 2 ? 'failed' : 'pending'
        })
        .eq('id', event.id)

      // Increment failure count
      await supabase
        .from('webhook_configs')
        .update({
          failure_count: webhook.failure_count + 1,
          last_triggered_at: new Date().toISOString()
        })
        .eq('id', webhook.id)

      // Disable webhook after too many failures
      if (webhook.failure_count >= 10) {
        await supabase
          .from('webhook_configs')
          .update({ is_active: false })
          .eq('id', webhook.id)
      }
    }
  }

  /**
   * Generate webhook secret
   */
  private static generateWebhookSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let secret = 'whsec_'
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return secret
  }

  /**
   * Generate webhook signature
   */
  private static generateSignature(payload: any, secret: string): string {
    // In production, use crypto library for HMAC-SHA256
    // For now, simple concatenation
    const timestamp = Date.now()
    return `t=${timestamp},v1=${btoa(JSON.stringify(payload) + secret)}`
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(signature: string, payload: any, secret: string): boolean {
    // In production, properly verify HMAC-SHA256
    try {
      const parts = signature.split(',')
      const timestamp = parseInt(parts[0].split('=')[1])
      
      // Check if timestamp is within 5 minutes
      if (Math.abs(Date.now() - timestamp) > 300000) {
        return false
      }

      // Verify signature (simplified)
      const expectedSig = `t=${timestamp},v1=${btoa(JSON.stringify(payload) + secret)}`
      return signature === expectedSig
    } catch {
      return false
    }
  }
}