export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          country_code: string
          settings: Json
          features: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          country_code: string
          settings?: Json
          features?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          country_code?: string
          settings?: Json
          features?: Json
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          organization_id: string
          email: string
          full_name: string
          role: 'admin' | 'ringer' | 'viewer'
          phone: string | null
          settings: Json
          last_active: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          email: string
          full_name: string
          role?: 'admin' | 'ringer' | 'viewer'
          phone?: string | null
          settings?: Json
          last_active?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'ringer' | 'viewer'
          phone?: string | null
          settings?: Json
          last_active?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          organization_id: string
          external_id: string | null
          full_name: string
          phone: string
          email: string | null
          address: string | null
          tags: string[]
          custom_fields: Json
          last_contact_date: string | null
          total_events_attended: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          external_id?: string | null
          full_name: string
          phone: string
          email?: string | null
          address?: string | null
          tags?: string[]
          custom_fields?: Json
          last_contact_date?: string | null
          total_events_attended?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          external_id?: string | null
          full_name?: string
          phone?: string
          email?: string | null
          address?: string | null
          tags?: string[]
          custom_fields?: Json
          last_contact_date?: string | null
          total_events_attended?: number
          created_at?: string
          updated_at?: string
        }
      }
      call_logs: {
        Row: {
          id: string
          organization_id: string
          contact_id: string
          ringer_id: string
          outcome: 'answered' | 'voicemail' | 'no_answer' | 'wrong_number' | 'disconnected'
          notes: string | null
          duration_seconds: number | null
          tags: string[]
          called_at: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          contact_id: string
          ringer_id: string
          outcome: 'answered' | 'voicemail' | 'no_answer' | 'wrong_number' | 'disconnected'
          notes?: string | null
          duration_seconds?: number | null
          tags?: string[]
          called_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          contact_id?: string
          ringer_id?: string
          outcome?: 'answered' | 'voicemail' | 'no_answer' | 'wrong_number' | 'disconnected'
          notes?: string | null
          duration_seconds?: number | null
          tags?: string[]
          called_at?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          location: string | null
          start_time: string
          end_time: string | null
          capacity: number | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          location?: string | null
          start_time: string
          end_time?: string | null
          capacity?: number | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          location?: string | null
          start_time?: string
          end_time?: string | null
          capacity?: number | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      event_participants: {
        Row: {
          id: string
          event_id: string
          contact_id: string
          status: 'registered' | 'attended' | 'no_show' | 'cancelled'
          checked_in_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          contact_id: string
          status?: 'registered' | 'attended' | 'no_show' | 'cancelled'
          checked_in_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          contact_id?: string
          status?: 'registered' | 'attended' | 'no_show' | 'cancelled'
          checked_in_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      call_assignments: {
        Row: {
          id: string
          organization_id: string
          ringer_id: string
          contact_id: string
          assigned_at: string
          completed_at: string | null
          priority: number
        }
        Insert: {
          id?: string
          organization_id: string
          ringer_id: string
          contact_id: string
          assigned_at?: string
          completed_at?: string | null
          priority?: number
        }
        Update: {
          id?: string
          organization_id?: string
          ringer_id?: string
          contact_id?: string
          assigned_at?: string
          completed_at?: string | null
          priority?: number
        }
      }
      groups: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          parent_id: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          parent_id?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          contact_id: string
          role: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          contact_id: string
          role?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          contact_id?: string
          role?: string | null
          joined_at?: string
        }
      }
      pathways: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          steps: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          steps?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          steps?: Json
          created_at?: string
          updated_at?: string
        }
      }
      contact_pathways: {
        Row: {
          id: string
          contact_id: string
          pathway_id: string
          current_step: number
          completed_steps: Json
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          contact_id: string
          pathway_id: string
          current_step?: number
          completed_steps?: Json
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          contact_id?: string
          pathway_id?: string
          current_step?: number
          completed_steps?: Json
          started_at?: string
          completed_at?: string | null
        }
      }
    }
    Views: {}
    Functions: {
      organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {}
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']