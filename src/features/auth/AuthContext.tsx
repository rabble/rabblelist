import { createContext, useContext, useState } from 'react'
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

// Simple auth provider that always returns a demo user
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always authenticated with demo user
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

  const value = {
    user: mockUser,
    profile: mockProfile,
    organization: mockOrg,
    session: {} as any,
    loading: false,
    signIn: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signOut: async () => {},
    resetPassword: async () => ({ error: null }),
    updatePassword: async () => ({ error: null }),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}