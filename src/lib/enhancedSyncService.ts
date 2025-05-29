import { supabase } from '@/lib/supabase'
import { withRetry } from '@/lib/retryUtils'
import { useSyncStore } from '@/stores/syncStore'
// import { differenceInMilliseconds } from 'date-fns'
import type { SyncQueueItem } from '@/types'

interface ConflictResolution {
  strategy: 'client-wins' | 'server-wins' | 'merge' | 'manual'
  resolver?: (clientData: any, serverData: any) => any
}

interface SyncOptions {
  conflictResolution?: ConflictResolution
  syncInterval?: number
  batchSize?: number
}

export class EnhancedSyncService {
  private static isRunning = false
  private static syncInterval: NodeJS.Timeout | null = null
  private static lastSyncTimestamp: { [table: string]: string } = {}
  private static conflictResolution: ConflictResolution = { strategy: 'client-wins' }
  private static batchSize = 10

  /**
   * Initialize and start the enhanced sync service
   */
  static start(options: SyncOptions = {}) {
    if (this.syncInterval) {
      return
    }

    // Set options
    if (options.conflictResolution) {
      this.conflictResolution = options.conflictResolution
    }
    if (options.batchSize) {
      this.batchSize = options.batchSize
    }

    // Load last sync timestamps from localStorage
    const savedTimestamps = localStorage.getItem('syncTimestamps')
    if (savedTimestamps) {
      this.lastSyncTimestamp = JSON.parse(savedTimestamps)
    }

    // Initial sync
    this.performFullSync()

    // Set up periodic sync
    const intervalMs = options.syncInterval || 30000
    this.syncInterval = setInterval(() => {
      this.performIncrementalSync()
    }, intervalMs)

    // Sync on online event
    window.addEventListener('online', this.handleOnline)
    
    // Listen for storage events (cross-tab sync)
    window.addEventListener('storage', this.handleStorageChange)
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
    window.removeEventListener('storage', this.handleStorageChange)
  }

  /**
   * Handle online event
   */
  private static handleOnline = () => {
    this.performFullSync()
  }

