import { supabase } from '@/lib/supabase'
import { withRetry } from '@/lib/retryUtils'
import { useSyncStore } from '@/stores/syncStore'
import type { SyncQueueItem } from '@/types'

export class SyncService {
  private static isRunning = false
  private static syncInterval: NodeJS.Timeout | null = null

  /**
   * Start the sync service with periodic sync
   */
  static start(intervalMs: number = 30000) {
    if (this.syncInterval) {
      return
    }

    // Initial sync
    this.syncPendingChanges()

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      this.syncPendingChanges()
    }, intervalMs)

    // Sync on online event
    window.addEventListener('online', this.handleOnline)
  }

  /**
   * Stop the sync service
   */
  static stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    window.removeEventListener('online', this.handleOnline)
  }

  /**
   * Handle online event
   */
  private static handleOnline = () => {
    this.syncPendingChanges()
  }

  /**
   * Sync all pending changes
   */
  static async syncPendingChanges() {
    if (this.isRunning) {
      return
    }

    const store = useSyncStore.getState()
    const { pendingChanges, startSync, syncComplete, syncError, removePendingChange, incrementRetries } = store

    if (pendingChanges.length === 0) {
      return
    }

    if (!navigator.onLine) {
      return
    }

    this.isRunning = true
    startSync()


    try {
      // Process each pending change
      for (const change of pendingChanges) {
        try {
          await this.processSyncItem(change)
          removePendingChange(change.id)
        } catch (error: any) {
          console.error(`Failed to sync item ${change.id}:`, error)
          incrementRetries(change.id)
          
          // Remove if too many retries
          if (change.retries >= 5) {
            syncError(new Error(`Max retries exceeded for ${change.type} operation`), change.id)
            removePendingChange(change.id)
          }
        }
      }

      // If all items processed successfully
      if (useSyncStore.getState().pendingChanges.length === 0) {
        syncComplete()
      }
    } catch (error: any) {
      console.error('Sync failed:', error)
      syncError(error)
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Process a single sync item
   */
  private static async processSyncItem(item: SyncQueueItem) {
    return withRetry(async () => {
      switch (item.type) {
        case 'create':
          return await this.handleCreate(item)
        case 'update':
          return await this.handleUpdate(item)
        case 'delete':
          return await this.handleDelete(item)
        default:
          throw new Error(`Unknown sync type: ${item.type}`)
      }
    }, {
      maxAttempts: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
      onRetry: (error, attempt) => {
        console.warn(`Retrying sync item ${item.id} (attempt ${attempt}):`, error)
      }
    })
  }

  /**
   * Handle create operations
   */
  private static async handleCreate(item: SyncQueueItem) {
    if (!item.table || !item.data) {
      throw new Error('Invalid create operation: missing table or data')
    }

    const { error } = await supabase
      .from(item.table)
      .insert(item.data)

    if (error) throw error
  }

  /**
   * Handle update operations
   */
  private static async handleUpdate(item: SyncQueueItem) {
    if (!item.table || !item.recordId || !item.data) {
      throw new Error('Invalid update operation: missing table, recordId, or data')
    }

    const { error } = await supabase
      .from(item.table)
      .update(item.data)
      .eq('id', item.recordId)

    if (error) throw error
  }

  /**
   * Handle delete operations
   */
  private static async handleDelete(item: SyncQueueItem) {
    if (!item.table || !item.recordId) {
      throw new Error('Invalid delete operation: missing table or recordId')
    }

    const { error } = await supabase
      .from(item.table)
      .delete()
      .eq('id', item.recordId)

    if (error) throw error
  }

  /**
   * Add a change to the sync queue
   */
  static addToQueue(item: Omit<SyncQueueItem, 'id' | 'retries' | 'created_at'>) {
    const { addPendingChange } = useSyncStore.getState()
    addPendingChange(item)
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncPendingChanges()
    }
  }
}