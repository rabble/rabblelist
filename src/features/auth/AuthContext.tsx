import { createContext, useContext, useState, useEffect } from 'react'
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

// Mock auth provider with actual state management
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session in localStorage
  useEffect(() => {
    const storedSession = localStorage.getItem('mock_session')
    if (storedSession) {
      const mockUser = {
        id: 'demo-user',
        email: 'demo@example.com',
        role: 'admin'
      } as any

      const mockProfile = {
        id: 'demo-user',
        email: 'demo@example.com',
        full_name: 'Demo User',
        organization_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        role: 'admin',
        settings: {},
        phone: null,
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as User

      const mockOrg = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Demo Organization',
        country_code: 'US',
        settings: {},
        features: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Organization

      setUser(mockUser)
      setProfile(mockProfile)
      setOrganization(mockOrg)
      setSession({} as any)
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Accept demo@example.com with demo123, or any other email/password
    if ((email === 'demo@example.com' && password === 'demo123') || email) {
      const mockUser = {
        id: 'demo-user',
        email: email || 'demo@example.com',
        role: 'admin'
      } as any

      const mockProfile = {
        id: 'demo-user',
        email: email || 'demo@example.com',
        full_name: 'Demo User',
        organization_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        role: 'admin',
        settings: {},
        phone: null,
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as User

      const mockOrg = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Demo Organization',
        country_code: 'US',
        settings: {},
        features: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Organization

      setUser(mockUser)
      setProfile(mockProfile)
      setOrganization(mockOrg)
      setSession({} as any)
      
      // Store session in localStorage
      localStorage.setItem('mock_session', 'true')
      
      return { error: null }
    }
    
    return { error: new Error('Invalid credentials') }
  }

  const signUp = async (email: string, password: string, _fullName: string) => {
    // For demo, just sign them in
    return signIn(email, password)
  }

  const signOut = async () => {
    setUser(null)
    setProfile(null)
    setOrganization(null)
    setSession(null)
    localStorage.removeItem('mock_session')
  }

  const resetPassword = async (_email: string) => {
    // Mock implementation
    return { error: null }
  }

  const updatePassword = async (_newPassword: string) => {
    // Mock implementation
    return { error: null }
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