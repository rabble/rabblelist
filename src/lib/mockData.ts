import type { User, Contact, CallLog, Organization } from '@/types'

// Mock data for demo mode
export const mockOrganization: Organization = {
  id: 'mock-org-1',
  name: 'Demo Organization',
  country_code: 'US',
  settings: {},
  features: {
    calling: true,
    events: true,
    imports: true
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export const mockUser: User = {
  id: 'mock-user-1',
  organization_id: mockOrganization.id,
  email: 'demo@example.com',
  full_name: 'Demo User',
  role: 'admin', // Changed to admin for demo
  phone: '+1234567890',
  settings: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export const mockContacts: Contact[] = [
  {
    id: 'contact-1',
    organization_id: mockOrganization.id,
    full_name: 'John Smith',
    phone: '+1 (555) 123-4567',
    email: 'john.smith@example.com',
    tags: ['volunteer', 'donor'],
    custom_fields: {},
    last_contact_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    total_events_attended: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'contact-2',
    organization_id: mockOrganization.id,
    full_name: 'Sarah Johnson',
    phone: '+1 (555) 234-5678',
    email: 'sarah.j@example.com',
    tags: ['volunteer'],
    custom_fields: {},
    last_contact_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    total_events_attended: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'contact-3',
    organization_id: mockOrganization.id,
    full_name: 'Michael Brown',
    phone: '+1 (555) 345-6789',
    tags: ['donor', 'member'],
    custom_fields: {},
    last_contact_date: undefined,
    total_events_attended: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'contact-4',
    organization_id: mockOrganization.id,
    full_name: 'Emily Davis',
    phone: '+1 (555) 456-7890',
    email: 'emily.davis@example.com',
    tags: ['volunteer', 'member'],
    custom_fields: {},
    last_contact_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    total_events_attended: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'contact-5',
    organization_id: mockOrganization.id,
    full_name: 'Robert Wilson',
    phone: '+1 (555) 567-8901',
    tags: ['prospect'],
    custom_fields: {},
    last_contact_date: undefined,
    total_events_attended: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// Mock events
export const mockEvents = [
  {
    id: 'event-1',
    organization_id: mockOrganization.id,
    name: 'Phone Banking Session',
    description: 'Weekly phone banking to reach out to supporters',
    location: 'Virtual - Zoom',
    start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    capacity: 50,
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'event-2',
    organization_id: mockOrganization.id,
    name: 'Community Meeting',
    description: 'Monthly community organizing meeting',
    location: 'Community Center, 123 Main St',
    start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    capacity: 100,
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// Storage keys
const STORAGE_KEYS = {
  USER: 'mock_auth_user',
  CONTACTS: 'mock_contacts',
  CALL_LOGS: 'mock_call_logs',
  EVENTS: 'mock_events'
}

// Mock authentication
export const mockAuth = {
  signIn: async (email: string, password: string) => {
    // In demo mode, accept any email/password
    if (email && password) {
      const user = { ...mockUser, email }
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
      return { data: { user, session: { access_token: 'mock-token' } }, error: null }
    }
    return { data: null, error: new Error('Invalid credentials') }
  },
  
  signOut: async () => {
    localStorage.removeItem(STORAGE_KEYS.USER)
    return { error: null }
  },
  
  getUser: async () => {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER)
    if (userStr) {
      const user = JSON.parse(userStr)
      return { data: { user }, error: null }
    }
    return { data: { user: null }, error: null }
  },
  
  onAuthStateChange: (callback: Function) => {
    // Mock auth state change listener
    const userStr = localStorage.getItem(STORAGE_KEYS.USER)
    if (userStr) {
      callback('SIGNED_IN', { user: JSON.parse(userStr) })
    }
    return {
      data: { subscription: { unsubscribe: () => {} } }
    }
  }
}

// Mock database operations
export const mockDb = {
  contacts: {
    list: async () => {
      const savedContacts = localStorage.getItem(STORAGE_KEYS.CONTACTS)
      const contacts = savedContacts ? JSON.parse(savedContacts) : mockContacts
      return { data: contacts, error: null }
    },
    
    listByUser: async (_userId: string) => {
      // In demo mode, just return all contacts
      const savedContacts = localStorage.getItem(STORAGE_KEYS.CONTACTS)
      const contacts = savedContacts ? JSON.parse(savedContacts) : mockContacts
      return { data: contacts, error: null }
    },
    
    update: async (id: string, updates: Partial<Contact>) => {
      const savedContacts = localStorage.getItem(STORAGE_KEYS.CONTACTS)
      const contacts = savedContacts ? JSON.parse(savedContacts) : mockContacts
      const index = contacts.findIndex((c: Contact) => c.id === id)
      
      if (index > -1) {
        contacts[index] = { ...contacts[index], ...updates }
        localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts))
        return { data: contacts[index], error: null }
      }
      
      return { data: null, error: new Error('Contact not found') }
    }
  },
  
  callLogs: {
    create: async (callLog: Partial<CallLog>) => {
      const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CALL_LOGS) || '[]')
      const newLog = {
        ...callLog,
        id: `call-${Date.now()}`,
        created_at: new Date().toISOString()
      }
      logs.push(newLog)
      localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify(logs))
      
      // Update contact's last contact date
      if (callLog.contact_id) {
        await mockDb.contacts.update(callLog.contact_id, {
          last_contact_date: new Date().toISOString()
        })
      }
      
      return { data: newLog, error: null }
    },
    
    list: async (contactId?: string) => {
      const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CALL_LOGS) || '[]')
      if (contactId) {
        return { data: logs.filter((l: CallLog) => l.contact_id === contactId), error: null }
      }
      return { data: logs, error: null }
    }
  },
  
  events: {
    list: async () => {
      const savedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS)
      const events = savedEvents ? JSON.parse(savedEvents) : mockEvents
      return { data: events, error: null }
    },
    
    get: async (id: string) => {
      const savedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS)
      const events = savedEvents ? JSON.parse(savedEvents) : mockEvents
      const event = events.find((e: any) => e.id === id)
      return { data: event || null, error: event ? null : new Error('Event not found') }
    }
  }
}