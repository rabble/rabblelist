import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SyncQueueItem } from '@/types'

interface SyncState {
  pendingChanges: SyncQueueItem[]
  isSyncing: boolean
  lastSyncTime: string | null
  syncErrors: Array<{ id: string; error: string; timestamp: string }>
  
  // Actions
  addPendingChange: (item: Omit<SyncQueueItem, 'id' | 'retries' | 'created_at'>) => void
  removePendingChange: (id: string) => void
  incrementRetries: (id: string) => void
  startSync: () => void
  syncComplete: () => void
  syncError: (error: Error, itemId?: string) => void
  clearErrors: () => void
  clear: () => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      pendingChanges: [],
      isSyncing: false,
      lastSyncTime: null,
      syncErrors: [],
      
      addPendingChange: (item) => {
        const newItem: SyncQueueItem = {
          ...item,
          id: crypto.randomUUID(),
          retries: 0,
          created_at: new Date().toISOString(),
        }
        set((state) => ({
          pendingChanges: [...state.pendingChanges, newItem]
        }))
      },
      
      removePendingChange: (id) =>
        set((state) => ({
          pendingChanges: state.pendingChanges.filter(item => item.id !== id)
        })),
      
      incrementRetries: (id) =>
        set((state) => ({
          pendingChanges: state.pendingChanges.map(item =>
            item.id === id ? { ...item, retries: item.retries + 1 } : item
          )
        })),
      
      startSync: () => set({ isSyncing: true }),
      
      syncComplete: () => {
        set({
          isSyncing: false,
          lastSyncTime: new Date().toISOString(),
          pendingChanges: [],
        })
      },
      
      syncError: (error, itemId) => {
        const errorEntry = {
          id: itemId || 'general',
          error: error.message,
          timestamp: new Date().toISOString(),
        }
        
        set((state) => ({
          isSyncing: false,
          syncErrors: [...state.syncErrors, errorEntry].slice(-10), // Keep last 10 errors
        }))
      },
      
      clearErrors: () => set({ syncErrors: [] }),
      
      clear: () => set({
        pendingChanges: [],
        isSyncing: false,
        lastSyncTime: null,
        syncErrors: [],
      }),
    }),
    {
      name: 'sync-storage',
      partialize: (state) => ({
        pendingChanges: state.pendingChanges,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
)