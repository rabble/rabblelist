import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

console.log("[DEBUG] Supabase Client: Initializing...")
console.log("[DEBUG] Supabase Client: URL found:", !!supabaseUrl, "Key found:", !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Please create a .env.local file with:')
  console.error('VITE_SUPABASE_URL=your-supabase-url')
  console.error('VITE_SUPABASE_ANON_KEY=your-supabase-anon-key')
}

const clientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
  }
}

console.log("[DEBUG] Supabase Client: Using options:", clientOptions)

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  clientOptions
)

console.log("[DEBUG] Supabase Client: Client created.")

// Auth helpers
export const getCurrentUser = async () => {
  console.log("[DEBUG] Supabase getCurrentUser: Attempting to get user.")
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    console.log("[DEBUG] Supabase getCurrentUser: No user found or error occurred", { error })
    return null
  }
  console.log("[DEBUG] Supabase getCurrentUser: User found", user)
  return user
}

export const signIn = async (email: string, password: string) => {
  console.log("[DEBUG] Supabase signIn: Attempting to sign in with email:", email)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  console.log("[DEBUG] Supabase signIn: Response received", { data, error })
  return { data, error }
}

export const signOut = async () => {
  console.log("[DEBUG] Supabase signOut: Attempting to sign out.")
  const { error } = await supabase.auth.signOut()
  console.log("[DEBUG] Supabase signOut: Response received", { error })
  return { error }
}

// RLS helpers
export const getOrganizationId = async (): Promise<string | null> => {
  console.log("[DEBUG] Supabase getOrganizationId: Attempting to get organization ID.")
  const user = await getCurrentUser()
  if (!user) {
    console.log("[DEBUG] Supabase getOrganizationId: No user found, cannot get organization ID.")
    return null
  }
  console.log("[DEBUG] Supabase getOrganizationId: User found, fetching organization_id for user ID:", user.id)
  const { data, error } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  
  if (error || !data) return null
  return data.organization_id
}