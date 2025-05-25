import { supabase, isDemoMode } from '@/lib/supabase'
import { mockDb, mockUser } from '@/lib/mockData'
import type { Contact, CallLog } from '@/types'

export const contactsService = {
  async getContactsForRinger(ringerId: string, limit = 50, offset = 0) {
    if (isDemoMode) {
      const result = await mockDb.contacts.list()
      return result.data || []
    }

    // First, try to get assigned contacts
    const { data: assignments, error: assignmentError } = await supabase
      .from('call_assignments')
      .select(`
        *,
        contacts (*)
      `)
      .eq('ringer_id', ringerId)
      .is('completed_at', null)
      .order('priority', { ascending: false })
      .order('assigned_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (!assignmentError && assignments && assignments.length > 0) {
      return assignments.map(assignment => ({
        ...assignment.contacts,
        assignment_id: assignment.id,
        priority: assignment.priority
      }))
    }

    // If no assignments, get all contacts from the organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', ringerId)
      .single()

    if (userError || !userData) {
      console.error('Failed to get user organization:', userError)
      return []
    }

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('last_contact_date', { ascending: true, nullsFirst: true })
      .range(offset, offset + limit - 1)

    if (contactsError) {
      console.error('Failed to get contacts:', contactsError)
      return []
    }

    return contacts || []
  },

  async logCallOutcome(
    contactId: string,
    outcome: CallLog['outcome'],
    notes?: string
  ) {
    if (isDemoMode) {
      const result = await mockDb.callLogs.create({
        contact_id: contactId,
        ringer_id: mockUser.id,
        organization_id: mockUser.organization_id,
        outcome,
        notes,
        tags: [],
        called_at: new Date().toISOString()
      })
      
      if (result.error) throw result.error
      return result.data
    }

    const user = await supabase.auth.getUser()
    if (!user.data.user) throw new Error('Not authenticated')

    // Get organization ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.data.user.id)
      .single()

    if (userError || !userData) throw new Error('Failed to get user data')

    const { data, error } = await supabase
      .from('call_logs')
      .insert({
        contact_id: contactId,
        ringer_id: user.data.user.id,
        organization_id: userData.organization_id,
        outcome,
        notes,
        called_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Update contact's last contact date
    await supabase
      .from('contacts')
      .update({ last_contact_date: new Date().toISOString() })
      .eq('id', contactId)

    return data
  },

  async getContactHistory(contactId: string) {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('contact_id', contactId)
      .order('called_at', { ascending: false })
      .limit(10)

    if (error) throw error
    return data || []
  },

  async searchContacts(query: string, organizationId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20)

    if (error) throw error
    return data || []
  },

  async bulkImportContacts(contacts: Partial<Contact>[], organizationId: string) {
    const contactsWithOrg = contacts.map(contact => ({
      ...contact,
      organization_id: organizationId
    }))

    const { data, error } = await supabase
      .from('contacts')
      .insert(contactsWithOrg)
      .select()

    if (error) throw error
    return data || []
  },

  async updateContact(contactId: string, updates: Partial<Contact>) {
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', contactId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async markAssignmentComplete(assignmentId: string) {
    const { error } = await supabase
      .from('call_assignments')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', assignmentId)

    if (error) throw error
  }
}