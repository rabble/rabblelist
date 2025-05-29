import { supabase } from '../../lib/supabase'
import { withRetry } from '../../lib/retryUtils'
import { EmailService } from '../../services/email.service'

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
      // Get event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
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
      
      // Send confirmation email
      if (registration.guest_email || registration.contact_id) {
        await this.sendConfirmationEmail(data as EventRegistration, event)
      }
      
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

  // Send confirmation email
  static async sendConfirmationEmail(registration: EventRegistration, event: any) {
    try {
      // Get recipient email
      let recipientEmail = registration.guest_email
      let recipientName = registration.guest_name || 'Guest'
      
      if (registration.contact_id) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('email, full_name')
          .eq('id', registration.contact_id)
          .single()
        
        if (contact) {
          recipientEmail = contact.email
          recipientName = contact.full_name
        }
      }
      
      if (!recipientEmail) return
      
      // Format event date and time
      const eventDate = new Date(event.start_time).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      const eventTime = new Date(event.start_time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
      
      // Create check-in link
      const checkInLink = `${window.location.origin}/events/${event.id}/check-in/${registration.id}`
      
      // Email HTML content
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Registration Confirmed!</h1>
          <p>Hi ${recipientName},</p>
          <p>Your registration for <strong>${event.name}</strong> has been confirmed.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #555;">Event Details</h2>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Time:</strong> ${eventTime}</p>
            ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
            ${registration.ticket_type !== 'general' ? `<p><strong>Ticket Type:</strong> ${registration.ticket_type}</p>` : ''}
          </div>
          
          ${event.description ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #555;">About This Event</h3>
            <p>${event.description}</p>
          </div>
          ` : ''}
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1976d2;">Check-In Instructions</h3>
            <p>On the day of the event, you can check in using this link:</p>
            <a href="${checkInLink}" style="display: inline-block; background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Check In Here</a>
            <p style="margin-top: 10px; font-size: 14px; color: #666;">Or show this confirmation email at the registration desk.</p>
          </div>
          
          ${registration.dietary_restrictions || registration.accessibility_needs ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #555;">Your Special Requirements</h3>
            ${registration.dietary_restrictions ? `<p><strong>Dietary Restrictions:</strong> ${registration.dietary_restrictions}</p>` : ''}
            ${registration.accessibility_needs ? `<p><strong>Accessibility Needs:</strong> ${registration.accessibility_needs}</p>` : ''}
            <p style="font-size: 14px; color: #666;">We've noted these requirements and will do our best to accommodate them.</p>
          </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
            <p>If you need to cancel your registration, please contact us as soon as possible.</p>
            <p>We look forward to seeing you at the event!</p>
          </div>
        </div>
      `
      
      // Send email
      await EmailService.sendEmail({
        to: [recipientEmail],
        subject: `Registration Confirmed: ${event.name}`,
        html: emailHtml,
        tags: ['event-confirmation', `event-${event.id}`]
      })
      
      // Log the email send
      await supabase
        .from('communication_logs')
        .insert({
          organization_id: event.organization_id,
          contact_id: registration.contact_id,
          type: 'email',
          subject: `Registration Confirmed: ${event.name}`,
          content: emailHtml,
          recipient: recipientEmail,
          status: 'sent',
          metadata: {
            event_id: event.id,
            registration_id: registration.id,
            email_type: 'event_confirmation'
          }
        })
    } catch (error) {
      console.error('Failed to send confirmation email:', error)
      // Don't throw error - registration should still succeed even if email fails
    }
  }

  // Send reminder emails to all registered attendees
  static async sendEventReminders(eventId: string, daysBefore: number = 1) {
    try {
      // Get event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventError) throw eventError

      // Get all registered attendees
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          contact:contacts (
            id,
            email,
            full_name
          )
        `)
        .eq('event_id', eventId)
        .in('status', ['registered', 'waitlisted'])

      if (regError) throw regError

      // Format event date and time
      const eventDate = new Date(event.start_time).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      const eventTime = new Date(event.start_time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })

      // Send reminder to each registered attendee
      const emailPromises = registrations.map(async (registration) => {
        let recipientEmail = registration.guest_email
        let recipientName = registration.guest_name || 'Guest'
        
        if (registration.contact) {
          recipientEmail = registration.contact.email
          recipientName = registration.contact.full_name
        }
        
        if (!recipientEmail) return

        const checkInLink = `${window.location.origin}/events/${event.id}/check-in/${registration.id}`
        
        const reminderHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Event Reminder: ${event.name}</h1>
            <p>Hi ${recipientName},</p>
            <p>This is a friendly reminder that you're registered for <strong>${event.name}</strong> ${daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`}!</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #555;">Event Details</h2>
              <p><strong>Date:</strong> ${eventDate}</p>
              <p><strong>Time:</strong> ${eventTime}</p>
              ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
            </div>
            
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1976d2;">Check-In Link</h3>
              <p>Save time at the event by checking in online:</p>
              <a href="${checkInLink}" style="display: inline-block; background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Check In Now</a>
            </div>
            
            ${event.description ? `
            <div style="margin: 20px 0;">
              <h3 style="color: #555;">About This Event</h3>
              <p>${event.description}</p>
            </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
              <p>We look forward to seeing you at the event!</p>
              <p>If you can no longer attend, please let us know as soon as possible.</p>
            </div>
          </div>
        `

        await EmailService.sendEmail({
          to: [recipientEmail],
          subject: `Reminder: ${event.name} - ${daysBefore === 1 ? 'Tomorrow' : `In ${daysBefore} Days`}`,
          html: reminderHtml,
          tags: ['event-reminder', `event-${event.id}`]
        })

        // Log the reminder
        await supabase
          .from('communication_logs')
          .insert({
            organization_id: event.organization_id,
            contact_id: registration.contact_id,
            type: 'email',
            subject: `Reminder: ${event.name}`,
            content: reminderHtml,
            recipient: recipientEmail,
            status: 'sent',
            metadata: {
              event_id: event.id,
              registration_id: registration.id,
              email_type: 'event_reminder',
              days_before: daysBefore
            }
          })
      })

      await Promise.all(emailPromises)
      
      return {
        success: true,
        remindersSent: registrations.length
      }
    } catch (error) {
      console.error('Failed to send event reminders:', error)
      throw error
    }
  }
}