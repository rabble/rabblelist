import { create } from 'zustand'
import { 
  EventRegistrationService, 
  type EventRegistration, 
  type EventRegistrationField,
  type EventRegistrationStats 
} from '../features/events/eventRegistration.service'

interface EventRegistrationStore {
  registrations: Record<string, EventRegistration[]> // Keyed by event_id
  registrationFields: Record<string, EventRegistrationField[]> // Keyed by event_id
  stats: Record<string, EventRegistrationStats> // Keyed by event_id
  loading: boolean
  error: string | null

  // Fetch registrations for an event
  fetchRegistrations: (eventId: string) => Promise<void>
  
  // Register for an event
  registerForEvent: (registration: {
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
  }) => Promise<EventRegistration>
  
  // Update registration
  updateRegistration: (id: string, updates: Partial<EventRegistration>) => Promise<void>
  
  // Cancel registration
  cancelRegistration: (id: string) => Promise<void>
  
  // Check in attendee
  checkInAttendee: (id: string) => Promise<void>
  
  // Batch check-in
  batchCheckIn: (registrationIds: string[]) => Promise<void>
  
  // Get registration stats
  fetchStats: (eventId: string) => Promise<void>
  
  // Get registration fields
  fetchRegistrationFields: (eventId: string) => Promise<void>
  
  // Create registration field
  createRegistrationField: (field: Omit<EventRegistrationField, 'id'>) => Promise<void>
  
  // Update registration field
  updateRegistrationField: (id: string, updates: Partial<EventRegistrationField>) => Promise<void>
  
  // Delete registration field
  deleteRegistrationField: (id: string, eventId: string) => Promise<void>
  
  // Export registrations
  exportRegistrations: (eventId: string) => Promise<string>
  
  // Get registration by contact
  getRegistrationByContact: (eventId: string, contactId: string) => Promise<EventRegistration | null>
}

