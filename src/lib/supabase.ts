import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if we're in demo mode - only if URL is not a real Supabase URL
export const isDemoMode = !supabaseUrl || supabaseUrl.includes('example') || !supabaseAnonKey || supabaseAnonKey === 'mock-anon-key' || supabaseUrl === 'https://example.supabase.co'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables - running in demo mode')
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'mock-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: window.localStorage,
    }
  }
)

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// RLS helpers
export const getOrganizationId = async (): Promise<string | null> => {
  const user = await getCurrentUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  
  if (error || !data) return null
  return data.organization_id
}