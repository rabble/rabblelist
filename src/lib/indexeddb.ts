import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Contact, CallLog, Event, EventParticipant } from '@/types'

// Define the database schema
interface ContactManagerDB extends DBSchema {
  contacts: {
    key: string
    value: Contact
    indexes: {
      'by-phone': string
      'by-email': string
      'by-organization': string
      'by-updated': string
    }
  }
  call_logs: {
    key: string
    value: CallLog
    indexes: {
      'by-contact': string
      'by-ringer': string
      'by-organization': string
      'by-called-at': string
    }
  }
  events: {
    key: string
    value: Event
    indexes: {
      'by-organization': string
      'by-start-time': string
    }
  }
  event_participants: {
    key: string
    value: EventParticipant
    indexes: {
      'by-event': string
      'by-contact': string
    }
  }
  sync_queue: {
    key: string
    value: {
      id: string
      type: 'create' | 'update' | 'delete'
      table: string
      recordId?: string
      data?: any
      retries: number
      created_at: string
    }
    indexes: {
      'by-created': string
      'by-table': string
    }
  }
  metadata: {
    key: string
    value: {
      key: string
      value: any
      updated_at: string
    }
  }
}

class IndexedDBService {
  private db: IDBPDatabase<ContactManagerDB> | null = null
  private readonly DB_NAME = 'contact-manager-pwa'
  private readonly DB_VERSION = 1

