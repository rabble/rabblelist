import { supabase } from '@/lib/supabase'
import { withRetry } from '@/lib/retryUtils'

export interface PetitionSignature {
  id: string
  petitionId: string
  contactId?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  zipCode?: string
  comment?: string
  isPublic: boolean
  signedAt: string
  metadata?: any
}

export interface PetitionStats {
  totalSignatures: number
  recentSignatures: number
  topZipCodes: { zipCode: string; count: number }[]
  signaturesByDay: { date: string; count: number }[]
}

export class PetitionService {
  /**
   * Get petition details by campaign ID
   */
  static async getPetition(campaignId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('petitions')
        .select('*')
        .eq('campaign_id', campaignId)
        .single()

      if (error) throw error
      return data
    })
  }

  /**
   * Sign a petition
   */
  static async signPetition(signature: {
    campaignId: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    zipCode?: string
    comment?: string
    isPublic?: boolean
    contactId?: string
  }) {
    return withRetry(async () => {
      // First check if email already signed
      const { data: existing } = await supabase
        .from('petition_signatures')
        .select('id')
        .eq('campaign_id', signature.campaignId)
        .eq('email', signature.email)
        .single()

      if (existing) {
        throw new Error('This email has already signed the petition')
      }

      // Get or create contact
      let contactId = signature.contactId
      if (!contactId) {
        // Check if contact exists
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('email', signature.email)
          .single()

        if (existingContact) {
          contactId = existingContact.id
        } else {
          // Create new contact
          const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
              first_name: signature.firstName,
              last_name: signature.lastName,
              email: signature.email,
              phone: signature.phone,
              metadata: { source: 'petition', zip_code: signature.zipCode }
            })
            .select()
            .single()

          if (contactError) throw contactError
          contactId = newContact.id

          // Add to campaign contacts
          await supabase
            .from('campaign_contacts')
            .insert({
              campaign_id: signature.campaignId,
              contact_id: contactId,
              status: 'active'
            })

          // Update campaign stats for new contact
          await this.updateCampaignStats(signature.campaignId, { newContacts: 1 })
        }
      }

      // Create signature
      const { data, error } = await supabase
        .from('petition_signatures')
        .insert({
          campaign_id: signature.campaignId,
          contact_id: contactId,
          first_name: signature.firstName,
          last_name: signature.lastName,
          email: signature.email,
          phone: signature.phone,
          zip_code: signature.zipCode,
          comment: signature.comment,
          is_public: signature.isPublic ?? true,
          signed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Update campaign stats
      await this.updateCampaignStats(signature.campaignId, { 
        participants: 1,
        conversions: 1 
      })

      return data
    })
  }

  /**
   * Get petition signatures
   */
  static async getSignatures(
    campaignId: string,
    options: {
      limit?: number
      offset?: number
      publicOnly?: boolean
    } = {}
  ) {
    return withRetry(async () => {
      let query = supabase
        .from('petition_signatures')
        .select(`
          *,
          contacts (
            full_name,
            tags
          )
        `, { count: 'exact' })
        .eq('campaign_id', campaignId)
        .order('signed_at', { ascending: false })

      if (options.publicOnly) {
        query = query.eq('is_public', true)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error
      return { signatures: data || [], total: count || 0 }
    })
  }

  /**
   * Get petition statistics
   */
  static async getPetitionStats(campaignId: string): Promise<PetitionStats> {
    return withRetry(async () => {
      // Get total signatures
      const { count: totalSignatures } = await supabase
        .from('petition_signatures')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)

      // Get recent signatures (last 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const { count: recentSignatures } = await supabase
        .from('petition_signatures')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .gte('signed_at', yesterday.toISOString())

      // Get top zip codes
      const { data: zipData } = await supabase
        .from('petition_signatures')
        .select('zip_code')
        .eq('campaign_id', campaignId)
        .not('zip_code', 'is', null)

      const zipCounts = zipData?.reduce((acc: any, sig) => {
        acc[sig.zip_code] = (acc[sig.zip_code] || 0) + 1
        return acc
      }, {}) || {}

      const topZipCodes = Object.entries(zipCounts)
        .map(([zipCode, count]) => ({ zipCode, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Get signatures by day (last 7 days)
      const signaturesByDay: { date: string; count: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const startOfDay = new Date(date.setHours(0, 0, 0, 0))
        const endOfDay = new Date(date.setHours(23, 59, 59, 999))

        const { count } = await supabase
          .from('petition_signatures')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .gte('signed_at', startOfDay.toISOString())
          .lte('signed_at', endOfDay.toISOString())

        signaturesByDay.push({
          date: startOfDay.toISOString().split('T')[0],
          count: count || 0
        })
      }

      return {
        totalSignatures: totalSignatures || 0,
        recentSignatures: recentSignatures || 0,
        topZipCodes,
        signaturesByDay
      }
    })
  }

  /**
   * Export signatures to CSV
   */
  static async exportSignatures(campaignId: string) {
    const { signatures } = await this.getSignatures(campaignId, { limit: 10000 })
    
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Zip Code',
      'Comment',
      'Signed At',
      'Public'
    ]

    const rows = signatures.map(sig => [
      sig.first_name,
      sig.last_name,
      sig.email,
      sig.phone || '',
      sig.zip_code || '',
      sig.comment || '',
      new Date(sig.signed_at).toLocaleString(),
      sig.is_public ? 'Yes' : 'No'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return csv
  }

  /**
   * Update campaign statistics
   */
  private static async updateCampaignStats(
    campaignId: string,
    updates: {
      participants?: number
      conversions?: number
      shares?: number
      newContacts?: number
    }
  ) {
    return withRetry(async () => {
      // Get current stats
      const { data: currentStats } = await supabase
        .from('campaign_stats')
        .select('*')
        .eq('campaign_id', campaignId)
        .single()

      if (currentStats) {
        // Update existing stats
        const newStats: any = {}
        if (updates.participants) newStats.participants = (currentStats.participants || 0) + updates.participants
        if (updates.conversions) newStats.conversions = (currentStats.conversions || 0) + updates.conversions
        if (updates.shares) newStats.shares = (currentStats.shares || 0) + updates.shares
        if (updates.newContacts) newStats.new_contacts = (currentStats.new_contacts || 0) + updates.newContacts

        await supabase
          .from('campaign_stats')
          .update({
            ...newStats,
            updated_at: new Date().toISOString()
          })
          .eq('campaign_id', campaignId)
      } else {
        // Create new stats
        await supabase
          .from('campaign_stats')
          .insert({
            campaign_id: campaignId,
            participants: updates.participants || 0,
            conversions: updates.conversions || 0,
            shares: updates.shares || 0,
            new_contacts: updates.newContacts || 0
          })
      }
    })
  }

  /**
   * Create or update petition details
   */
  static async savePetition(petition: {
    campaignId: string
    targetName?: string
    targetTitle?: string
    deliveryMethod?: string
    customFields?: any[]
  }) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('petitions')
        .upsert({
          campaign_id: petition.campaignId,
          target_name: petition.targetName,
          target_title: petition.targetTitle,
          delivery_method: petition.deliveryMethod,
          custom_fields: petition.customFields || []
        })
        .select()
        .single()

      if (error) throw error
      return data
    })
  }
}