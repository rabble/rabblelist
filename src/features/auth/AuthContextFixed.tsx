import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import type { User, Organization } from '@/types'

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
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    
    // Initialize auth
    const initAuth = async () => {
      try {
        console.log('🔍 AuthContextFixed: Starting initialization')
        
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (initialSession?.user) {
          console.log('🔍 AuthContextFixed: Found existing session')
          setSession(initialSession)
          setUser(initialSession.user)
          
          // Try to load profile, but don't block on it
          try {
            const { data: profileData } = await supabase
              .from('users')
              .select('*')
              .eq('id', initialSession.user.id)
              .single()
              
            if (profileData) {
              setProfile(profileData)
              
              // Try to load organization
              if (profileData.organization_id) {
                const { data: orgData } = await supabase
                  .from('organizations')
                  .select('*')
                  .eq('id', profileData.organization_id)
                  .single()
                  
                if (orgData) {
                  setOrganization(orgData)
                }
              }
            }
          } catch (error) {
            console.warn('🔍 AuthContextFixed: Could not load profile/org:', error)
            // Create a default profile
            setProfile({
              id: initialSession.user.id,
              email: initialSession.user.email || 'user@example.com',
              full_name: 'User',
              organization_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
              role: 'ringer',
              settings: {},
              phone: null,
              last_active: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as any)
          }
        }
        
        console.log('🔍 AuthContextFixed: Initialization complete')
      } catch (error) {
        console.error('🔍 AuthContextFixed: Initialization error:', error)
      } finally {
        // ALWAYS set loading to false
        if (mounted.current) {
          setLoading(false)
        }
      }
    }

    // Start initialization
    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔍 AuthContextFixed: Auth state changed:', event)
      
      if (!mounted.current) return
      
      setSession(newSession)
      setUser(newSession?.user ?? null)
      
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setOrganization(null)
      } else if (newSession?.user && event === 'SIGNED_IN') {
        // Load profile for new sign in
        try {
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', newSession.user.id)
            .single()
            
          if (profileData) {
            setProfile(profileData)
            
            if (profileData.organization_id) {
              const { data: orgData } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', profileData.organization_id)
                .single()
                
              if (orgData) {
                setOrganization(orgData)
              }
            }
          }
        } catch (error) {
          console.warn('🔍 AuthContextFixed: Could not load profile on sign in:', error)
        }
      }
    })

    // Cleanup
    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) return { error }
      if (!data.user) return { error: new Error('User creation failed') }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role: 'ringer',
        })

      if (profileError) return { error: profileError }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      return { error }
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