  async init(): Promise<void> {
    if (this.db) return

    this.db = await openDB<ContactManagerDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create contacts store
        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { keyPath: 'id' })
          contactStore.createIndex('by-phone', 'phone')
          contactStore.createIndex('by-email', 'email')
          contactStore.createIndex('by-organization', 'organization_id')
          contactStore.createIndex('by-updated', 'updated_at')
        }

        // Create call_logs store
        if (!db.objectStoreNames.contains('call_logs')) {
          const callLogStore = db.createObjectStore('call_logs', { keyPath: 'id' })
          callLogStore.createIndex('by-contact', 'contact_id')
          callLogStore.createIndex('by-ringer', 'ringer_id')
          callLogStore.createIndex('by-organization', 'organization_id')
          callLogStore.createIndex('by-called-at', 'called_at')
        }

        // Create events store
        if (!db.objectStoreNames.contains('events')) {
          const eventStore = db.createObjectStore('events', { keyPath: 'id' })
          eventStore.createIndex('by-organization', 'organization_id')
          eventStore.createIndex('by-start-time', 'start_time')
        }

        // Create event_participants store
        if (!db.objectStoreNames.contains('event_participants')) {
          const participantStore = db.createObjectStore('event_participants', { keyPath: 'id' })
          participantStore.createIndex('by-event', 'event_id')
          participantStore.createIndex('by-contact', 'contact_id')
        }

        // Create sync_queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' })
          syncStore.createIndex('by-created', 'created_at')
          syncStore.createIndex('by-table', 'table')
        }

        // Create metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      }
    })
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  // Contacts methods
  async saveContact(contact: Contact): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.put('contacts', contact)
  }

  async saveContacts(contacts: Contact[]): Promise<void> {
    if (!this.db) await this.init()
    const tx = this.db!.transaction('contacts', 'readwrite')
    await Promise.all(contacts.map(contact => tx.store.put(contact)))
    await tx.done
  }

  async getContact(id: string): Promise<Contact | undefined> {
    if (!this.db) await this.init()
    return await this.db!.get('contacts', id)
  }

  async getAllContacts(organizationId?: string): Promise<Contact[]> {
    if (!this.db) await this.init()
    
    if (organizationId) {
      return await this.db!.getAllFromIndex('contacts', 'by-organization', organizationId)
    }
    
    return await this.db!.getAll('contacts')
  }

  async searchContacts(query: string, organizationId?: string): Promise<Contact[]> {
    if (!this.db) await this.init()
    
    const allContacts = organizationId 
      ? await this.db!.getAllFromIndex('contacts', 'by-organization', organizationId)
      : await this.db!.getAll('contacts')
    
    const lowerQuery = query.toLowerCase()
    return allContacts.filter(contact => 
      contact.full_name.toLowerCase().includes(lowerQuery) ||
      contact.phone.includes(query) ||
      (contact.email && contact.email.toLowerCase().includes(lowerQuery))
    )
  }

  async deleteContact(id: string): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.delete('contacts', id)
  }

  // Call logs methods
  async saveCallLog(callLog: CallLog): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.put('call_logs', callLog)
  }

  async getCallLogsForContact(contactId: string): Promise<CallLog[]> {
    if (!this.db) await this.init()
    return await this.db!.getAllFromIndex('call_logs', 'by-contact', contactId)
  }

  // Events methods
  async saveEvent(event: Event): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.put('events', event)
  }

  async saveEvents(events: Event[]): Promise<void> {
    if (!this.db) await this.init()
    const tx = this.db!.transaction('events', 'readwrite')
    await Promise.all(events.map(event => tx.store.put(event)))
    await tx.done
  }

  async getUpcomingEvents(organizationId: string): Promise<Event[]> {
    if (!this.db) await this.init()
    const now = new Date().toISOString()
    const allEvents = await this.db!.getAllFromIndex('events', 'by-organization', organizationId)
    return allEvents.filter(event => event.start_time >= now)
  }

  // Sync queue methods
  async addToSyncQueue(item: Omit<ContactManagerDB['sync_queue']['value'], 'id' | 'created_at' | 'retries'>): Promise<void> {
    if (!this.db) await this.init()
    
    const syncItem: ContactManagerDB['sync_queue']['value'] = {
      ...item,
      id: crypto.randomUUID(),
      retries: 0,
      created_at: new Date().toISOString()
    }
    
    await this.db!.put('sync_queue', syncItem)
  }

  async getSyncQueue(): Promise<ContactManagerDB['sync_queue']['value'][]> {
    if (!this.db) await this.init()
    return await this.db!.getAllFromIndex('sync_queue', 'by-created')
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.delete('sync_queue', id)
  }

  async updateSyncQueueItem(id: string, updates: Partial<ContactManagerDB['sync_queue']['value']>): Promise<void> {
    if (!this.db) await this.init()
    const item = await this.db!.get('sync_queue', id)
    if (item) {
      await this.db!.put('sync_queue', { ...item, ...updates })
    }
  }

  // Metadata methods
  async setMetadata(key: string, value: any): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.put('metadata', {
      key,
      value,
      updated_at: new Date().toISOString()
    })
  }

  async getMetadata(key: string): Promise<any> {
    if (!this.db) await this.init()
    const data = await this.db!.get('metadata', key)
    return data?.value
  }

  // Clear all data
  async clearAll(): Promise<void> {
    if (!this.db) await this.init()
    
    const tx = this.db!.transaction(
      ['contacts', 'call_logs', 'events', 'event_participants', 'sync_queue', 'metadata'],
      'readwrite'
    )
    
    await Promise.all([
      tx.objectStore('contacts').clear(),
      tx.objectStore('call_logs').clear(),
      tx.objectStore('events').clear(),
      tx.objectStore('event_participants').clear(),
      tx.objectStore('sync_queue').clear(),
      tx.objectStore('metadata').clear()
    ])
    
    await tx.done
  }

  // Get database size
  async getDatabaseSize(): Promise<{ tables: Record<string, number>, total: number }> {
    if (!this.db) await this.init()
    
    const tables: Record<string, number> = {
      contacts: await this.db!.count('contacts'),
      call_logs: await this.db!.count('call_logs'),
      events: await this.db!.count('events'),
      event_participants: await this.db!.count('event_participants'),
      sync_queue: await this.db!.count('sync_queue'),
      metadata: await this.db!.count('metadata')
    }
    
    const total = Object.values(tables).reduce((sum, count) => sum + count, 0)
    
    return { tables, total }
  }
}

// Export singleton instance
export const indexedDb = new IndexedDBService()