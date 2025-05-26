// Re-export database types
export type { 
  Tables, 
  Inserts, 
  Updates,
  Json 
} from '@/lib/database.types'

// Convenience types from database
import type { Tables } from '@/lib/database.types'

export type User = Tables<'users'>
export type Contact = Tables<'contacts'>
export type Organization = Tables<'organizations'>
export type CallLog = Tables<'call_logs'>
export type Event = Tables<'events'>
export type EventParticipant = Tables<'event_participants'>
export type Group = Tables<'groups'>
export type GroupMember = Tables<'group_members'>
export type CallAssignment = Tables<'call_assignments'>
export type Pathway = Tables<'pathways'>
export type ContactPathway = Tables<'contact_pathways'>

// Type aliases for specific fields
export type CallOutcome = CallLog['outcome']
export type EventStatus = EventParticipant['status']
export type UserRole = User['role']

// Auth state
export interface AuthState {
  user: User | null
  loading: boolean
}

// Sync types for offline support
export type SyncAction = 'create' | 'update' | 'delete'

export interface SyncChange {
  id: string
  type: 'contacts' | 'call_logs' | 'event_participants' | 'call_assignments'
  action: SyncAction
  data: any
  timestamp: string
  synced?: boolean
  retries?: number
}

export interface SyncQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  table: string
  recordId?: string
  data?: any
  retries: number
  created_at: string
}

// Form types
export interface ContactFormData {
  full_name: string
  phone: string
  email?: string
  address?: string
  tags?: string[]
  custom_fields?: Record<string, any>
}

export interface EventFormData {
  name: string
  description?: string
  location?: string
  start_time: string
  end_time?: string
  capacity?: number
}

export interface CallLogFormData {
  contact_id: string
  outcome: CallOutcome
  notes?: string
  duration_seconds?: number
}

export interface CallOutcomeForm {
  outcome: CallOutcome
  notes?: string
}

// Import types
export interface ContactImportRow {
  full_name: string
  phone: string
  email?: string
  address?: string
  tags?: string | string[]
  [key: string]: any
}

// Filter and search types
export interface ContactFilters {
  search?: string
  tags?: string[]
  hasPhone?: boolean
  hasEmail?: boolean
  lastContactBefore?: Date
  lastContactAfter?: Date
}

export interface EventFilters {
  search?: string
  startAfter?: Date
  startBefore?: Date
  hasCapacity?: boolean
}

// Queue types
export interface CallQueueItem extends Contact {
  priority?: number
  assigned_at?: string
}

// Stats types
export interface DashboardStats {
  totalContacts: number
  contactsCalledToday: number
  upcomingEvents: number
  activeRingers: number
}

export interface CallStats {
  totalCalls: number
  answered: number
  voicemail: number
  noAnswer: number
  avgCallsPerDay: number
}

// Settings types
export interface OrganizationSettings {
  timezone?: string
  calling_hours?: {
    start: string
    end: string
  }
  custom_fields?: Array<{
    name: string
    type: 'text' | 'number' | 'date' | 'select'
    options?: string[]
    required?: boolean
  }>
}

export interface UserSettings {
  notifications?: {
    email?: boolean
    push?: boolean
    sms?: boolean
  }
  display?: {
    contacts_per_page?: number
    theme?: 'light' | 'dark' | 'system'
  }
}

// Pathway types
export interface PathwayStep {
  id: number
  name: string
  description?: string
  requirements?: any[]
}

// Extended types with relations
export interface ContactWithCallHistory extends Contact {
  recent_calls?: CallLog[]
}

export interface EventWithParticipants extends Event {
  participants?: EventParticipant[]
  participant_count?: number
}

export interface GroupWithMembers extends Group {
  members?: GroupMember[]
  member_count?: number
}

// UI State types
export interface LoadingState {
  isLoading: boolean
  error?: Error | null
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

