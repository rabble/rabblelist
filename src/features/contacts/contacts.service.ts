import { supabase } from '@/lib/supabase'
import type { Contact } from '@/types'
import type { Inserts } from '@/lib/database.types'
import { withRetry } from '@/lib/retryUtils'

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
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })

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

      console.log('🔍 ContactService.getContacts result:', { 
        dataLength: data?.length, 
        count, 
        error,
        firstContact: data?.[0]
      })

      if (error) throw error

      return { data: data || [], count: count || 0, error: null }
    } catch (error) {
      console.error('Error fetching contacts:', error)
      return { data: [], count: 0, error }
    }
  }

  // Get a single contact
  static async getContact(id: string) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
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
      return await withRetry(async () => {
        // Use demo org ID for now
      const org = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
        

        const { data, error } = await supabase
          .from('contacts')
          .insert({
            ...contact,
            organization_id: org,
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
      return await withRetry(async () => {
        const { data, error } = await supabase
          .from('contacts')
          .update(updates)
          .eq('id', id)
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
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error deleting contact:', error)
      return { error }
    }
  }

  // Get contacts assigned to the current user for calling
  static async getCallQueue() {
    try {
      const { data: userId } = await supabase.auth.getUser()
      if (!userId?.user) throw new Error('Not authenticated')

      // For now, load contacts that haven't been called recently
      // In the future, this could use assignments or more sophisticated logic
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // First, try to get contacts that have never been called
      let { data: neverCalled, error: neverCalledError } = await supabase
        .from('contacts')
        .select('*')
        .is('last_contacted', null)
        .order('created_at', { ascending: true })
        .limit(50)

      if (neverCalledError) throw neverCalledError

      // If we don't have enough, get contacts not called in 30+ days
      let contacts = neverCalled || []
      if (contacts.length < 20) {
        const { data: notRecentlyCalled, error: notRecentlyError } = await supabase
          .from('contacts')
          .select('*')
          .lt('last_contacted', thirtyDaysAgo.toISOString())
          .order('last_contacted', { ascending: true })
          .limit(50 - contacts.length)

        if (!notRecentlyError && notRecentlyCalled) {
          contacts = [...contacts, ...notRecentlyCalled]
        }
      }

      // Add priority based on how long since last call
      const prioritizedContacts = contacts.map(contact => ({
        ...contact,
        priority: contact.last_contacted ? 2 : 1, // Never called = higher priority
        assigned_at: new Date().toISOString()
      }))

      return { data: prioritizedContacts, error: null }
    } catch (error) {
      console.error('Error fetching call queue:', error)
      return { data: [], error }
    }
  }

  // Log a call
  static async logCall(callLog: Inserts<'call_logs'>) {
    try {
      const { data: userId } = await supabase.auth.getUser()
      if (!userId?.user) throw new Error('Not authenticated')

      // Use demo org ID for now
      const org = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      

      const { data, error } = await supabase
        .from('call_logs')
        .insert({
          ...callLog,
          organization_id: org,
          ringer_id: userId.user.id,
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
          .eq('ringer_id', userId.user.id)
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
      const { data, error } = await supabase
        .from('call_logs')
        .select(`
          *,
          ringer:users(full_name, email)
        `)
        .eq('contact_id', contactId)
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
      // Use demo org ID for now
      const org = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      

      // Add organization_id to all contacts
      const contactsWithOrg = contacts.map(contact => ({
        ...contact,
        organization_id: org,
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
      return { data: [], error }
    }
  }

  // Get contact stats
  static async getContactStats() {
    try {
      // Use demo org ID for now
      const org = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      

      // Get total contacts
      const { count: totalContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org)

      // Get contacts called today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { count: contactsCalledToday } = await supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org)
        .gte('called_at', today.toISOString())

      // Get contacts by tag
      const { data: tagCounts } = await supabase
        .from('contacts')
        .select('tags')
        .eq('organization_id', org)

      const tagStats: Record<string, number> = {}
      tagCounts?.forEach(contact => {
        contact.tags?.forEach((tag: string) => {
          tagStats[tag] = (tagStats[tag] || 0) + 1
        })
      })

      return {
        totalContacts: totalContacts || 0,
        contactsCalledToday: contactsCalledToday || 0,
        tagStats,
        error: null
      }
    } catch (error) {
      console.error('Error fetching contact stats:', error)
      return {
        totalContacts: 0,
        contactsCalledToday: 0,
        tagStats: {},
        error
      }
    }
  }
}