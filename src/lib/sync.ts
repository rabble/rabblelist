import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import { supabase } from './supabase'
import type { SyncQueueItem, CallLog } from '@/types'

interface SyncDB extends DBSchema {
  syncQueue: {
    key: string
    value: SyncQueueItem
  }
}

class SyncManager {
  private db: IDBPDatabase<SyncDB> | null = null
  private readonly DB_NAME = 'contact-manager-sync'
  private readonly DB_VERSION = 1

  async initDB() {
    if (this.db) return this.db

    this.db = await openDB<SyncDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' })
        }
      },
    })

    return this.db
  }

  async addToQueue(item: SyncQueueItem) {
    const db = await this.initDB()
    await db.put('syncQueue', item)
  }

  async getQueueItems(): Promise<SyncQueueItem[]> {
    const db = await this.initDB()
    return await db.getAll('syncQueue')
  }

  async removeFromQueue(id: string) {
    const db = await this.initDB()
    await db.delete('syncQueue', id)
  }

  async syncAll(items: SyncQueueItem[]) {
    const results = await Promise.allSettled(
      items.map(item => this.syncItem(item))
    )

    // Handle results
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const item = items[i]

      if (result.status === 'fulfilled') {
        await this.removeFromQueue(item.id)
      } else {
        // Increment retry count
        item.retries += 1
        if (item.retries >= 3) {
          // Max retries reached, remove from queue
          await this.removeFromQueue(item.id)
          console.error(`Max retries reached for sync item ${item.id}`, result.reason)
        } else {
          await this.addToQueue(item)
        }
      }
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'call_log':
        return this.syncCallLog(item)
      case 'contact_update':
        return this.syncContactUpdate(item)
      case 'event_checkin':
        return this.syncEventCheckin(item)
      default:
        throw new Error(`Unknown sync type: ${item.type}`)
    }
  }

  private async syncCallLog(item: SyncQueueItem) {
    if (item.action !== 'create') {
      throw new Error('Only create action is supported for call logs')
    }

    const user = await supabase.auth.getUser()
    if (!user.data.user) throw new Error('Not authenticated')

    // Get organization ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.data.user.id)
      .single()

    if (userError || !userData) throw new Error('Failed to get user data')

    const callLog: Partial<CallLog> = {
      ...item.data,
      organization_id: userData.organization_id,
      ringer_id: user.data.user!.id,
    }

    const { error } = await supabase
      .from('call_logs')
      .insert(callLog)

    if (error) throw error
  }

  private async syncContactUpdate(item: SyncQueueItem) {
    if (item.action !== 'update') {
      throw new Error('Only update action is supported for contacts')
    }

    const { error } = await supabase
      .from('contacts')
      .update(item.data.updates)
      .eq('id', item.data.contactId)

    if (error) throw error
  }

  private async syncEventCheckin(item: SyncQueueItem) {
    if (item.action !== 'update') {
      throw new Error('Only update action is supported for event checkins')
    }

    const { error } = await supabase
      .from('event_participants')
      .update({
        status: 'attended',
        checked_in_at: new Date().toISOString(),
      })
      .eq('event_id', item.data.eventId)
      .eq('contact_id', item.data.contactId)

    if (error) throw error
  }

  // Batch sync for better performance
  async batchSync(items: SyncQueueItem[]) {
    // Group items by type and action
    const grouped = items.reduce((acc, item) => {
      const key = `${item.type}-${item.action}`
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {} as Record<string, SyncQueueItem[]>)

    // Process each group
    for (const [key, groupItems] of Object.entries(grouped)) {
      const [type, action] = key.split('-')
      
      if (type === 'call_log' && action === 'create') {
        await this.batchCreateCallLogs(groupItems)
      }
      // Add more batch operations as needed
    }
  }

  private async batchCreateCallLogs(items: SyncQueueItem[]) {
    const user = await supabase.auth.getUser()
    if (!user.data.user) throw new Error('Not authenticated')

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.data.user.id)
      .single()

    if (userError || !userData) throw new Error('Failed to get user data')

    const callLogs = items.map(item => ({
      ...item.data,
      organization_id: userData.organization_id,
      ringer_id: user.data.user!.id,
    }))

    const { error } = await supabase
      .from('call_logs')
      .insert(callLogs)

    if (error) throw error

    // Remove all successfully synced items
    await Promise.all(items.map(item => this.removeFromQueue(item.id)))
  }
}

export const syncManager = new SyncManager()