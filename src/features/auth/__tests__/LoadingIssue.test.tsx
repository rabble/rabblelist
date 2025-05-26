import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '@/App'
import { supabase } from '@/lib/supabase'

// Mock Supabase to simulate the real loading scenario
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
    from: vi.fn()
  }
}))

describe('App Loading Issue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Capture console logs
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should show loading spinner and then redirect to login when no session', async () => {
    // Simulate no session (user needs to log in)
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })

    render(<App />)

    // Initially should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeTruthy()

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeFalsy()
    }, { timeout: 3000 })

    // Should redirect to login page
    expect(window.location.pathname).toBe('/login')
  })

  it('should handle getSession errors and still stop loading', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Simulate an error getting the session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: {
        message: 'Failed to get session',
        code: 'session_error',
        status: 400,
        __isAuthError: true
      } as any
    })

    render(<App />)

    // Initially should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeTruthy()

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeFalsy()
    }, { timeout: 3000 })

    // Should have logged the error
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting session:', expect.any(Error))
    
    // Should redirect to login page
    expect(window.location.pathname).toBe('/login')
    
    consoleErrorSpy.mockRestore()
  })

  it('should handle case where getSession never resolves', async () => {
    // Create a promise that never resolves
    let resolveGetSession: any
    const neverResolvingPromise = new Promise((resolve) => {
      resolveGetSession = resolve
    })
    
    vi.mocked(supabase.auth.getSession).mockReturnValue(neverResolvingPromise as any)

    render(<App />)

    // Should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeTruthy()

    // Wait a bit to ensure it's stuck
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Should still be loading
    expect(document.querySelector('.animate-spin')).toBeTruthy()

    // Now resolve it to clean up
    resolveGetSession({ data: { session: null }, error: null })
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeFalsy()
    })
  })

  it('should handle when supabase is completely broken', async () => {
    // Make getSession throw an error
    vi.mocked(supabase.auth.getSession).mockImplementation(() => {
      throw new Error('Supabase is broken')
    })

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<App />)

    // Should eventually stop loading even with the error
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeFalsy()
    }, { timeout: 3000 })

    // Should have caught and logged the error
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error calling getSession:', expect.any(Error))
    
    consoleErrorSpy.mockRestore()
  })
})