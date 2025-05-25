import { create } from 'zustand'
import type { Contact, CallQueueItem } from '@/types'
import { ContactService } from '@/features/contacts/contacts.service'

interface ContactStore {
  // Queue state
  queue: CallQueueItem[]
  currentIndex: number
  isLoadingQueue: boolean
  
  // Contacts list state
  contacts: Contact[]
  isLoadingContacts: boolean
  totalContacts: number
  
  // Actions - Queue
  loadQueue: () => Promise<void>
  nextContact: () => void
  previousContact: () => void
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>
  
  // Actions - Contacts
  loadContacts: (filters?: { search?: string; tags?: string[]; limit?: number; offset?: number }) => Promise<void>
  createContact: (contact: Partial<Contact>) => Promise<Contact | null>
  deleteContact: (id: string) => Promise<boolean>
  
  // Utility
  resetQueue: () => void
}

export const useContactStore = create<ContactStore>((set, get) => ({
  // Initial state
  queue: [],
  currentIndex: 0,
  isLoadingQueue: false,
  contacts: [],
  isLoadingContacts: false,
  totalContacts: 0,

  // Load call queue
  loadQueue: async () => {
    set({ isLoadingQueue: true })
    
    try {
      const { data, error } = await ContactService.getCallQueue()
      
      if (!error && data) {
        set({ 
          queue: data, 
          currentIndex: 0,
          isLoadingQueue: false 
        })
      } else {
        console.error('Error loading queue:', error)
        set({ isLoadingQueue: false })
      }
    } catch (error) {
      console.error('Error loading queue:', error)
      set({ isLoadingQueue: false })
    }
  },

  // Navigate to next contact
  nextContact: () => {
    const { currentIndex, queue } = get()
    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1 })
    }
  },

  // Navigate to previous contact
  previousContact: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 })
    }
  },

  // Update contact
  updateContact: async (id: string, updates: Partial<Contact>) => {
    const { queue } = get()
    
    // Update in local state immediately
    set({
      queue: queue.map(contact => 
        contact.id === id ? { ...contact, ...updates } : contact
      )
    })

    // Update in database
    try {
      const { error } = await ContactService.updateContact(id, updates)
      if (error) {
        console.error('Error updating contact:', error)
        // Revert on error
        get().loadQueue()
      }
    } catch (error) {
      console.error('Error updating contact:', error)
      // Revert on error
      get().loadQueue()
    }
  },

  // Load contacts list
  loadContacts: async (filters) => {
    set({ isLoadingContacts: true })
    
    try {
      const { data, count, error } = await ContactService.getContacts(filters)
      
      if (!error) {
        set({ 
          contacts: data || [], 
          totalContacts: count || 0,
          isLoadingContacts: false 
        })
      } else {
        console.error('Error loading contacts:', error)
        set({ isLoadingContacts: false })
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
      set({ isLoadingContacts: false })
    }
  },

  // Create new contact
  createContact: async (contactData) => {
    try {
      const { data, error } = await ContactService.createContact({
        full_name: contactData.full_name!,
        phone: contactData.phone!,
        email: contactData.email,
        address: contactData.address,
        tags: contactData.tags || [],
        custom_fields: contactData.custom_fields || {}
      })
      
      if (!error && data) {
        // Reload contacts list
        get().loadContacts()
        return data
      } else {
        console.error('Error creating contact:', error)
        return null
      }
    } catch (error) {
      console.error('Error creating contact:', error)
      return null
    }
  },

  // Delete contact
  deleteContact: async (id) => {
    try {
      const { error } = await ContactService.deleteContact(id)
      
      if (!error) {
        // Remove from local state
        set(state => ({
          contacts: state.contacts.filter(c => c.id !== id),
          totalContacts: state.totalContacts - 1,
          queue: state.queue.filter(c => c.id !== id)
        }))
        return true
      } else {
        console.error('Error deleting contact:', error)
        return false
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      return false
    }
  },

  // Reset queue
  resetQueue: () => {
    set({ 
      queue: [], 
      currentIndex: 0,
      isLoadingQueue: false 
    })
  }
}))