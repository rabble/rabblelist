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
  const [isInitialized, setIsInitialized] = useState(false)

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
      setIsInitialized(true)
      return
    }
    
    let mounted = true
    
    // Check active sessions
    console.log('AuthContext: Checking for existing session...')
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          setIsInitialized(true)
          return
        }
        
        console.log('AuthContext: Session found:', !!session)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('AuthContext: Loading user data for:', session.user.id)
          await loadUserData(session.user.id)
        }
        
        if (mounted) {
          console.log('AuthContext: Initial load complete')
          setLoading(false)
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error)
        if (mounted) {
          setLoading(false)
          setIsInitialized(true)
        }
      }
    }
    
    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed:', event, !!session)
      
      if (!mounted) return
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        setLoading(true)
        await loadUserData(session.user.id)
        if (mounted) {
          setLoading(false)
        }
      } else {
        setProfile(null)
        setOrganization(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
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
    console.log('AuthContext.signUp called with:', { email, fullName, organizationName })
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

      console.log('Auth signup result:', { authData, authError })
      if (authError || !authData.user) return { error: authError }

      // Create or find organization
      let orgId: string

      if (organizationName) {
        // Create new organization
        console.log('Creating new organization:', organizationName)
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

        console.log('Organization creation result:', { orgData, orgError })
        if (orgError || !orgData) return { error: orgError }
        orgId = orgData.id
      } else {
        // For now, assign to the demo organization if no org specified
        // In production, this would be handled differently
        console.log('Looking for existing organization')
        const { data: orgs, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single()
        
        console.log('Organization lookup result:', { orgs, orgError })
        if (orgError || !orgs) return { error: orgError || new Error('No organization available') }
        orgId = orgs.id
      }

      // Create user profile
      console.log('Creating user profile with orgId:', orgId)
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          organization_id: orgId,
          role: organizationName ? 'admin' : 'ringer', // Admin if creating new org
          settings: {},
        })
        .select()

      console.log('Profile creation result:', { profileData, profileError })
      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        // For now, just return the error
        return { error: profileError }
      }

      // In development, we can try to sign in immediately
      // In production with email confirmation required, this might fail
      console.log('Attempting auto sign-in after signup...')
      
      // Small delay to ensure the user is created in the auth system
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        console.log('Auto sign-in not available (email confirmation may be required):', signInError.message)
        // Return success anyway - the signup itself was successful
        // User will need to confirm email and then sign in manually
      } else {
        console.log('Auto sign-in successful!')
        // The auth state change listener will handle updating the state
      }

      return { error: null }
    } catch (error) {
      console.error('Unexpected error in signUp:', error)
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
    loading: !isInitialized || loading,
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