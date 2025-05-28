import { supabase } from './supabase'
import { indexedDb } from './indexeddb'
import type { SyncChange } from '@/types'

class SyncService {
  private syncInProgress = false
  private syncInterval: ReturnType<typeof setInterval> | null = null
  private onlineListener: (() => void) | null = null
  private offlineListener: (() => void) | null = null

  // Start automatic sync
  startAutoSync(intervalMs = 30000) {
    // Sync when coming online
    this.onlineListener = () => {
      this.sync()
    }
    
    this.offlineListener = () => {
    }

    window.addEventListener('online', this.onlineListener)
    window.addEventListener('offline', this.offlineListener)

    // Periodic sync
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.sync()
      }
    }, intervalMs)

    // Initial sync
    if (navigator.onLine) {
      this.sync()
    }
  }

  // Stop automatic sync
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener)
      this.onlineListener = null
    }

    if (this.offlineListener) {
      window.removeEventListener('offline', this.offlineListener)
      this.offlineListener = null
    }
  }

  // Main sync function
  async sync(): Promise<{ success: boolean; error?: Error }> {
    if (this.syncInProgress || !navigator.onLine) {
      return { success: false, error: new Error('Sync already in progress or offline') }
    }

    this.syncInProgress = true

    try {
      // 1. Upload pending changes
      await this.uploadPendingChanges()

      // 2. Download latest data
      await this.downloadLatestData()

      // 3. Clean up synced changes
      // Clear sync queue after successful sync
      const syncQueue = await indexedDb.getSyncQueue()
      for (const item of syncQueue) {
        await indexedDb.removeSyncQueueItem(item.id)
      }

      return { success: true }
    } catch (error) {
      console.error('Sync error:', error)
      return { success: false, error: error as Error }
    } finally {
      this.syncInProgress = false
    }
  }

  // Upload pending changes to Supabase
  private async uploadPendingChanges() {
    const pendingChanges = await indexedDb.getSyncQueue()

    for (const change of pendingChanges) {
      try {
        // Convert sync_queue format to SyncChange format
        const syncChange: SyncChange = {
          id: change.id,
          type: change.table as any, // 'contacts', 'call_logs', etc.
          action: change.type as any, // 'create', 'update', 'delete'
          data: change.data,
          timestamp: change.created_at,
          retries: change.retries
        }
        
        await this.processSyncChange(syncChange)
        await indexedDb.removeSyncQueueItem(change.id)
      } catch (error) {
        console.error(`Failed to sync change ${change.id}:`, error)
        
        // Increment retry count
        if (change.retries < 3) {
          await indexedDb.updateSyncQueueItem(change.id, {
            retries: change.retries + 1
          })
        } else {
          console.error(`Giving up on change ${change.id} after ${change.retries + 1} retries`)
          await indexedDb.removeSyncQueueItem(change.id)
        }
      }
    }
  }

  // Process individual sync change
  private async processSyncChange(change: SyncChange) {
    switch (change.type) {
      case 'contacts':
        await this.syncContact(change)
        break
      
      case 'call_logs':
        await this.syncCallLog(change)
        break
      
      case 'event_participants':
        await this.syncEventParticipant(change)
        break
      
      default:
        console.warn(`Unknown sync type: ${change.type}`)
    }
  }

  // Sync contact changes
  private async syncContact(change: SyncChange) {
    const { action, data } = change

    switch (action) {
      case 'create':
        await supabase.from('contacts').insert(data)
        break
      
      case 'update':
        await supabase.from('contacts').update(data).eq('id', data.id)
        break
      
      case 'delete':
        await supabase.from('contacts').delete().eq('id', data.id)
        break
    }
  }

  // Sync call log changes
  private async syncCallLog(change: SyncChange) {
    if (change.action === 'create') {
      await supabase.from('call_logs').insert(change.data)
    }
  }

  // Sync event participant changes
  private async syncEventParticipant(change: SyncChange) {
    const { action, data } = change

    switch (action) {
      case 'create':
        await supabase.from('event_participants').insert(data)
        break
      
      case 'update':
        await supabase.from('event_participants').update(data).eq('id', data.id)
        break
    }
  }

  // Download latest data from Supabase
  private async downloadLatestData() {
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) return

    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.user.id)
      .single()

    if (!profile?.organization_id) return

    // Get last sync time from localStorage
    const lastSyncKey = `lastSync_${profile.organization_id}`
    const lastSync = localStorage.getItem(lastSyncKey)
    const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0)

    // Download contacts
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .gte('updated_at', lastSyncDate.toISOString())

    if (contacts && contacts.length > 0) {
      await indexedDb.saveContacts(contacts)
    }

    // Download events
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .gte('updated_at', lastSyncDate.toISOString())

    if (events && events.length > 0) {
      await indexedDb.saveEvents(events)
    }

    // Update last sync time
    localStorage.setItem(lastSyncKey, new Date().toISOString())
  }

  // Force full sync (clear local data and download everything)
  async fullSync() {
    await indexedDb.clearAll()
    localStorage.removeItem('lastSync')
    return this.sync()
  }

  // Get sync status
  async getSyncStatus() {
    const pendingChanges = await indexedDb.getSyncQueue()
    const stats = await indexedDb.getDatabaseSize()
    
    return {
      isOnline: navigator.onLine,
      isSyncing: this.syncInProgress,
      pendingChanges: pendingChanges.length,
      localData: stats,
      lastSync: localStorage.getItem('lastSync')
    }
  }
}

// Export singleton instance
export const syncService = new SyncService()