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
      user_organizations: {
        Row: {
          user_id: string
          organization_id: string
          role: 'admin' | 'ringer' | 'viewer'
          joined_at: string
          invited_by: string | null
          is_primary: boolean
        }
        Insert: {
          user_id: string
          organization_id: string
          role: 'admin' | 'ringer' | 'viewer'
          joined_at?: string
          invited_by?: string | null
          is_primary?: boolean
        }
        Update: {
          user_id?: string
          organization_id?: string
          role?: 'admin' | 'ringer' | 'viewer'
          joined_at?: string
          invited_by?: string | null
          is_primary?: boolean
        }
      }
      webhook_configs: {
        Row: {
          id: string
          organization_id: string
          url: string
          events: string[]
          active: boolean
          secret: string
          description: string | null
          headers: Json
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          url: string
          events: string[]
          active?: boolean
          secret: string
          description?: string | null
          headers?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          url?: string
          events?: string[]
          active?: boolean
          secret?: string
          description?: string | null
          headers?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      webhook_events: {
        Row: {
          id: string
          webhook_config_id: string
          event_type: string
          payload: Json
          status: 'pending' | 'success' | 'failed'
          attempts: number
          next_retry_at: string | null
          last_error: string | null
          response_status: number | null
          response_body: string | null
          delivered_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          webhook_config_id: string
          event_type: string
          payload: Json
          status?: 'pending' | 'success' | 'failed'
          attempts?: number
          next_retry_at?: string | null
          last_error?: string | null
          response_status?: number | null
          response_body?: string | null
          delivered_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          webhook_config_id?: string
          event_type?: string
          payload?: Json
          status?: 'pending' | 'success' | 'failed'
          attempts?: number
          next_retry_at?: string | null
          last_error?: string | null
          response_status?: number | null
          response_body?: string | null
          delivered_at?: string | null
          created_at?: string
        }
      }
      webhook_delivery_attempts: {
        Row: {
          id: string
          webhook_event_id: string
          attempt_number: number
          status_code: number | null
          response_body: string | null
          error_message: string | null
          duration_ms: number | null
          attempted_at: string
        }
        Insert: {
          id?: string
          webhook_event_id: string
          attempt_number: number
          status_code?: number | null
          response_body?: string | null
          error_message?: string | null
          duration_ms?: number | null
          attempted_at?: string
        }
        Update: {
          id?: string
          webhook_event_id?: string
          attempt_number?: number
          status_code?: number | null
          response_body?: string | null
          error_message?: string | null
          duration_ms?: number | null
          attempted_at?: string
        }
      }
      organization_api_keys: {
        Row: {
          id: string
          organization_id: string
          service_name: 'twilio' | 'sendgrid' | 'openai' | 'stripe'
          key_name: string
          encrypted_value: string
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          last_rotated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          service_name: 'twilio' | 'sendgrid' | 'openai' | 'stripe'
          key_name: string
          encrypted_value: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_rotated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          service_name?: 'twilio' | 'sendgrid' | 'openai' | 'stripe'
          key_name?: string
          encrypted_value?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_rotated_at?: string | null
        }
      }
      organization_subscriptions: {
        Row: {
          id: string
          organization_id: string
          plan_type: 'free' | 'basic' | 'pro' | 'enterprise'
          status: 'active' | 'past_due' | 'canceled' | 'trialing'
          current_period_start: string | null
          current_period_end: string | null
          trial_end: string | null
          cancel_at: string | null
          canceled_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          plan_type?: 'free' | 'basic' | 'pro' | 'enterprise'
          status?: 'active' | 'past_due' | 'canceled' | 'trialing'
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          plan_type?: 'free' | 'basic' | 'pro' | 'enterprise'
          status?: 'active' | 'past_due' | 'canceled' | 'trialing'
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organization_api_usage: {
        Row: {
          id: string
          organization_id: string
          service_name: string
          action_type: string
          count: number
          cost_cents: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          service_name: string
          action_type: string
          count?: number
          cost_cents?: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          service_name?: string
          action_type?: string
          count?: number
          cost_cents?: number
          metadata?: Json
          created_at?: string
        }
      }
      rate_limit_rules: {
        Row: {
          id: string
          plan_type: string
          service_name: string
          action_type: string
          limit_value: number
          window_seconds: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_type: string
          service_name: string
          action_type: string
          limit_value: number
          window_seconds: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_type?: string
          service_name?: string
          action_type?: string
          limit_value?: number
          window_seconds?: number
          created_at?: string
          updated_at?: string
        }
      }
      organization_api_key_audit: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          action: 'created' | 'updated' | 'deleted' | 'rotated' | 'accessed'
          service_name: string
          key_name: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          action: 'created' | 'updated' | 'deleted' | 'rotated' | 'accessed'
          service_name: string
          key_name: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          action?: 'created' | 'updated' | 'deleted' | 'rotated' | 'accessed'
          service_name?: string
          key_name?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
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
      get_user_current_organization: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      switch_organization: {
        Args: { target_org_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_organization_id: string
          p_service_name: string
          p_action_type: string
        }
        Returns: {
          allowed: boolean
          current_usage: number
          limit_value: number
          window_seconds: number
          reset_at: string
        }[]
      }
      track_api_usage: {
        Args: {
          p_organization_id: string
          p_service_name: string
          p_action_type: string
          p_count?: number
          p_cost_cents?: number
          p_metadata?: Json
        }
        Returns: string
      }
    }
    Enums: {}
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']