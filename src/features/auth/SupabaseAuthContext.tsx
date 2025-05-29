import { createContext, useContext, useState, useEffect } from 'react'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import type { User, Organization } from '@/types'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: SupabaseUser | null
  profile: User | null
  organization: Organization | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load user profile and organization
  const loadUserProfile = async (userId: string, abortSignal?: AbortSignal) => {
    try {
      // Check if request was aborted
      if (abortSignal?.aborted) return false

      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (abortSignal?.aborted) return false

      if (profileError) {
        console.error('Error loading user profile:', profileError)
        // Clear profile if it doesn't exist
        setProfile(null)
        setOrganization(null)
        return false
      }

      setProfile(userProfile)

      // Get user's organization
      if (userProfile?.organization_id) {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userProfile.organization_id)
          .single()

        if (abortSignal?.aborted) return false

        if (orgError) {
          console.error('Error loading organization:', orgError)
          setOrganization(null)
          return false
        }

        setOrganization(org)
      } else {
        setOrganization(null)
      }
      
      return true
    } catch (error) {
      console.error('Error in loadUserProfile:', error)
      setProfile(null)
      setOrganization(null)
      return false
    }
  }

  // Check for existing session
  useEffect(() => {
    const abortController = new AbortController()
    let mounted = true

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted || abortController.signal.aborted) return
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          setIsInitialized(true)
          return
        }

        if (session) {
          setSession(session)
          setUser(session.user)
          await loadUserProfile(session.user.id, abortController.signal)
        } else {
          // Explicitly clear all auth state when no session
          setSession(null)
          setUser(null)
          setProfile(null)
          setOrganization(null)
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          setIsInitialized(true)
        }
      }
    }

    checkSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || abortController.signal.aborted) return
      
      console.log('Auth state changed:', event, session?.user?.email)
      
      // Don't set loading on auth state changes after initial load
      if (isInitialized) {
        if (session) {
          setSession(session)
          setUser(session.user)
          await loadUserProfile(session.user.id, abortController.signal)
        } else {
          // Clear all state when signed out
          setSession(null)
          setUser(null)
          setProfile(null)
          setOrganization(null)
        }
      }
    })

    return () => {
      mounted = false
      abortController.abort()
      subscription.unsubscribe()
    }
  }, [isInitialized])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', error)
        return { error }
      }

      // The auth state change handler will take care of loading the profile
      // We don't need to do it here
      return { error: null }
    } catch (error) {
      console.error('Unexpected sign in error:', error)
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        return { error }
      }

      // Note: User will need to confirm email before they can sign in
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null)
      setProfile(null)
      setOrganization(null)
      setSession(null)
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        // Even if signOut fails, keep local state cleared
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Ensure state is cleared even on error
      setUser(null)
      setProfile(null)
      setOrganization(null)
      setSession(null)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return { error }
      }

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
    resetPassword,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}