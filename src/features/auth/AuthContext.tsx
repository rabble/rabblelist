import { createContext, useContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase, getCurrentUser, isDemoMode } from '@/lib/supabase'
import { mockAuth } from '@/lib/mockData'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    // Check current session
    checkUser()

    if (!isDemoMode) {
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await checkUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [])

  const checkUser = async () => {
    try {
      setLoading(true)
      
      if (isDemoMode) {
        const result = await mockAuth.getUser()
        if (result.data?.user) {
          setUser(result.data.user as User)
        } else {
          setUser(null)
        }
      } else {
        const authUser = await getCurrentUser()
        
        if (authUser) {
          // Get full user data
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()
          
          if (data && !error) {
            setUser(data as User)
          }
        } else {
          setUser(null)
        }
      }
    } catch (error) {
      console.error('Error checking user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      if (isDemoMode) {
        const result = await mockAuth.signIn(email, password)
        if (result.error) throw result.error
        if (result.data?.user) {
          setUser(result.data.user as User)
        }
        return { error: null }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        // User data will be loaded by the auth state change listener
        return { error: null }
      }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      if (isDemoMode) {
        await mockAuth.signOut()
        setUser(null)
      } else {
        await supabase.auth.signOut()
        setUser(null)
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}