export const useEventRegistrationStore = create<EventRegistrationStore>((set, get) => ({
  registrations: {},
  registrationFields: {},
  stats: {},
  loading: false,
  error: null,

  fetchRegistrations: async (eventId) => {
    set({ loading: true, error: null })
    try {
      const registrations = await EventRegistrationService.getEventRegistrations(eventId)
      set(state => ({
        registrations: {
          ...state.registrations,
          [eventId]: registrations
        },
        loading: false
      }))
    } catch (error) {
      console.error('Error fetching registrations:', error)
      set({ error: 'Failed to fetch registrations', loading: false })
    }
  },

  registerForEvent: async (registration) => {
    set({ loading: true, error: null })
    try {
      const newRegistration = await EventRegistrationService.registerForEvent(registration)
      
      // Update local state
      set(state => ({
        registrations: {
          ...state.registrations,
          [registration.event_id]: [
            ...(state.registrations[registration.event_id] || []),
            newRegistration
          ]
        },
        loading: false
      }))
      
      // Refresh stats
      await get().fetchStats(registration.event_id)
      
      return newRegistration
    } catch (error) {
      console.error('Error registering for event:', error)
      set({ error: 'Failed to register for event', loading: false })
      throw error
    }
  },

  updateRegistration: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const updated = await EventRegistrationService.updateRegistration(id, updates)
      
      // Update local state
      set(state => {
        const eventId = updated.event_id
        return {
          registrations: {
            ...state.registrations,
            [eventId]: state.registrations[eventId]?.map(reg =>
              reg.id === id ? updated : reg
            ) || []
          },
          loading: false
        }
      })
      
      // Refresh stats
      await get().fetchStats(updated.event_id)
    } catch (error) {
      console.error('Error updating registration:', error)
      set({ error: 'Failed to update registration', loading: false })
    }
  },

  cancelRegistration: async (id) => {
    const state = get()
    const registration = Object.values(state.registrations)
      .flat()
      .find(reg => reg.id === id)
    
    if (!registration) return
    
    await state.updateRegistration(id, { status: 'cancelled' })
  },

  checkInAttendee: async (id) => {
    set({ loading: true, error: null })
    try {
      const updated = await EventRegistrationService.checkInAttendee(id)
      
      // Update local state
      set(state => {
        const eventId = updated.event_id
        return {
          registrations: {
            ...state.registrations,
            [eventId]: state.registrations[eventId]?.map(reg =>
              reg.id === id ? updated : reg
            ) || []
          },
          loading: false
        }
      })
      
      // Refresh stats
      await get().fetchStats(updated.event_id)
    } catch (error) {
      console.error('Error checking in attendee:', error)
      set({ error: 'Failed to check in attendee', loading: false })
    }
  },

  batchCheckIn: async (registrationIds) => {
    set({ loading: true, error: null })
    try {
      const updated = await EventRegistrationService.batchCheckIn(registrationIds)
      
      // Update local state for all affected events
      set(state => {
        const newRegistrations = { ...state.registrations }
        
        updated.forEach(reg => {
          if (newRegistrations[reg.event_id]) {
            newRegistrations[reg.event_id] = newRegistrations[reg.event_id].map(r =>
              registrationIds.includes(r.id) ? { ...r, checked_in: true, status: 'attended' as const } : r
            )
          }
        })
        
        return { registrations: newRegistrations, loading: false }
      })
      
      // Refresh stats for affected events
      const eventIds = [...new Set(updated.map(r => r.event_id))]
      await Promise.all(eventIds.map(id => get().fetchStats(id)))
    } catch (error) {
      console.error('Error batch checking in:', error)
      set({ error: 'Failed to check in attendees', loading: false })
    }
  },

  fetchStats: async (eventId) => {
    try {
      const stats = await EventRegistrationService.getEventStats(eventId)
      set(state => ({
        stats: {
          ...state.stats,
          [eventId]: stats
        }
      }))
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  },

  fetchRegistrationFields: async (eventId) => {
    try {
      const fields = await EventRegistrationService.getRegistrationFields(eventId)
      set(state => ({
        registrationFields: {
          ...state.registrationFields,
          [eventId]: fields
        }
      }))
    } catch (error) {
      console.error('Error fetching registration fields:', error)
    }
  },

  createRegistrationField: async (field) => {
    set({ loading: true, error: null })
    try {
      const newField = await EventRegistrationService.createRegistrationField(field)
      
      set(state => ({
        registrationFields: {
          ...state.registrationFields,
          [field.event_id]: [
            ...(state.registrationFields[field.event_id] || []),
            newField
          ]
        },
        loading: false
      }))
    } catch (error) {
      console.error('Error creating registration field:', error)
      set({ error: 'Failed to create registration field', loading: false })
    }
  },

  updateRegistrationField: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const updated = await EventRegistrationService.updateRegistrationField(id, updates)
      
      set(state => {
        const eventId = updated.event_id
        return {
          registrationFields: {
            ...state.registrationFields,
            [eventId]: state.registrationFields[eventId]?.map(field =>
              field.id === id ? updated : field
            ) || []
          },
          loading: false
        }
      })
    } catch (error) {
      console.error('Error updating registration field:', error)
      set({ error: 'Failed to update registration field', loading: false })
    }
  },

  deleteRegistrationField: async (id, eventId) => {
    set({ loading: true, error: null })
    try {
      await EventRegistrationService.deleteRegistrationField(id)
      
      set(state => ({
        registrationFields: {
          ...state.registrationFields,
          [eventId]: state.registrationFields[eventId]?.filter(field => field.id !== id) || []
        },
        loading: false
      }))
    } catch (error) {
      console.error('Error deleting registration field:', error)
      set({ error: 'Failed to delete registration field', loading: false })
    }
  },

  exportRegistrations: async (eventId) => {
    try {
      return await EventRegistrationService.exportRegistrations(eventId)
    } catch (error) {
      console.error('Error exporting registrations:', error)
      throw error
    }
  },

  getRegistrationByContact: async (eventId, contactId) => {
    try {
      return await EventRegistrationService.getRegistrationByContact(eventId, contactId)
    } catch (error) {
      console.error('Error getting registration:', error)
      return null
    }
  }
}))