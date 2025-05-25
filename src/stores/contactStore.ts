import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Contact, CallAssignment } from '@/types'

interface ContactState {
  // Contact queue
  queue: Contact[]
  currentIndex: number
  assignments: CallAssignment[]
  
  // Loading states
  isLoadingQueue: boolean
  isLoadingContact: boolean
  
  // Actions
  setQueue: (contacts: Contact[]) => void
  setCurrentIndex: (index: number) => void
  nextContact: () => void
  previousContact: () => void
  addToQueue: (contact: Contact) => void
  removeFromQueue: (contactId: string) => void
  updateContact: (contactId: string, updates: Partial<Contact>) => void
  setAssignments: (assignments: CallAssignment[]) => void
  markAssignmentComplete: (assignmentId: string) => void
  setLoadingQueue: (loading: boolean) => void
  setLoadingContact: (loading: boolean) => void
  clear: () => void
}

export const useContactStore = create<ContactState>()(
  persist(
    (set, get) => ({
      queue: [],
      currentIndex: 0,
      assignments: [],
      isLoadingQueue: false,
      isLoadingContact: false,
      
      setQueue: (contacts) => set({ queue: contacts }),
      
      setCurrentIndex: (index) => set({ currentIndex: index }),
      
      nextContact: () => {
        const { queue, currentIndex } = get()
        if (currentIndex < queue.length - 1) {
          set({ currentIndex: currentIndex + 1 })
        }
      },
      
      previousContact: () => {
        const { currentIndex } = get()
        if (currentIndex > 0) {
          set({ currentIndex: currentIndex - 1 })
        }
      },
      
      addToQueue: (contact) => 
        set((state) => ({ queue: [...state.queue, contact] })),
      
      removeFromQueue: (contactId) =>
        set((state) => ({
          queue: state.queue.filter(c => c.id !== contactId),
          currentIndex: Math.min(state.currentIndex, state.queue.length - 2)
        })),
      
      updateContact: (contactId, updates) =>
        set((state) => ({
          queue: state.queue.map(c => 
            c.id === contactId ? { ...c, ...updates } : c
          )
        })),
      
      setAssignments: (assignments) => set({ assignments }),
      
      markAssignmentComplete: (assignmentId) =>
        set((state) => ({
          assignments: state.assignments.map(a =>
            a.id === assignmentId
              ? { ...a, completed_at: new Date().toISOString() }
              : a
          )
        })),
      
      setLoadingQueue: (loading) => set({ isLoadingQueue: loading }),
      setLoadingContact: (loading) => set({ isLoadingContact: loading }),
      
      clear: () => set({
        queue: [],
        currentIndex: 0,
        assignments: [],
        isLoadingQueue: false,
        isLoadingContact: false,
      }),
    }),
    {
      name: 'contact-storage',
      partialize: (state) => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        assignments: state.assignments,
      }),
    }
  )
)