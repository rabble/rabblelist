// Core type definitions for the application

export type UserRole = 'admin' | 'ringer' | 'viewer'
export type CallOutcome = 'answered' | 'voicemail' | 'no_answer' | 'wrong_number' | 'disconnected'
export type ParticipantStatus = 'registered' | 'attended' | 'no_show' | 'cancelled'

export interface Organization {
  id: string
  name: string
  country_code: string
  settings: Record<string, any>
  features: Record<string, boolean>
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  organization_id: string
  email: string
  full_name: string
  name?: string // Alias for full_name
  role: UserRole
  phone?: string
  settings: Record<string, any>
  last_active?: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  organization_id: string
  external_id?: string
  full_name: string
  phone: string
  email?: string
  address?: string
  notes?: string
  tags: string[]
  custom_fields: Record<string, any>
  last_contact_date?: string
  total_events_attended: number
  created_at: string
  updated_at: string
}

export interface CallLog {
  id: string
  organization_id: string
  contact_id: string
  ringer_id: string
  outcome: CallOutcome
  notes?: string
  duration_seconds?: number
  tags: string[]
  called_at: string
  created_at: string
}

export interface Event {
  id: string
  organization_id: string
  name: string
  description?: string
  location?: string
  start_time: string
  end_time?: string
  capacity?: number
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface EventParticipant {
  id: string
  event_id: string
  contact_id: string
  status: ParticipantStatus
  checked_in_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CallAssignment {
  id: string
  organization_id: string
  ringer_id: string
  contact_id: string
  assigned_at: string
  completed_at?: string
  priority: number
}

// Form types
export interface CallOutcomeForm {
  outcome: CallOutcome
  notes?: string
}

export interface ContactImportRow {
  full_name: string
  phone: string
  email?: string
  address?: string
  tags?: string
  [key: string]: any
}

// Sync types
export interface SyncQueueItem {
  id: string
  type: 'call_log' | 'contact_update' | 'event_checkin'
  action: 'create' | 'update' | 'delete'
  data: any
  retries: number
  created_at: string
}