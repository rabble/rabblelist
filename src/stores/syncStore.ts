import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SyncQueueItem } from '@/types'

// ============================================================================
// Types
// ============================================================================

export interface SyncError {
  id: string
  error: string
  timestamp: string
}

export interface SyncState {
  // State
  pendingChanges: SyncQueueItem[]
  isSyncing: boolean
  lastSyncTime: string | null
  syncErrors: SyncError[]
  
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

// ============================================================================
// Constants
// ============================================================================

const INITIAL_STATE = {
  pendingChanges: [],
  isSyncing: false,
  lastSyncTime: null,
  syncErrors: []
} as const

const MAX_ERROR_HISTORY = 10
const STORAGE_KEY = 'sync-storage'

// ============================================================================
// Store Implementation
// ============================================================================

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      // Initial state
      ...INITIAL_STATE,
      
      // Add a new pending change to the queue
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
      
      // Remove a pending change from the queue
      removePendingChange: (id) => {
        set((state) => ({
          pendingChanges: state.pendingChanges.filter(item => item.id !== id)
        }))
      },
      
      // Increment retry count for a specific item
      incrementRetries: (id) => {
        set((state) => ({
          pendingChanges: state.pendingChanges.map(item =>
            item.id === id 
              ? { ...item, retries: item.retries + 1 } 
              : item
          )
        }))
      },
      
      // Mark sync as started
      startSync: () => {
        set({ isSyncing: true })
      },
      
      // Mark sync as completed successfully
      syncComplete: () => {
        set({
          isSyncing: false,
          lastSyncTime: new Date().toISOString(),
          pendingChanges: [],
        })
      },
      
      // Record a sync error
      syncError: (error, itemId) => {
        const errorEntry: SyncError = {
          id: itemId || 'general',
          error: error.message,
          timestamp: new Date().toISOString(),
        }
        
        set((state) => ({
          isSyncing: false,
          syncErrors: [
            ...state.syncErrors, 
            errorEntry
          ].slice(-MAX_ERROR_HISTORY), // Keep only last N errors
        }))
      },
      
      // Clear all sync errors
      clearErrors: () => {
        set({ syncErrors: [] })
      },
      
      // Reset the entire store to initial state
      clear: () => {
        set(INITIAL_STATE)
      },
    }),
    {
      name: STORAGE_KEY,
      // Only persist specific fields
      partialize: (state) => ({
        pendingChanges: state.pendingChanges,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
)

// ============================================================================
// Selectors
// ============================================================================

// Selector to get pending changes count
export const selectPendingCount = (state: SyncState) => state.pendingChanges.length

// Selector to check if there are pending changes
export const selectHasPendingChanges = (state: SyncState) => state.pendingChanges.length > 0

// Selector to get recent errors
export const selectRecentErrors = (state: SyncState) => state.syncErrors.slice(-5)

// Selector to check if sync is needed
export const selectNeedsSync = (state: SyncState) => {
  if (state.isSyncing) return false
  if (state.pendingChanges.length === 0) return false
  return true
}