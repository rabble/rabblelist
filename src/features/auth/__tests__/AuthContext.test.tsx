import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis()
    }))
  }
}))

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}))

describe('AuthContext', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: '',
    created_at: '',
    confirmed_at: '',
    email_confirmed_at: '',
    phone: '',
    last_sign_in_at: '',
    role: '',
    updated_at: ''
  }

  const mockSession: Session = {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
    expires_at: Date.now() + 3600
  }

  const mockProfile = {
    id: 'test-user-id',
    email: 'test@example.com',
    full_name: 'Test User',
    organization_id: 'test-org-id',
    role: 'ringer' as const,
    settings: {},
    last_active: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const mockOrganization = {
    id: 'test-org-id',
    name: 'Test Organization',
    country_code: 'US',
    settings: {},
    features: {
      calling: true,
      events: true,
      imports: true,
      groups: true,
      pathways: true
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should initialize with loading true and null values', async () => {
    // Mock no existing session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    // Initially loading should be true
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
    expect(result.current.organization).toBeNull()
    expect(result.current.session).toBeNull()

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('should load existing session and user data on mount', async () => {
    // Mock existing session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    // Mock profile fetch
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockImplementation((table) => {
      const chainMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        update: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis()
      }

      if (table === 'users') {
        chainMock.single.mockResolvedValue({ data: mockProfile, error: null })
      } else if (table === 'organizations') {
        chainMock.single.mockResolvedValue({ data: mockOrganization, error: null })
      }

      return chainMock as any
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.session).toEqual(mockSession)
    expect(result.current.profile).toEqual(mockProfile)
    expect(result.current.organization).toEqual(mockOrganization)
  })

  it('should handle session load errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock session error
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: new Error('Session error')
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting session:', new Error('Session error'))

    consoleErrorSpy.mockRestore()
  })

  it('should handle missing Supabase configuration', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    // Mock env vars to be empty
    const originalUrl = import.meta.env.VITE_SUPABASE_URL
    const originalKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    Object.defineProperty(import.meta.env, 'VITE_SUPABASE_URL', {
      value: '',
      configurable: true
    })
    Object.defineProperty(import.meta.env, 'VITE_SUPABASE_ANON_KEY', {
      value: '',
      configurable: true
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Supabase is not configured! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file'
    )

    // Restore env vars
    Object.defineProperty(import.meta.env, 'VITE_SUPABASE_URL', {
      value: originalUrl,
      configurable: true
    })
    Object.defineProperty(import.meta.env, 'VITE_SUPABASE_ANON_KEY', {
      value: originalKey,
      configurable: true
    })
    
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  it('should handle profile loading errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock existing session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    // Mock profile fetch error
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockImplementation((table) => {
      const chainMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        update: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis()
      }

      if (table === 'users') {
        chainMock.single.mockResolvedValue({ 
          data: null, 
          error: new Error('Profile not found') 
        })
      }

      return chainMock as any
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.profile).toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading profile:', new Error('Profile not found'))

    consoleErrorSpy.mockRestore()
  })

  it('should sign in successfully', async () => {
    // Start with no session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Mock successful sign in
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    })

    // Mock profile fetch after sign in
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockImplementation((table) => {
      const chainMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        update: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis()
      }

      if (table === 'users') {
        chainMock.single.mockResolvedValue({ data: mockProfile, error: null })
      } else if (table === 'organizations') {
        chainMock.single.mockResolvedValue({ data: mockOrganization, error: null })
      }

      return chainMock as any
    })

    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'password')
      expect(response.error).toBeNull()
    })

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    })
  })

  it('should handle sign in errors', async () => {
    // Start with no session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Mock sign in error
    const signInError = new Error('Invalid credentials')
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: signInError
    })

    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'wrong-password')
      expect(response.error).toEqual(signInError)
    })
  })

  it('should sign out and clear all data', async () => {
    // Start with a session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    // Mock localStorage, sessionStorage, and indexedDB
    const localStorageClearSpy = vi.spyOn(Storage.prototype, 'clear')
    const deleteDbSpy = vi.fn()
    ;(global as any).indexedDB = {
      databases: vi.fn().mockResolvedValue([{ name: 'test-db' }]),
      deleteDatabase: deleteDbSpy
    }
    ;(global as any).caches = {
      keys: vi.fn().mockResolvedValue(['test-cache']),
      delete: vi.fn()
    }

    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.signOut()
    })

    expect(localStorageClearSpy).toHaveBeenCalledTimes(2) // localStorage and sessionStorage
    expect(deleteDbSpy).toHaveBeenCalledWith('test-db')
    expect(supabase.auth.signOut).toHaveBeenCalled()

    localStorageClearSpy.mockRestore()
  })
})