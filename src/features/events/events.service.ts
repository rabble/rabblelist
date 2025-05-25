import { supabase } from '@/lib/supabase'
import type { Tables, Inserts, Updates } from '@/lib/database.types'

export type Event = Tables<'events'>
export type EventInsert = Inserts<'events'>
export type EventUpdate = Updates<'events'>

export class EventService {
  // Get events for the current organization
  static async getEvents(filters?: {
    search?: string
    upcoming?: boolean
    limit?: number
    offset?: number
  }) {
    try {
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) throw new Error('No organization found')

      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('organization_id', orgId)
        .order('start_time', { ascending: true })

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`)
      }

      if (filters?.upcoming) {
        query = query.gte('start_time', new Date().toISOString())
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      return { data: data || [], count: count || 0, error: null }
    } catch (error) {
      console.error('Error fetching events:', error)
      return { data: [], count: 0, error }
    }
  }

  // Get a single event with attendee count
  static async getEvent(id: string) {
    try {
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) throw new Error('No organization found')

      // Get event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('organization_id', orgId)
        .single()

      if (eventError) throw eventError

      // Get attendee count
      const { count: attendeeCount } = await supabase
        .from('event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id)
        .eq('status', 'confirmed')

      return { 
        data: event ? { ...event, attendee_count: attendeeCount || 0 } : null, 
        error: null 
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      return { data: null, error }
    }
  }

  // Create a new event
  static async createEvent(event: EventInsert) {
    try {
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) throw new Error('No organization found')

      const { data, error } = await supabase
        .from('events')
        .insert({
          ...event,
          organization_id: orgId,
          settings: event.settings || {}
        })
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error creating event:', error)
      return { data: null, error }
    }
  }

  // Update an event
  static async updateEvent(id: string, updates: EventUpdate) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error updating event:', error)
      return { data: null, error }
    }
  }

  // Delete an event
  static async deleteEvent(id: string) {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error deleting event:', error)
      return { error }
    }
  }

  // Get event attendees
  static async getEventAttendees(eventId: string) {
    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq('event_id', eventId)
        .order('rsvped_at', { ascending: false })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching attendees:', error)
      return { data: [], error }
    }
  }

  // RSVP to an event
  static async createRsvp(eventId: string, contactId: string, status: 'confirmed' | 'maybe' | 'declined' = 'confirmed') {
    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .insert({
          event_id: eventId,
          contact_id: contactId,
          status,
          rsvped_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error creating RSVP:', error)
      return { data: null, error }
    }
  }

  // Update RSVP status
  static async updateRsvp(eventId: string, contactId: string, status: 'confirmed' | 'maybe' | 'declined' | 'attended') {
    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .update({ 
          status,
          attended_at: status === 'attended' ? new Date().toISOString() : null
        })
        .eq('event_id', eventId)
        .eq('contact_id', contactId)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error updating RSVP:', error)
      return { data: null, error }
    }
  }

  // Get upcoming events
  static async getUpcomingEvents(limit = 5) {
    try {
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) throw new Error('No organization found')

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', orgId)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(limit)

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching upcoming events:', error)
      return { data: [], error }
    }
  }

  // Check in attendee
  static async checkInAttendee(eventId: string, contactId: string) {
    return this.updateRsvp(eventId, contactId, 'attended')
  }
}