  /**
   * Handle storage change event (cross-tab sync)
   */
  private static handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'syncQueue' && event.newValue) {
      // Another tab updated the sync queue
      this.performIncrementalSync()
    }
  }

  /**
   * Perform a full sync of all data
   */
  static async performFullSync() {
    if (this.isRunning || !navigator.onLine) {
      return
    }

    this.isRunning = true
    const store = useSyncStore.getState()
    store.startSync()

    try {

      // Sync each table
      const tables = ['contacts', 'campaigns', 'events', 'groups', 'pathways']
      
      for (const table of tables) {
        await this.syncTable(table)
      }

      // Process pending changes
      await this.processPendingChanges()

      store.syncComplete()
    } catch (error: any) {
      console.error('Full sync failed:', error)
      store.syncError(error)
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Perform incremental sync (only changes since last sync)
   */
  static async performIncrementalSync() {
    if (this.isRunning || !navigator.onLine) {
      return
    }

    this.isRunning = true
    // const store = useSyncStore.getState()

    try {

      // Process pending changes first
      await this.processPendingChanges()

      // Then pull changes from server
      const tables = ['contacts', 'campaigns', 'events', 'groups', 'pathways']
      
      for (const table of tables) {
        await this.syncTableIncremental(table)
      }

    } catch (error: any) {
      console.error('Incremental sync failed:', error)
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Sync a complete table
   */
  private static async syncTable(table: string) {
    const { data: serverData, error } = await supabase
      .from(table)
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    // Update last sync timestamp
    if (serverData && serverData.length > 0) {
      this.lastSyncTimestamp[table] = serverData[0].updated_at
      this.saveTimestamps()
    }

    // Store data locally (implementation depends on your local storage strategy)
    await this.storeDataLocally(table, serverData || [])
  }

  /**
   * Sync only changes since last sync
   */
  private static async syncTableIncremental(table: string) {
    const lastSync = this.lastSyncTimestamp[table] || '1970-01-01T00:00:00Z'
    
    const { data: serverData, error } = await supabase
      .from(table)
      .select('*')
      .gt('updated_at', lastSync)
      .order('updated_at', { ascending: false })

    if (error) throw error

    if (serverData && serverData.length > 0) {
      
      // Update last sync timestamp
      this.lastSyncTimestamp[table] = serverData[0].updated_at
      this.saveTimestamps()

      // Process each change
      for (const record of serverData) {
        await this.mergeRecord(table, record)
      }
    }
  }

  /**
   * Process pending changes in batches
   */
  private static async processPendingChanges() {
    const store = useSyncStore.getState()
    const { pendingChanges, removePendingChange, incrementRetries } = store

    if (pendingChanges.length === 0) {
      return
    }


    // Process in batches
    const batches = this.createBatches(pendingChanges, this.batchSize)
    
    for (const batch of batches) {
      await Promise.all(
        batch.map(async (change) => {
          try {
            await this.processSyncItem(change)
            removePendingChange(change.id)
          } catch (error: any) {
            console.error(`Failed to sync item ${change.id}:`, error)
            incrementRetries(change.id)
            
            // Handle conflicts
            if (error.code === '23505') { // Unique constraint violation
              await this.handleConflict(change)
            } else if (change.retries >= 5) {
              // Max retries exceeded
              removePendingChange(change.id)
            }
          }
        })
      )
    }
  }

  /**
   * Process a single sync item with conflict detection
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
      backoffMultiplier: 2
    })
  }

  /**
   * Handle create operations with duplicate detection
   */
  private static async handleCreate(item: SyncQueueItem): Promise<any> {
    if (!item.table || !item.data) {
      throw new Error('Invalid create operation')
    }

    // Check if record already exists (by unique fields)
    const existingRecord = await this.findExistingRecord(item.table, item.data)
    
    if (existingRecord) {
      // Convert to update operation
      return await this.handleUpdate({
        ...item,
        type: 'update',
        recordId: existingRecord.id
      })
    }

    const { error } = await supabase
      .from(item.table)
      .insert(item.data)

    if (error) throw error
  }

  /**
   * Handle update operations with conflict resolution
   */
  private static async handleUpdate(item: SyncQueueItem): Promise<any> {
    if (!item.table || !item.recordId || !item.data) {
      throw new Error('Invalid update operation')
    }

    // Get current server version
    const { data: serverData, error: fetchError } = await supabase
      .from(item.table)
      .select('*')
      .eq('id', item.recordId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

    if (!serverData) {
      // Record doesn't exist on server, convert to create
      return await this.handleCreate({
        ...item,
        type: 'create'
      })
    }

    // Check for conflicts
    const hasConflict = this.detectConflict(item.data, serverData)
    
    if (hasConflict) {
      const resolvedData = await this.resolveConflict(item.data, serverData)
      item.data = resolvedData
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
      throw new Error('Invalid delete operation')
    }

    const { error } = await supabase
      .from(item.table)
      .delete()
      .eq('id', item.recordId)

    if (error && error.code !== 'PGRST116') throw error // Ignore not found errors
  }

  /**
   * Detect if there's a conflict between client and server data
   */
  private static detectConflict(clientData: any, serverData: any): boolean {
    // Skip if no updated_at field
    if (!clientData.updated_at || !serverData.updated_at) {
      return false
    }

    // Compare timestamps
    const clientTime = new Date(clientData.updated_at).getTime()
    const serverTime = new Date(serverData.updated_at).getTime()
    
    // If server was updated after our last known update, there's a conflict
    return serverTime > clientTime
  }

  /**
   * Resolve conflicts between client and server data
   */
  private static async resolveConflict(clientData: any, serverData: any): Promise<any> {
    switch (this.conflictResolution.strategy) {
      case 'client-wins':
        return clientData
        
      case 'server-wins':
        return serverData
        
      case 'merge':
        return this.mergeData(clientData, serverData)
        
      case 'manual':
        if (this.conflictResolution.resolver) {
          return this.conflictResolution.resolver(clientData, serverData)
        }
        // Fall back to client wins if no resolver provided
        return clientData
        
      default:
        return clientData
    }
  }

  /**
   * Merge client and server data
   */
  private static mergeData(clientData: any, serverData: any): any {
    const merged = { ...serverData }
    
    // For each field in client data
    for (const key in clientData) {
      if (key === 'id' || key === 'created_at') continue
      
      // If field was modified on client after server
      if (clientData[key] !== serverData[key]) {
        // For arrays, merge unique values
        if (Array.isArray(clientData[key]) && Array.isArray(serverData[key])) {
          merged[key] = [...new Set([...serverData[key], ...clientData[key]])]
        } 
        // For objects, deep merge
        else if (typeof clientData[key] === 'object' && typeof serverData[key] === 'object') {
          merged[key] = { ...serverData[key], ...clientData[key] }
        }
        // For primitives, use client value (could be enhanced with field-level timestamps)
        else {
          merged[key] = clientData[key]
        }
      }
    }
    
    // Update timestamp to current time
    merged.updated_at = new Date().toISOString()
    
    return merged
  }

  /**
   * Handle conflict by converting to user action
   */
  private static async handleConflict(item: SyncQueueItem) {
    
    // Store conflict for user resolution
    const conflicts = JSON.parse(localStorage.getItem('syncConflicts') || '[]')
    conflicts.push({
      ...item,
      conflictDetectedAt: new Date().toISOString()
    })
    localStorage.setItem('syncConflicts', JSON.stringify(conflicts))
    
    // Remove from pending changes
    const { removePendingChange } = useSyncStore.getState()
    removePendingChange(item.id)
  }

  /**
   * Find existing record by unique fields
   */
  private static async findExistingRecord(table: string, data: any): Promise<any> {
    // Define unique fields for each table
    const uniqueFields: { [table: string]: string[] } = {
      contacts: ['email', 'phone'],
      campaigns: ['title'],
      events: ['name', 'start_time'],
      // Add more as needed
    }
    
    const fields = uniqueFields[table] || []
    
    for (const field of fields) {
      if (data[field]) {
        const { data: existing } = await supabase
          .from(table)
          .select('*')
          .eq(field, data[field])
          .single()
          
        if (existing) return existing
      }
    }
    
    return null
  }

  /**
   * Merge a record from server
   */
  private static async mergeRecord(table: string, serverRecord: any) {
    // Get local version if exists
    const localRecord = await this.getLocalRecord(table, serverRecord.id)
    
    if (!localRecord) {
      // New record from server
      await this.storeRecordLocally(table, serverRecord)
    } else {
      // Check for conflicts
      const hasConflict = this.detectConflict(localRecord, serverRecord)
      
      if (hasConflict) {
        const resolved = await this.resolveConflict(localRecord, serverRecord)
        await this.storeRecordLocally(table, resolved)
        
        // If client data won, queue update to server
        if (resolved !== serverRecord) {
          const { addPendingChange } = useSyncStore.getState()
          addPendingChange({
            type: 'update',
            table,
            recordId: resolved.id,
            data: resolved
          })
        }
      } else {
        // No conflict, update local
        await this.storeRecordLocally(table, serverRecord)
      }
    }
  }

  /**
   * Create batches from array
   */
  private static createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    
    return batches
  }

  /**
   * Save sync timestamps
   */
  private static saveTimestamps() {
    localStorage.setItem('syncTimestamps', JSON.stringify(this.lastSyncTimestamp))
  }

  /**
   * Store data locally (implement based on your storage strategy)
   */
  private static async storeDataLocally(_table: string, _data: any[]) {
    // This would integrate with your local storage solution
    // For example, IndexedDB, localStorage, or in-memory store
  }

  /**
   * Store a single record locally
   */
  private static async storeRecordLocally(_table: string, _record: any) {
    // Implementation depends on your local storage strategy
  }

  /**
   * Get a local record
   */
  private static async getLocalRecord(_table: string, _id: string): Promise<any> {
    // Implementation depends on your local storage strategy
    return null
  }

  /**
   * Get conflict queue
   */
  static getConflicts(): any[] {
    return JSON.parse(localStorage.getItem('syncConflicts') || '[]')
  }

  /**
   * Clear conflict queue
   */
  static clearConflicts() {
    localStorage.removeItem('syncConflicts')
  }

  /**
   * Add a change to the sync queue
   */
  static addToQueue(item: Omit<SyncQueueItem, 'id' | 'retries' | 'created_at'>) {
    const { addPendingChange } = useSyncStore.getState()
    addPendingChange(item)
    
    // Save to localStorage for cross-tab sync
    const queue = useSyncStore.getState().pendingChanges
    localStorage.setItem('syncQueue', JSON.stringify(queue))
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      this.performIncrementalSync()
    }
  }
}