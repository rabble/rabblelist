import type { User, Contact, Organization, CallLog, Event, Group } from '@/types'

export const mockOrganization: Organization = {
  id: 'mock-org-1',
  name: 'Demo Organization',
  country_code: 'US',
  settings: {
    timezone: 'America/New_York',
    calling_hours: {
      start: '09:00',
      end: '20:00'
    }
  },
  features: {},
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
  last_active: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export const mockContacts: Contact[] = [
  {
    id: 'contact-1',
    organization_id: mockOrganization.id,
    external_id: null,
    full_name: 'John Smith',
    phone: '+1 (555) 123-4567',
    email: 'john.smith@example.com',
    address: '123 Main St, City, State 12345',
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
    external_id: null,
    full_name: 'Sarah Johnson',
    phone: '+1 (555) 234-5678',
    email: 'sarah.j@example.com',
    address: '456 Oak Ave, Town, State 54321',
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
    external_id: null,
    full_name: 'Michael Brown',
    phone: '+1 (555) 345-6789',
    email: null,
    address: null,
    tags: ['donor', 'member'],
    custom_fields: {},
    last_contact_date: null,
    total_events_attended: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'contact-4',
    organization_id: mockOrganization.id,
    external_id: null,
    full_name: 'Emily Davis',
    phone: '+1 (555) 456-7890',
    email: 'emily.d@example.com',
    address: '789 Elm St, Village, State 67890',
    tags: ['prospect'],
    custom_fields: {},
    last_contact_date: null,
    total_events_attended: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const mockCallLogs: CallLog[] = [
  {
    id: 'call-1',
    organization_id: mockOrganization.id,
    contact_id: 'contact-1',
    ringer_id: mockUser.id,
    outcome: 'answered',
    notes: 'Great conversation! They are interested in volunteering next weekend.',
    duration_seconds: 245,
    tags: ['follow-up'],
    called_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'call-2',
    organization_id: mockOrganization.id,
    contact_id: 'contact-2',
    ringer_id: mockUser.id,
    outcome: 'voicemail',
    notes: 'Left message about upcoming event',
    duration_seconds: null,
    tags: [],
    called_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
]

export const mockEvents: Event[] = [
  {
    id: 'event-1',
    organization_id: mockOrganization.id,
    name: 'Community Cleanup Day',
    description: 'Join us for our monthly community cleanup event!',
    location: 'Central Park',
    start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    capacity: 50,
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'event-2',
    organization_id: mockOrganization.id,
    name: 'Fundraising Gala',
    description: 'Annual fundraising gala to support our programs',
    location: 'Grand Hotel Ballroom',
    start_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    capacity: 200,
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const mockGroups: Group[] = [
  {
    id: 'group-1',
    organization_id: mockOrganization.id,
    name: 'Downtown Volunteers',
    description: 'Volunteers living in the downtown area',
    parent_id: null,
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'group-2',
    organization_id: mockOrganization.id,
    name: 'Major Donors',
    description: 'Donors who have contributed $1000+',
    parent_id: null,
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]