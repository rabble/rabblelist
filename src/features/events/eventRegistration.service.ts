import { supabase } from '../../lib/supabase'
import { withRetry } from '../../lib/retryUtils'

export interface EventRegistration {
  id: string
  event_id: string
  contact_id?: string
  organization_id: string
  status: 'registered' | 'waitlisted' | 'cancelled' | 'attended' | 'no_show'
  registration_date: string
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  ticket_type: string
  ticket_price: number
  payment_status: 'free' | 'pending' | 'paid' | 'refunded'
  payment_id?: string
  checked_in: boolean
  check_in_time?: string
  checked_in_by?: string
  dietary_restrictions?: string
  accessibility_needs?: string
  notes?: string
  custom_fields?: Record<string, any>
  created_at: string
  updated_at: string
  contact?: {
    id: string
    full_name: string
    email: string
    phone: string
  }
}

export interface EventRegistrationField {
  id: string
  event_id: string
  field_name: string
  field_type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date'
  field_label: string
  field_options?: any[]
  required: boolean
  field_order: number
}

export interface EventRegistrationStats {
  event_id: string
  registered_count: number
  waitlist_count: number
  attended_count: number
  cancelled_count: number
  checked_in_count: number
  total_revenue: number
  last_registration?: string
}

export class EventRegistrationService {
  // Get all registrations for an event
  static async getEventRegistrations(eventId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          contact:contacts (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('event_id', eventId)
        .order('registration_date', { ascending: false })

      if (error) throw error
      return data as EventRegistration[]
    })
  }

  // Register for an event
  static async registerForEvent(registration: {
    event_id: string
    contact_id?: string
    guest_name?: string
    guest_email?: string
    guest_phone?: string
    ticket_type?: string
    ticket_price?: number
    dietary_restrictions?: string
    accessibility_needs?: string
    notes?: string
    custom_fields?: Record<string, any>
  }) {
    return withRetry(async () => {
      // Get organization_id from event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('organization_id')
        .eq('id', registration.event_id)
        .single()

      if (eventError) throw eventError

      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          ...registration,
          organization_id: event.organization_id,
          ticket_type: registration.ticket_type || 'general',
          ticket_price: registration.ticket_price || 0
        })
        .select()
        .single()

      if (error) throw error
      return data as EventRegistration
    })
  }

  // Update registration
  static async updateRegistration(id: string, updates: Partial<EventRegistration>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as EventRegistration
    })
  }

  // Cancel registration
  static async cancelRegistration(id: string) {
    return this.updateRegistration(id, { status: 'cancelled' })
  }

  // Check in attendee
  static async checkInAttendee(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .update({
          checked_in: true,
          check_in_time: new Date().toISOString(),
          checked_in_by: user?.id,
          status: 'attended'
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as EventRegistration
    })
  }

  // Get registration stats for an event
  static async getEventStats(eventId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('event_registration_stats')
        .select('*')
        .eq('event_id', eventId)
        .single()

      if (error) throw error
      return data as EventRegistrationStats
    })
  }

  // Get registration by contact and event
  static async getRegistrationByContact(eventId: string, contactId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('contact_id', contactId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // Ignore not found errors
      return data as EventRegistration | null
    })
  }

  // Batch check-in
  static async batchCheckIn(registrationIds: string[]) {
    const { data: { user } } = await supabase.auth.getUser()
    
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .update({
          checked_in: true,
          check_in_time: new Date().toISOString(),
          checked_in_by: user?.id,
          status: 'attended'
        })
        .in('id', registrationIds)
        .select()

      if (error) throw error
      return data as EventRegistration[]
    })
  }

  // Get custom registration fields for an event
  static async getRegistrationFields(eventId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('event_registration_fields')
        .select('*')
        .eq('event_id', eventId)
        .order('field_order')

      if (error) throw error
      return data as EventRegistrationField[]
    })
  }

  // Create custom registration field
  static async createRegistrationField(field: Omit<EventRegistrationField, 'id'>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('event_registration_fields')
        .insert(field)
        .select()
        .single()

      if (error) throw error
      return data as EventRegistrationField
    })
  }

  // Update custom registration field
  static async updateRegistrationField(id: string, updates: Partial<EventRegistrationField>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('event_registration_fields')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as EventRegistrationField
    })
  }

  // Delete custom registration field
  static async deleteRegistrationField(id: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from('event_registration_fields')
        .delete()
        .eq('id', id)

      if (error) throw error
    })
  }

  // Export registrations as CSV
  static async exportRegistrations(eventId: string) {
    const registrations = await this.getEventRegistrations(eventId)
    
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Status',
      'Ticket Type',
      'Checked In',
      'Registration Date',
      'Dietary Restrictions',
      'Accessibility Needs',
      'Notes'
    ]
    
    const rows = registrations.map((reg: EventRegistration) => [
      reg.contact?.full_name || reg.guest_name || '',
      reg.contact?.email || reg.guest_email || '',
      reg.contact?.phone || reg.guest_phone || '',
      reg.status,
      reg.ticket_type,
      reg.checked_in ? 'Yes' : 'No',
      new Date(reg.registration_date).toLocaleString(),
      reg.dietary_restrictions || '',
      reg.accessibility_needs || '',
      reg.notes || ''
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
    ].join('\n')
    
    return csv
  }
}