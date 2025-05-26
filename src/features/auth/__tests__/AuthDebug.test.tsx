import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'
import { supabase } from '@/lib/supabase'

// This test file is specifically for debugging the loading issue

// Don't mock Supabase completely - let's see what actually happens
vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    from: vi.fn()
  }
  
  return { supabase: mockSupabase }
})

describe('AuthContext Debug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should debug the loading state flow', async () => {
    const consoleLogs: string[] = []
    const consoleErrors: string[] = []
    
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      consoleLogs.push(args.join(' '))
    })
    
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      consoleErrors.push(args.join(' '))
    })

    // Simulate what happens when there's no session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    // Check initial state
    expect(result.current.loading).toBe(true)
    console.log('Initial loading state:', result.current.loading)

    // Wait for the effect to run
    await waitFor(() => {
      expect(vi.mocked(supabase.auth.getSession)).toHaveBeenCalled()
    })

    // Wait for loading to become false
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 3000 })

    // Log all console outputs for debugging
    console.log('Console logs:', consoleLogs)
    console.log('Console errors:', consoleErrors)
    
    // Verify the flow
    expect(consoleLogs).toContain('AuthContext: Checking for existing session...')
    expect(consoleLogs).toContain('AuthContext: Session found: false')
    expect(consoleLogs).toContain('AuthContext: Initial load complete, setting loading to false')
    
    // Final state should be not loading, no user
    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
  })

  it('should debug what happens with a real Supabase error', async () => {
    const consoleErrors: string[] = []
    
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      consoleErrors.push(args.join(' '))
    })

    // Simulate a network error
    vi.mocked(supabase.auth.getSession).mockRejectedValue(
      new Error('Network request failed')
    )

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    // Initial state
    expect(result.current.loading).toBe(true)

    // Wait for the error to be handled
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 3000 })

    // Check that error was logged
    expect(consoleErrors.some(log => log.includes('Error in getSession promise:'))).toBe(true)
    expect(consoleErrors.some(log => log.includes('Network request failed'))).toBe(true)
    
    // Should still end up not loading
    expect(result.current.loading).toBe(false)
  })

  it('should debug what happens when profile loading fails', async () => {
    const consoleLogs: string[] = []
    const consoleErrors: string[] = []
    
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      consoleLogs.push(args.join(' '))
    })
    
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      consoleErrors.push(args.join(' '))
    })

    // Mock a session exists
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { 
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
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
          },
          expires_at: Date.now() + 3600
        }
      },
      error: null
    })

    // Mock profile fetch failure
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockImplementation((table) => {
      const chainMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: new Error('Profile not found') 
        }),
        update: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis()
      }
      return chainMock as any
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    // Wait for everything to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 3000 })

    // Check logs
    expect(consoleLogs).toContain('AuthContext: Session found: true')
    expect(consoleLogs).toContain('AuthContext: Loading user data for: test-user-id')
    expect(consoleErrors.some(log => log.includes('Error loading profile:'))).toBe(true)
    
    // Should have user but no profile
    expect(result.current.user).toBeTruthy()
    expect(result.current.profile).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})