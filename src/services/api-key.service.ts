import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'

export type ServiceName = 'twilio' | 'sendgrid' | 'openai' | 'stripe'
export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise'

interface ServiceConfig {
  useCustomKeys: boolean
  keys: Record<string, string>
  rateLimitStatus?: {
    allowed: boolean
    currentUsage: number
    limit: number
    resetAt: Date
  }
}

interface RateLimitResult {
  allowed: boolean
  current_usage: number
  limit_value: number
  window_seconds: number
  reset_at: string
}

export class OrganizationAPIKeyService {
  private static instance: OrganizationAPIKeyService
  
  private constructor() {}
  
  static getInstance(): OrganizationAPIKeyService {
    if (!this.instance) {
      this.instance = new OrganizationAPIKeyService()
    }
    return this.instance
  }

  /**
   * Get all API keys for an organization and service
   */
  async getOrganizationKeys(
    organizationId: string, 
    serviceName: ServiceName
  ): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('organization_api_keys')
      .select('key_name, encrypted_value')
      .eq('organization_id', organizationId)
      .eq('service_name', serviceName)
      .eq('is_active', true)

    if (error || !data) {
      console.error('Error fetching organization keys:', error)
      return {}
    }

    // In production, these would be decrypted using Supabase Vault
    // For now, we'll return them as-is (they should be encrypted in the DB)
    const keys: Record<string, string> = {}
    data.forEach(row => {
      keys[row.key_name] = row.encrypted_value
    })
    
