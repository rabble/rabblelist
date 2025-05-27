export interface Contact {
  id: string
  organization_id: string
  external_id?: string | null
  full_name: string
  first_name?: string
  last_name?: string
  phone: string
  email?: string | null
  address?: string | null
  tags: string[]
  custom_fields: any
  last_contact_date?: string | null
  total_events_attended: number
  created_at: string
  updated_at: string
}