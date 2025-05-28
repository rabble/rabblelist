import { supabase } from '@/lib/supabase'
import type { Contact } from '@/types'
import type { Inserts } from '@/lib/database.types'
import { withRetry } from '@/lib/retryUtils'
import { getCurrentOrganizationId, validateResourceOwnership } from '@/lib/serviceHelpers'

export class ContactService {
  // Get contacts for the current user's organization
  static async getContacts(filters?: {
    search?: string
    tags?: string[]
    limit?: number
    offset?: number
    orderBy?: string
    orderDirection?: 'asc' | 'desc'
  }) {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)

      // Apply dynamic ordering
      const orderBy = filters?.orderBy || 'created_at'
      const orderDirection = filters?.orderDirection === 'asc'
      query = query.order(orderBy, { ascending: orderDirection })

      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('ContactService.getContacts error:', error)
        throw error
      }

      return { data: data || [], count: count || 0, error: null }
    } catch (error) {
      console.error('Error fetching contacts:', error)
      return { data: [], count: 0, error }
    }
  }

  // Get a single contact
  static async getContact(id: string) {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching contact:', error)
      return { data: null, error }
    }
  }

  // Create a new contact
  static async createContact(contact: Inserts<'contacts'>) {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      return await withRetry(async () => {
        const { data, error } = await supabase
          .from('contacts')
          .insert({
            ...contact,
            organization_id: organizationId,
            tags: contact.tags || [],
            custom_fields: contact.custom_fields || {},
            total_events_attended: 0
          })
          .select()
          .single()

        if (error) throw error

        return { data, error: null }
      }, {
        maxAttempts: 3,
        onRetry: (error, attempt) => {
          console.warn(`Retrying contact creation (attempt ${attempt}):`, error)
        }
      })
    } catch (error) {
      console.error('Error creating contact:', error)
      return { data: null, error }
    }
  }

  // Update a contact
  static async updateContact(id: string, updates: Partial<Contact>) {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      // Validate ownership
      const isOwned = await validateResourceOwnership('contacts', id, organizationId)
      if (!isOwned) {
        throw new Error('Contact not found or access denied')
      }
      
      return await withRetry(async () => {
        const { data, error } = await supabase
          .from('contacts')
          .update(updates)
          .eq('id', id)
          .eq('organization_id', organizationId)
          .select()
          .single()

        if (error) throw error

        return { data, error: null }
      }, {
        maxAttempts: 3,
        onRetry: (error, attempt) => {
          console.warn(`Retrying contact update (attempt ${attempt}):`, error)
        }
      })
    } catch (error) {
      console.error('Error updating contact:', error)
      return { data: null, error }
    }
  }

  // Delete a contact
  static async deleteContact(id: string) {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      // Validate ownership
      const isOwned = await validateResourceOwnership('contacts', id, organizationId)
      if (!isOwned) {
        throw new Error('Contact not found or access denied')
      }
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId)

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error deleting contact:', error)
      return { error }
    }
  }

  // Get contacts for calling queue
  static async getCallQueue() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const organizationId = await getCurrentOrganizationId()

      // Get contacts that need to be called
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .or('last_contact_date.is.null,last_contact_date.lt.now() - interval \'30 days\'')
        .order('priority', { ascending: false })
        .order('last_contact_date', { ascending: true, nullsFirst: true })
        .limit(100)

      if (error) throw error

      // Get existing assignments
      const { data: assignments } = await supabase
        .from('call_assignments')
        .select('contact_id')
        .eq('ringer_id', user.id)
        .eq('organization_id', organizationId)
        .is('completed_at', null)

      const assignedContactIds = assignments?.map(a => a.contact_id) || []

      // Filter out already assigned contacts
      const unassignedContacts = data?.filter(
        contact => !assignedContactIds.includes(contact.id)
      ) || []

      // Assign new contacts to this ringer
      if (unassignedContacts.length > 0) {
        const newAssignments = unassignedContacts.slice(0, 10).map(contact => ({
          organization_id: organizationId,
          ringer_id: user.id,
          contact_id: contact.id,
          assigned_at: new Date().toISOString()
        }))

        await supabase.from('call_assignments').insert(newAssignments)
      }

      return { data: unassignedContacts.slice(0, 10), error: null }
    } catch (error) {
      console.error('Error fetching call queue:', error)
      return { data: [], error }
    }
  }

  // Log a call
  static async logCall(callLog: Inserts<'call_logs'>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const organizationId = await getCurrentOrganizationId()

      const { data, error } = await supabase
        .from('call_logs')
        .insert({
          ...callLog,
          organization_id: organizationId,
          ringer_id: user.id,
          called_at: callLog.called_at || new Date().toISOString(),
          tags: callLog.tags || []
        })
        .select()
        .single()

      if (error) throw error

      // Mark assignment as completed if it exists
      if (callLog.contact_id) {
        await supabase
          .from('call_assignments')
          .update({ completed_at: new Date().toISOString() })
          .eq('ringer_id', user.id)
          .eq('contact_id', callLog.contact_id)
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error logging call:', error)
      return { data: null, error }
    }
  }

  // Get call history for a contact
  static async getCallHistory(contactId: string) {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      const { data, error } = await supabase
        .from('call_logs')
        .select(`
          *,
          ringer:users(full_name, email)
        `)
        .eq('contact_id', contactId)
        .eq('organization_id', organizationId)
        .order('called_at', { ascending: false })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching call history:', error)
      return { data: [], error }
    }
  }

  // Bulk import contacts
  static async bulkImportContacts(contacts: Inserts<'contacts'>[]) {
    try {
      const organizationId = await getCurrentOrganizationId()

      // Add organization_id to all contacts
      const contactsWithOrg = contacts.map(contact => ({
        ...contact,
        organization_id: organizationId,
        tags: contact.tags || [],
        custom_fields: contact.custom_fields || {},
        total_events_attended: 0
      }))

      // Insert in batches of 100
      const batchSize = 100
      const results = []

      for (let i = 0; i < contactsWithOrg.length; i += batchSize) {
        const batch = contactsWithOrg.slice(i, i + batchSize)
        const { data, error } = await supabase
          .from('contacts')
          .insert(batch)
          .select()

        if (error) throw error
        results.push(...(data || []))
      }

      return { data: results, error: null }
    } catch (error) {
      console.error('Error bulk importing contacts:', error)
      return { data: null, error }
    }
  }

  // Smart list functionality
  static async getSmartListContacts(filters: {
    tags?: string[]
    dateRange?: { start: string; end: string }
    activityLevel?: 'high' | 'medium' | 'low'
    hasPhone?: boolean
    hasEmail?: boolean
    lastContactDays?: number
    eventsAttended?: { min?: number; max?: number }
    location?: string
  }) {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)

      // Tag filters
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      // Date range filter
      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end)
      }

      // Contact method filters
      if (filters.hasPhone) {
        query = query.not('phone', 'is', null)
      }
      if (filters.hasEmail) {
        query = query.not('email', 'is', null)
      }

      // Last contact filter
      if (filters.lastContactDays) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - filters.lastContactDays)
        query = query.gte('last_contact_date', cutoffDate.toISOString())
      }

      // Events attended filter
      if (filters.eventsAttended) {
        if (filters.eventsAttended.min !== undefined) {
          query = query.gte('total_events_attended', filters.eventsAttended.min)
        }
        if (filters.eventsAttended.max !== undefined) {
          query = query.lte('total_events_attended', filters.eventsAttended.max)
        }
      }

      // Location filter
      if (filters.location) {
        query = query.ilike('address', `%${filters.location}%`)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })

      if (error) throw error

      return { data: data || [], count: count || 0, error: null }
    } catch (error) {
      console.error('Error fetching smart list contacts:', error)
      return { data: [], count: 0, error }
    }
  }

  // Get duplicate candidates
  static async findDuplicates() {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      // Get all contacts for this organization
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, full_name, email, phone')
        .eq('organization_id', organizationId)
        .order('full_name')

      if (error) throw error

      // Find potential duplicates
      const duplicates: Array<{
        contact1: typeof contacts[0]
        contact2: typeof contacts[0]
        matchType: 'name' | 'email' | 'phone'
        confidence: number
      }> = []

      if (!contacts) return { data: duplicates, error: null }

      for (let i = 0; i < contacts.length; i++) {
        for (let j = i + 1; j < contacts.length; j++) {
          const contact1 = contacts[i]
          const contact2 = contacts[j]

          // Check name similarity
          if (contact1.full_name && contact2.full_name) {
            const nameSimilarity = this.calculateSimilarity(
              contact1.full_name.toLowerCase(),
              contact2.full_name.toLowerCase()
            )
            if (nameSimilarity > 0.8) {
              duplicates.push({
                contact1,
                contact2,
                matchType: 'name',
                confidence: nameSimilarity
              })
              continue
            }
          }

          // Check email match
          if (contact1.email && contact2.email && 
              contact1.email.toLowerCase() === contact2.email.toLowerCase()) {
            duplicates.push({
              contact1,
              contact2,
              matchType: 'email',
              confidence: 1
            })
            continue
          }

          // Check phone match (normalize phone numbers)
          if (contact1.phone && contact2.phone) {
            const phone1 = contact1.phone.replace(/\D/g, '')
            const phone2 = contact2.phone.replace(/\D/g, '')
            if (phone1 === phone2) {
              duplicates.push({
                contact1,
                contact2,
                matchType: 'phone',
                confidence: 1
              })
            }
          }
        }
      }

      return { data: duplicates, error: null }
    } catch (error) {
      console.error('Error finding duplicates:', error)
      return { data: [], error }
    }
  }

  // Helper function to calculate string similarity
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  // Merge contacts
  static async mergeContacts(
    primaryContactId: string,
    mergeContactIds: string[],
    mergedData: Partial<Contact>
  ) {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      // Validate all contacts belong to this organization
      for (const contactId of [primaryContactId, ...mergeContactIds]) {
        const isOwned = await validateResourceOwnership('contacts', contactId, organizationId)
        if (!isOwned) {
          throw new Error(`Contact ${contactId} not found or access denied`)
        }
      }
      
      // Start a transaction-like operation
      const results = {
        primaryUpdate: null as any,
        mergedDeletes: [] as any[],
        errors: [] as any[]
      }

      // 1. Update the primary contact with merged data
      const { data: primaryUpdate, error: primaryError } = await supabase
        .from('contacts')
        .update(mergedData)
        .eq('id', primaryContactId)
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (primaryError) {
        results.errors.push({ step: 'primaryUpdate', error: primaryError })
        return { success: false, results, error: primaryError }
      }
      results.primaryUpdate = primaryUpdate

      // 2. Update all related records to point to primary contact
      const tables = [
        'call_logs',
        'call_assignments',
        'event_registrations',
        'group_members',
        'campaign_activities',
        'contact_interactions'
      ]

      for (const table of tables) {
        for (const mergeId of mergeContactIds) {
          const { error } = await supabase
            .from(table)
            .update({ contact_id: primaryContactId })
            .eq('contact_id', mergeId)
            .eq('organization_id', organizationId)

          if (error) {
            console.warn(`Error updating ${table} for contact ${mergeId}:`, error)
            results.errors.push({ step: `update_${table}`, contactId: mergeId, error })
          }
        }
      }

      // 3. Delete the merged contacts
      for (const mergeId of mergeContactIds) {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', mergeId)
          .eq('organization_id', organizationId)

        if (error) {
          results.errors.push({ step: 'delete', contactId: mergeId, error })
        } else {
          results.mergedDeletes.push({ id: mergeId, success: true })
        }
      }

      return { 
        success: results.errors.length === 0, 
        results,
        error: results.errors.length > 0 ? results.errors[0].error : null
      }
    } catch (error) {
      console.error('Error merging contacts:', error)
      return { success: false, results: null, error }
    }
  }

  // Score contacts based on engagement
  static async scoreContacts() {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      // Get all contacts with their activity data
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select(`
          id,
          full_name,
          created_at,
          total_events_attended,
          tags,
          last_contact_date
        `)
        .eq('organization_id', organizationId)

      if (contactsError) throw contactsError
      if (!contacts) return { success: false, error: 'No contacts found' }

      // Get recent activities for scoring
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentCalls } = await supabase
        .from('call_logs')
        .select('contact_id')
        .eq('organization_id', organizationId)
        .gte('called_at', thirtyDaysAgo.toISOString())

      const { data: recentEmails } = await supabase
        .from('communication_logs')
        .select('contact_id')
        .eq('organization_id', organizationId)
        .eq('type', 'email')
        .gte('created_at', thirtyDaysAgo.toISOString())

      // Calculate scores
      const scoredContacts = contacts.map(contact => {
        let score = 0

        // Base score from profile completeness
        if (contact.tags && contact.tags.length > 0) score += 10

        // Event attendance (10 points per event, max 50)
        score += Math.min(contact.total_events_attended * 10, 50)

        // Recent contact (20 points if contacted in last 30 days)
        if (contact.last_contact_date) {
          const lastContact = new Date(contact.last_contact_date)
          if (lastContact >= thirtyDaysAgo) score += 20
        }

        // Recent calls (10 points)
        if (recentCalls?.some(c => c.contact_id === contact.id)) score += 10

        // Recent emails (5 points)
        if (recentEmails?.some(e => e.contact_id === contact.id)) score += 5

        // Volunteer/donor tags (15 points each)
        if (contact.tags?.includes('volunteer')) score += 15
        if (contact.tags?.includes('donor')) score += 15

        return {
          ...contact,
          engagement_score: Math.min(score, 100) // Cap at 100
        }
      })

      // Update scores in database
      for (const contact of scoredContacts) {
        await supabase
          .from('contacts')
          .update({ engagement_score: contact.engagement_score })
          .eq('id', contact.id)
          .eq('organization_id', organizationId)
      }

      return { 
        success: true, 
        data: scoredContacts.sort((a, b) => b.engagement_score - a.engagement_score),
        error: null 
      }
    } catch (error) {
      console.error('Error scoring contacts:', error)
      return { success: false, data: null, error }
    }
  }

  // Get all contact interactions (for timeline view)
  static async getContactInteractions(contactId: string) {
    try {
      const organizationId = await getCurrentOrganizationId()
      
      // Validate contact belongs to organization
      const isOwned = await validateResourceOwnership('contacts', contactId, organizationId)
      if (!isOwned) {
        throw new Error('Contact not found or access denied')
      }
      
      // Get all interactions from different sources
      const [
        { data: callLogs },
        { data: emails },
        { data: events },
        { data: campaigns },
        { data: interactions }
      ] = await Promise.all([
        // Call logs
        supabase
          .from('call_logs')
          .select('*')
          .eq('contact_id', contactId)
          .eq('organization_id', organizationId),
        
        // Communication logs (emails/SMS)
        supabase
          .from('communication_logs')
          .select('*')
          .eq('contact_id', contactId)
          .eq('organization_id', organizationId),
        
        // Event registrations
        supabase
          .from('event_registrations')
          .select(`
            *,
            events(name, start_time)
          `)
          .eq('contact_id', contactId),
        
        // Campaign activities
        supabase
          .from('campaign_activities')
          .select(`
            *,
            campaigns(name)
          `)
          .eq('contact_id', contactId),
        
        // Generic interactions
        supabase
          .from('contact_interactions')
          .select('*')
          .eq('contact_id', contactId)
      ])

      // Combine and format all interactions
      const allInteractions = []

      // Add call logs
      if (callLogs) {
        allInteractions.push(...callLogs.map(log => ({
          id: log.id,
          type: 'call',
          description: `Call: ${log.outcome || 'No outcome recorded'}`,
          timestamp: log.called_at,
          metadata: {
            duration: log.duration,
            outcome: log.outcome,
            notes: log.notes
          }
        })))
      }

      // Add emails/SMS
      if (emails) {
        allInteractions.push(...emails.map(log => ({
          id: log.id,
          type: log.type,
          description: `${log.type === 'email' ? 'Email' : 'SMS'}: ${log.subject || 'No subject'}`,
          timestamp: log.created_at,
          metadata: {
            status: log.status,
            opens: log.metadata?.opens || 0,
            clicks: log.metadata?.clicks || 0
          }
        })))
      }

      // Add event registrations
      if (events) {
        allInteractions.push(...events.map(reg => ({
          id: reg.id,
          type: 'event',
          description: `Registered for: ${reg.events?.name || 'Unknown event'}`,
          timestamp: reg.registered_at,
          metadata: {
            eventDate: reg.events?.start_time,
            status: reg.status,
            checkedIn: reg.checked_in_at
          }
        })))
      }

      // Add campaign activities
      if (campaigns) {
        allInteractions.push(...campaigns.map(activity => ({
          id: activity.id,
          type: 'campaign',
          description: `${activity.activity_type}: ${activity.campaigns?.name || 'Unknown campaign'}`,
          timestamp: activity.created_at,
          metadata: {
            activityType: activity.activity_type,
            data: activity.activity_data
          }
        })))
      }

      // Add generic interactions
      if (interactions) {
        allInteractions.push(...interactions.map(interaction => ({
          id: interaction.id,
          type: interaction.type,
          description: interaction.description || `${interaction.type} interaction`,
          timestamp: interaction.created_at,
          metadata: {
            notes: interaction.notes,
            data: interaction.metadata
          }
        })))
      }

      // Sort by timestamp (most recent first)
      allInteractions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      return { data: allInteractions, error: null }
    } catch (error) {
      console.error('Error fetching contact interactions:', error)
      return { data: [], error }
    }
  }
}