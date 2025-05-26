import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { Contact, CallLog, Event, SyncChange } from '@/types'

interface ContactManagerDB extends DBSchema {
  contacts: {
    key: string
    value: Contact
    indexes: { 
      'by-org': string
      'by-phone': string
      'by-updated': string
    }
  }
  call_logs: {
    key: string
    value: CallLog
    indexes: { 
      'by-contact': string
      'by-ringer': string
      'by-date': string
    }
  }
  events: {
    key: string
    value: Event
    indexes: {
      'by-org': string
      'by-date': string
    }
  }
  sync_queue: {
    key: string
    value: SyncChange
    indexes: {
      'by-timestamp': string
      'by-synced': string
    }
  }
}

const DB_NAME = 'ContactManagerDB'
const DB_VERSION = 1

let db: IDBPDatabase<ContactManagerDB> | null = null

export async function getDB(): Promise<IDBPDatabase<ContactManagerDB>> {
  if (db) return db

  db = await openDB<ContactManagerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Contacts store
      if (!db.objectStoreNames.contains('contacts')) {
        const contactStore = db.createObjectStore('contacts', { keyPath: 'id' })
        contactStore.createIndex('by-org', 'organization_id')
        contactStore.createIndex('by-phone', 'phone')
        contactStore.createIndex('by-updated', 'updated_at')
      }

      // Call logs store
      if (!db.objectStoreNames.contains('call_logs')) {
        const callLogStore = db.createObjectStore('call_logs', { keyPath: 'id' })
        callLogStore.createIndex('by-contact', 'contact_id')
        callLogStore.createIndex('by-ringer', 'ringer_id')
        callLogStore.createIndex('by-date', 'called_at')
      }

      // Events store
      if (!db.objectStoreNames.contains('events')) {
        const eventStore = db.createObjectStore('events', { keyPath: 'id' })
        eventStore.createIndex('by-org', 'organization_id')
        eventStore.createIndex('by-date', 'start_time')
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' })
        syncStore.createIndex('by-timestamp', 'timestamp')
        syncStore.createIndex('by-synced', 'synced')
      }
    }
  })

  return db
}

// Contact operations
export async function saveContact(contact: Contact): Promise<void> {
  const db = await getDB()
  await db.put('contacts', contact)
}

export async function saveContacts(contacts: Contact[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('contacts', 'readwrite')
  
  await Promise.all([
    ...contacts.map(contact => tx.store.put(contact)),
    tx.done
  ])
}

export async function getContact(id: string): Promise<Contact | undefined> {
  const db = await getDB()
  return db.get('contacts', id)
}

export async function getContacts(orgId: string): Promise<Contact[]> {
  const db = await getDB()
  return db.getAllFromIndex('contacts', 'by-org', orgId)
}

export async function deleteContact(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('contacts', id)
}

// Call log operations
export async function saveCallLog(callLog: CallLog): Promise<void> {
  const db = await getDB()
  await db.put('call_logs', callLog)
}

export async function getCallLogs(contactId: string): Promise<CallLog[]> {
  const db = await getDB()
  return db.getAllFromIndex('call_logs', 'by-contact', contactId)
}

// Event operations
export async function saveEvent(event: Event): Promise<void> {
  const db = await getDB()
  await db.put('events', event)
}

export async function saveEvents(events: Event[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('events', 'readwrite')
  
  await Promise.all([
    ...events.map(event => tx.store.put(event)),
    tx.done
  ])
}

export async function getEvents(orgId: string): Promise<Event[]> {
  const db = await getDB()
  return db.getAllFromIndex('events', 'by-org', orgId)
}

// Sync queue operations
export async function addToSyncQueue(change: Omit<SyncChange, 'id'>): Promise<void> {
  const db = await getDB()
  const id = `${change.type}_${change.timestamp}_${Math.random()}`
  
  await db.put('sync_queue', {
    ...change,
    id,
    synced: false,
    retries: 0
  })
}

export async function getPendingSyncChanges(): Promise<SyncChange[]> {
  const db = await getDB()
  const changes = await db.getAllFromIndex('sync_queue', 'by-synced', IDBKeyRange.only(0))
  return changes.filter(change => !change.synced)
}

export async function markSynced(id: string): Promise<void> {
  const db = await getDB()
  const change = await db.get('sync_queue', id)
  
  if (change) {
    await db.put('sync_queue', {
      ...change,
      synced: true
    })
  }
}

export async function deleteSyncedChanges(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('sync_queue', 'readwrite')
  const synced = await tx.store.index('by-synced').getAllKeys(IDBKeyRange.only(1))
  
  await Promise.all([
    ...synced.map(key => tx.store.delete(key)),
    tx.done
  ])
}

// Clear all data (for logout)
export async function clearAllData(): Promise<void> {
  const db = await getDB()
  
  await Promise.all([
    db.clear('contacts'),
    db.clear('call_logs'),
    db.clear('events'),
    db.clear('sync_queue')
  ])
}

// Check if we have offline data
export async function hasOfflineData(): Promise<boolean> {
  const pendingChanges = await getPendingSyncChanges()
  return pendingChanges.length > 0
}

// Get database stats
export async function getDatabaseStats() {
  const db = await getDB()
  
  const [contacts, callLogs, events, syncQueue] = await Promise.all([
    db.count('contacts'),
    db.count('call_logs'),
    db.count('events'),
    db.count('sync_queue')
  ])
  
  return {
    contacts,
    callLogs,
    events,
    pendingSyncs: syncQueue
  }
}