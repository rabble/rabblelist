import { create } from 'zustand'
import { EventService, type Event } from '@/features/events/events.service'

interface EventStore {
  // State
  events: Event[]
  isLoadingEvents: boolean
  totalEvents: number
  
  // Actions
  loadEvents: (filters?: {
    search?: string
    upcoming?: boolean
    limit?: number
    offset?: number
  }) => Promise<void>
  createEvent: (event: Partial<Event>) => Promise<Event | null>
  updateEvent: (id: string, updates: Partial<Event>) => Promise<boolean>
  deleteEvent: (id: string) => Promise<boolean>
  
  // Utility
  resetEvents: () => void
}

export const useEventStore = create<EventStore>((set, get) => ({
  // Initial state
  events: [],
  isLoadingEvents: false,
  totalEvents: 0,

  // Load events
  loadEvents: async (filters) => {
    set({ isLoadingEvents: true })
    
    try {
      const { data, count, error } = await EventService.getEvents(filters)
      
      if (!error) {
        set({ 
          events: data, 
          totalEvents: count,
          isLoadingEvents: false 
        })
      } else {
        console.error('Error loading events:', error)
        set({ isLoadingEvents: false })
      }
    } catch (error) {
      console.error('Error loading events:', error)
      set({ isLoadingEvents: false })
    }
  },

  // Create new event
  createEvent: async (eventData) => {
    try {
      if (!eventData.name || !eventData.start_time || !eventData.location) {
        throw new Error('Missing required fields')
      }

      const { data, error } = await EventService.createEvent({
        name: eventData.name,
        description: eventData.description || null,
        start_time: eventData.start_time,
        end_time: eventData.end_time || null,
        location: eventData.location,
        capacity: eventData.capacity || null,
        settings: eventData.settings || {},
        organization_id: '' // Will be set by the service
      } as any)
      
      if (!error && data) {
        // Reload events list
        get().loadEvents()
        return data
      } else {
        console.error('Error creating event:', error)
        return null
      }
    } catch (error) {
      console.error('Error creating event:', error)
      return null
    }
  },

  // Update event
  updateEvent: async (id, updates) => {
    try {
      const { error } = await EventService.updateEvent(id, updates)
      
      if (!error) {
        // Update local state
        set(state => ({
          events: state.events.map(e => 
            e.id === id ? { ...e, ...updates } : e
          )
        }))
        return true
      } else {
        console.error('Error updating event:', error)
        return false
      }
    } catch (error) {
      console.error('Error updating event:', error)
      return false
    }
  },

  // Delete event
  deleteEvent: async (id) => {
    try {
      const { error } = await EventService.deleteEvent(id)
      
      if (!error) {
        // Remove from local state
        set(state => ({
          events: state.events.filter(e => e.id !== id),
          totalEvents: state.totalEvents - 1
        }))
        return true
      } else {
        console.error('Error deleting event:', error)
        return false
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      return false
    }
  },

  // Reset events
  resetEvents: () => {
    set({ 
      events: [], 
      totalEvents: 0,
      isLoadingEvents: false 
    })
  }
}))