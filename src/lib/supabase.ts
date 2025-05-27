import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Please create a .env.local file with:')
  console.error('VITE_SUPABASE_URL=your-supabase-url')
  console.error('VITE_SUPABASE_ANON_KEY=your-supabase-anon-key')
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    }
  }
)

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return null
  }
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
  if (!user) {
    return null
  }
  const { data, error } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  
  if (error || !data) return null
  return data.organization_id
}