import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import type { Tables } from '@/lib/database.types'

type UserProfile = Tables<'users'>

interface AuthContextType {
  user: SupabaseUser | null
  profile: UserProfile | null
  organization: Tables<'organizations'> | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string, organizationName?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [organization, setOrganization] = useState<Tables<'organizations'> | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user profile and organization
  const loadUserData = async (userId: string) => {
    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        // If profile doesn't exist, the user might not be fully set up
        // This shouldn't prevent the app from loading
        setProfile(null)
      } else {
        setProfile(profileData)
      }

      // Get organization - only if we successfully loaded a profile
      if (!profileError && profileData?.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .single()

        if (orgError) {
          console.error('Error loading organization:', orgError)
          setOrganization(null)
        } else {
          setOrganization(orgData)
        }
      }

      // Update last active
      await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', userId)
    } catch (error) {
      console.error('Error in loadUserData:', error)
    }
  }

  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase is not configured! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file')
      setLoading(false)
      return
    }
    
    // Check active sessions
    console.log('AuthContext: Checking for existing session...')
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        return
      }
      
      console.log('AuthContext: Session found:', !!session)
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('AuthContext: Loading user data for:', session.user.id)
        await loadUserData(session.user.id)
      }
      
      console.log('AuthContext: Initial load complete, setting loading to false')
      setLoading(false)
    }).catch((error) => {
      console.error('Error in getSession:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await loadUserData(session.user.id)
      } else {
        setProfile(null)
        setOrganization(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) return { error }

      // Load user data after successful login
      if (data.user) {
        await loadUserData(data.user.id)
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, organizationName?: string) => {
    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (authError || !authData.user) return { error: authError }

      // Create or find organization
      let orgId: string

      if (organizationName) {
        // Create new organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: organizationName,
            country_code: 'US', // Default, should be configurable
            settings: {},
            features: {
              calling: true,
              events: true,
              imports: true,
              groups: true,
              pathways: true
            }
          })
          .select()
          .single()

        if (orgError || !orgData) return { error: orgError }
        orgId = orgData.id
      } else {
        // For now, assign to the demo organization if no org specified
        // In production, this would be handled differently
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single()
        
        if (!orgs) return { error: new Error('No organization available') }
        orgId = orgs.id
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          organization_id: orgId,
          role: organizationName ? 'admin' : 'ringer', // Admin if creating new org
          settings: {},
        })

      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        // For now, just return the error
        return { error: profileError }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    // Clear all local storage
    localStorage.clear()
    
    // Clear all session storage
    sessionStorage.clear()
    
    // Clear IndexedDB data if it exists
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases()
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name)
          }
        })
      } catch (e) {
        // Some browsers don't support indexedDB.databases()
        // Try to delete known databases
        try {
          indexedDB.deleteDatabase('contact-manager-db')
        } catch (err) {
          console.error('Error clearing IndexedDB:', err)
        }
      }
    }
    
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Clear state
    setUser(null)
    setProfile(null)
    setOrganization(null)
    setSession(null)
    
    // Clear any cached data in service worker
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') }

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) return { error }

      setProfile(data)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const value = {
    user,
    profile,
    organization,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}