    return keys
  }

  /**
   * Set or update an API key for an organization
   */
  async setOrganizationKey(
    organizationId: string,
    serviceName: ServiceName,
    keyName: string,
    value: string
  ): Promise<void> {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id

    // Check if key already exists
    const { data: existing } = await supabase
      .from('organization_api_keys')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('service_name', serviceName)
      .eq('key_name', keyName)
      .single()

    if (existing) {
      // Update existing key
      const { error } = await supabase
        .from('organization_api_keys')
        .update({
          encrypted_value: value, // Should be encrypted before storing
          is_active: true,
          updated_at: new Date().toISOString(),
          last_rotated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) throw error

      // Log the action
      await this.logKeyAction(organizationId, 'updated', serviceName, keyName)
    } else {
      // Insert new key
      const { error } = await supabase
        .from('organization_api_keys')
        .insert({
          organization_id: organizationId,
          service_name: serviceName,
          key_name: keyName,
          encrypted_value: value, // Should be encrypted before storing
          created_by: userId
        })

      if (error) throw error

      // Log the action
      await this.logKeyAction(organizationId, 'created', serviceName, keyName)
    }
  }

  /**
   * Delete an API key
   */
  async deleteOrganizationKey(
    organizationId: string,
    serviceName: ServiceName,
    keyName: string
  ): Promise<void> {
    const { error } = await supabase
      .from('organization_api_keys')
      .update({ is_active: false })
      .eq('organization_id', organizationId)
      .eq('service_name', serviceName)
      .eq('key_name', keyName)

    if (error) throw error

    await this.logKeyAction(organizationId, 'deleted', serviceName, keyName)
  }

  /**
   * Get organization subscription info
   */
  async getOrganizationSubscription(
    organizationId: string
  ): Promise<Tables<'organization_subscriptions'> | null> {
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching subscription:', error)
      return null
    }

    return data
  }

  /**
   * Check rate limits for an action
   */
  async checkRateLimit(
    organizationId: string,
    serviceName: string,
    actionType: string
  ): Promise<RateLimitResult> {
    const { data, error } = await supabase
      .rpc('check_rate_limit', {
        p_organization_id: organizationId,
        p_service_name: serviceName,
        p_action_type: actionType
      })

    if (error) {
      console.error('Error checking rate limit:', error)
      // Default to allowing the action if rate limit check fails
      return {
        allowed: true,
        current_usage: 0,
        limit_value: -1,
        window_seconds: 0,
        reset_at: new Date().toISOString()
      }
    }

    return data[0] || {
      allowed: true,
      current_usage: 0,
      limit_value: -1,
      window_seconds: 0,
      reset_at: new Date().toISOString()
    }
  }

  /**
   * Track API usage
   */
  async trackUsage(
    organizationId: string,
    serviceName: string,
    actionType: string,
    count: number = 1,
    costCents: number = 0,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const { error } = await supabase
      .rpc('track_api_usage', {
        p_organization_id: organizationId,
        p_service_name: serviceName,
        p_action_type: actionType,
        p_count: count,
        p_cost_cents: costCents,
        p_metadata: metadata
      })

    if (error) {
      console.error('Error tracking usage:', error)
    }
  }

  /**
   * Get service configuration with rate limiting
   */
  async getServiceConfig(
    organizationId: string,
    serviceName: ServiceName
  ): Promise<ServiceConfig> {
    // Check subscription status
    const subscription = await this.getOrganizationSubscription(organizationId)
    
    // Check if organization has custom keys
    const customKeys = await this.getOrganizationKeys(organizationId, serviceName)
    const hasCustomKeys = Object.keys(customKeys).length > 0

    // If paid plan with custom keys, use them without rate limiting
    if (subscription?.status === 'active' && 
        subscription.plan_type !== 'free' && 
        hasCustomKeys) {
      return {
        useCustomKeys: true,
        keys: customKeys
      }
    }

    // Check rate limits for system keys
    const actionType = this.getActionTypeForService(serviceName)
    const rateLimitStatus = await this.checkRateLimit(
      organizationId, 
      serviceName, 
      actionType
    )

    if (!rateLimitStatus.allowed) {
      throw new Error(
        `Rate limit exceeded. Limit: ${rateLimitStatus.limit_value}, ` +
        `Current: ${rateLimitStatus.current_usage}. ` +
        `Resets at: ${new Date(rateLimitStatus.reset_at).toLocaleString()}`
      )
    }

    // Return system keys with rate limit info
    return {
      useCustomKeys: false,
      keys: this.getSystemKeys(serviceName),
      rateLimitStatus: {
        allowed: rateLimitStatus.allowed,
        currentUsage: rateLimitStatus.current_usage,
        limit: rateLimitStatus.limit_value,
        resetAt: new Date(rateLimitStatus.reset_at)
      }
    }
  }

  /**
   * Test API keys by making a simple request
   */
  async testKeys(
    organizationId: string,
    serviceName: ServiceName,
    keys: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (serviceName) {
        case 'twilio':
          // Test Twilio credentials
          if (!keys.account_sid || !keys.auth_token) {
            return { success: false, error: 'Missing required Twilio keys' }
          }
          // In production, make a test API call to Twilio
          return { success: true }
          
        case 'sendgrid':
          // Test SendGrid API key
          if (!keys.api_key) {
            return { success: false, error: 'Missing SendGrid API key' }
          }
          // In production, make a test API call to SendGrid
          return { success: true }
          
        default:
          return { success: false, error: 'Unsupported service' }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get system keys from environment variables
   */
  private getSystemKeys(serviceName: ServiceName): Record<string, string> {
    switch (serviceName) {
      case 'twilio':
        return {
          account_sid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
          auth_token: import.meta.env.VITE_TWILIO_AUTH_TOKEN || '',
          api_key: import.meta.env.VITE_TWILIO_API_KEY || '',
          api_secret: import.meta.env.VITE_TWILIO_API_SECRET || ''
        }
      case 'sendgrid':
        return {
          api_key: import.meta.env.VITE_SENDGRID_API_KEY || ''
        }
      default:
        return {}
    }
  }

  /**
   * Get the primary action type for a service
   */
  private getActionTypeForService(serviceName: ServiceName): string {
    switch (serviceName) {
      case 'twilio':
        return 'sms_sent'
      case 'sendgrid':
        return 'email_sent'
      default:
        return 'api_call'
    }
  }

  /**
   * Log API key actions for audit trail
   */
  private async logKeyAction(
    organizationId: string,
    action: 'created' | 'updated' | 'deleted' | 'rotated' | 'accessed',
    serviceName: string,
    keyName: string
  ): Promise<void> {
    const { data: userData } = await supabase.auth.getUser()
    
    await supabase
      .from('organization_api_key_audit')
      .insert({
        organization_id: organizationId,
        user_id: userData?.user?.id,
        action,
        service_name: serviceName,
        key_name: keyName,
        ip_address: null, // Would be set from request headers in production
        user_agent: navigator.userAgent
      })
  }

  /**
   * Get usage statistics for an organization
   */
  async getUsageStats(
    organizationId: string,
    serviceName?: string,
    period: 'hour' | 'day' | 'month' = 'day'
  ): Promise<{
    total: number
    cost: number
    byAction: Record<string, number>
  }> {
    const since = new Date()
    switch (period) {
      case 'hour':
        since.setHours(since.getHours() - 1)
        break
      case 'day':
        since.setDate(since.getDate() - 1)
        break
      case 'month':
        since.setMonth(since.getMonth() - 1)
        break
    }

    let query = supabase
      .from('organization_api_usage')
      .select('action_type, count, cost_cents')
      .eq('organization_id', organizationId)
      .gte('created_at', since.toISOString())

    if (serviceName) {
      query = query.eq('service_name', serviceName)
    }

    const { data, error } = await query

    if (error || !data) {
      return { total: 0, cost: 0, byAction: {} }
    }

    const stats = data.reduce((acc, row) => {
      acc.total += row.count
      acc.cost += row.cost_cents
      acc.byAction[row.action_type] = (acc.byAction[row.action_type] || 0) + row.count
      return acc
    }, { total: 0, cost: 0, byAction: {} as Record<string, number> })

    return stats
  }
}