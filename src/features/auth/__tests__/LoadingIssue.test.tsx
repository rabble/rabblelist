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
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}))

// Mock Navigate to prevent actual navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to }: any) => {
      mockNavigate(to)
      return <div data-testid="navigate">Navigate to {to}</div>
    },
    useNavigate: () => mockNavigate
  }
})

describe('App Loading Issue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Capture console logs
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/',
        href: 'http://localhost:3000/',
        origin: 'http://localhost:3000',
        search: '',
        hash: ''
      },
      writable: true
    })
  })

  it('should show loading spinner and then redirect to login when no session', async () => {
    // Create a delayed promise to ensure we see the loading state
    let resolveSession: any
    const sessionPromise = new Promise((resolve) => {
      resolveSession = resolve
    })
    
    vi.mocked(supabase.auth.getSession).mockReturnValue(sessionPromise as any)

    const { container } = render(<App />)

    // Should initially show loading spinner
    await waitFor(() => {
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()
    })

    // Now resolve the session
    resolveSession({
      data: { session: null },
      error: null
    })

    // Wait for loading to complete and navigation to happen
    await waitFor(() => {
      const navigateElement = container.querySelector('[data-testid="navigate"]')
      expect(navigateElement).toBeTruthy()
      expect(navigateElement?.textContent).toContain('Navigate to /login')
    })
  })

  it('should handle getSession errors and still stop loading', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Create a delayed promise
    let resolveSession: any
    const sessionPromise = new Promise((resolve) => {
      resolveSession = resolve
    })
    
    vi.mocked(supabase.auth.getSession).mockReturnValue(sessionPromise as any)

    const { container } = render(<App />)

    // Should initially show loading spinner
    await waitFor(() => {
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()
    })

    // Now resolve with an error
    resolveSession({
      data: { session: null },
      error: {
        message: 'Failed to get session',
        code: 'session_error',
        status: 400,
        __isAuthError: true
      }
    })

    // Wait for error handling and navigation
    await waitFor(() => {
      const navigateElement = container.querySelector('[data-testid="navigate"]')
      expect(navigateElement).toBeTruthy()
    })

    // Should have logged the error
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting session:', expect.any(Object))
    
    consoleErrorSpy.mockRestore()
  })

  it('should handle case where getSession never resolves', async () => {
    // Create a promise that never resolves
    let resolveGetSession: any
    const neverResolvingPromise = new Promise((resolve) => {
      resolveGetSession = resolve
    })
    
    vi.mocked(supabase.auth.getSession).mockReturnValue(neverResolvingPromise as any)

    const { container } = render(<App />)

    // Should show loading spinner
    await waitFor(() => {
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()
    })

    // Wait a bit to ensure it's stuck
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Should still be loading
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()

    // Now resolve it to clean up
    resolveGetSession({ data: { session: null }, error: null })
    
    // Wait for loading to complete
    await waitFor(() => {
      const navigateElement = container.querySelector('[data-testid="navigate"]')
      expect(navigateElement).toBeTruthy()
    })
  })

  it('should handle when supabase is completely broken', async () => {
    // Make getSession throw an error
    vi.mocked(supabase.auth.getSession).mockImplementation(() => {
      throw new Error('Supabase is broken')
    })

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { container } = render(<App />)

    // Should eventually stop loading even with the error
    await waitFor(() => {
      // Should either show navigate element or login form
      const navigateElement = container.querySelector('[data-testid="navigate"]')
      const hasContent = container.textContent?.length ?? 0 > 0
      expect(navigateElement || hasContent).toBeTruthy()
    }, { timeout: 3000 })

    // Should have caught and logged the error
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error calling getSession:', expect.any(Error))
    
    consoleErrorSpy.mockRestore()
  })
})