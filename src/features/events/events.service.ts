import { supabase } from '@/lib/supabase'
import { getCurrentOrganizationId, validateResourceOwnership } from '@/lib/serviceHelpers'
import type { Tables, Inserts, Updates } from '@/lib/database.types'

export type Event = Tables<'events'>
export type EventInsert = Inserts<'events'>
export type EventUpdate = Updates<'events'>

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  daysOfWeek?: number[] // 0=Sunday, 6=Saturday
  dayOfMonth?: number // 1-31
  monthOfYear?: number // 1-12
  endType: 'never' | 'after' | 'on'
  endAfterOccurrences?: number
  endDate?: string
  exceptions?: string[] // Dates to skip in YYYY-MM-DD format
}

export class EventService {
  // Get events for the current organization
  static async getEvents(filters?: {
    search?: string
    upcoming?: boolean
    limit?: number
    offset?: number
  }) {
    try {
      const organizationId = await getCurrentOrganizationId()

      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
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
      const organizationId = await getCurrentOrganizationId()

      // Get event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
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
  static async createEvent(event: EventInsert & { recurrence_rule?: RecurrenceRule }) {
    try {
      const organizationId = await getCurrentOrganizationId()

      const { data, error } = await supabase
        .from('events')
        .insert({
          ...event,
          organization_id: organizationId,
          settings: event.settings || {},
          is_recurring: !!event.recurrence_rule,
          recurrence_rule: event.recurrence_rule || null
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
      await validateResourceOwnership('events', id)
      
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
      await validateResourceOwnership('events', id)
      
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
      await validateResourceOwnership('events', eventId)
      
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
      await validateResourceOwnership('events', eventId)
      await validateResourceOwnership('contacts', contactId)
      
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
      await validateResourceOwnership('events', eventId)
      await validateResourceOwnership('contacts', contactId)
      
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
      const organizationId = await getCurrentOrganizationId()

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', organizationId)
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

  // Get recurring event series
  static async getEventSeries(parentEventId: string) {
    try {
      const organizationId = await getCurrentOrganizationId()

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`id.eq.${parentEventId},parent_event_id.eq.${parentEventId}`)
        .order('start_time', { ascending: true })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching event series:', error)
      return { data: [], error }
    }
  }

  // Update recurring event series
  static async updateEventSeries(parentEventId: string, updates: EventUpdate & { recurrence_rule?: RecurrenceRule }, updateType: 'this' | 'following' | 'all' = 'all') {
    try {
      await validateResourceOwnership('events', parentEventId)
      
      if (updateType === 'this') {
        // Update only this occurrence
        return this.updateEvent(parentEventId, updates)
      } else if (updateType === 'following') {
        // Update this and following occurrences
        const { data: parentEvent } = await this.getEvent(parentEventId)
        if (!parentEvent) throw new Error('Event not found')
        
        const { data: occurrences } = await supabase
          .from('events')
          .select('id')
          .eq('parent_event_id', parentEvent.parent_event_id || parentEventId)
          .gte('start_time', parentEvent.start_time)
        
        if (occurrences) {
          for (const occurrence of occurrences) {
            await this.updateEvent(occurrence.id, updates)
          }
        }
        
        return { data: occurrences, error: null }
      } else {
        // Update all occurrences
        const { data: occurrences } = await supabase
          .from('events')
          .select('id')
          .or(`id.eq.${parentEventId},parent_event_id.eq.${parentEventId}`)
        
        if (occurrences) {
          for (const occurrence of occurrences) {
            await this.updateEvent(occurrence.id, updates)
          }
        }
        
        // If recurrence rule changed, regenerate occurrences
        if (updates.recurrence_rule) {
          await supabase.rpc('create_recurring_event_occurrences', { parent_id: parentEventId })
        }
        
        return { data: occurrences, error: null }
      }
    } catch (error) {
      console.error('Error updating event series:', error)
      return { data: null, error }
    }
  }

  // Delete recurring event
  static async deleteEventSeries(eventId: string, deleteType: 'this' | 'following' | 'all' = 'all') {
    try {
      await validateResourceOwnership('events', eventId)
      
      if (deleteType === 'this') {
        // Delete only this occurrence
        return this.deleteEvent(eventId)
      } else if (deleteType === 'following') {
        // Delete this and following occurrences
        const { data: event } = await this.getEvent(eventId)
        if (!event) throw new Error('Event not found')
        
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('parent_event_id', event.parent_event_id || eventId)
          .gte('start_time', event.start_time)
        
        if (error) throw error
        return { error: null }
      } else {
        // Delete all occurrences
        const { error } = await supabase
          .from('events')
          .delete()
          .or(`id.eq.${eventId},parent_event_id.eq.${eventId}`)
        
        if (error) throw error
        return { error: null }
      }
    } catch (error) {
      console.error('Error deleting event series:', error)
      return { error }
    }
  }
}