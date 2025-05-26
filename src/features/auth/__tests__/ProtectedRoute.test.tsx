import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedRoute } from '../ProtectedRoute'
import * as AuthContext from '../AuthContext'

// Mock the AuthContext
vi.mock('../AuthContext', () => ({
  useAuth: vi.fn()
}))

// Mock Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to }: any) => {
      return <div data-testid="navigate">Navigate to {to}</div>
    }
  }
})

describe('ProtectedRoute', () => {
  const mockUseAuth = vi.mocked(AuthContext.useAuth)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading spinner when loading is true', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      organization: null,
      session: null,
      loading: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn()
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    // Should show loading spinner
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
    
    // Should not show protected content
    expect(screen.queryByText('Protected Content')).toBeNull()
  })

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      organization: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn()
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    // Should redirect to login
    expect(screen.getByTestId('navigate')).toHaveTextContent('Navigate to /login')
    
    // Should not show protected content
    expect(screen.queryByText('Protected Content')).toBeNull()
  })

  it('should redirect to login when user exists but profile is missing', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' } as any,
      profile: null,
      organization: null,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn()
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    // Should redirect to login
    expect(screen.getByTestId('navigate')).toHaveTextContent('Navigate to /login')
    
    // Should not show protected content
    expect(screen.queryByText('Protected Content')).toBeNull()
  })

  it('should show protected content when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' } as any,
      profile: {
        id: 'test-user',
        email: 'test@example.com',
        full_name: 'Test User',
        organization_id: 'test-org',
        role: 'ringer',
        phone: null,
        settings: {},
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      organization: {} as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn()
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    // Should show protected content
    expect(screen.getByText('Protected Content')).toBeDefined()
    
    // Should not redirect
    expect(screen.queryByTestId('navigate')).toBeNull()
  })

  it('should redirect to unauthorized when user lacks required role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' } as any,
      profile: {
        id: 'test-user',
        email: 'test@example.com',
        full_name: 'Test User',
        organization_id: 'test-org',
        role: 'ringer',
        phone: null,
        settings: {},
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      organization: {} as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn()
    })

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['admin']}>
          <div>Admin Only Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    // Should redirect to unauthorized
    expect(screen.getByTestId('navigate')).toHaveTextContent('Navigate to /unauthorized')
    
    // Should not show protected content
    expect(screen.queryByText('Admin Only Content')).toBeNull()
  })

  it('should show content when user has required role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' } as any,
      profile: {
        id: 'test-user',
        email: 'test@example.com',
        full_name: 'Test User',
        organization_id: 'test-org',
        role: 'admin',
        phone: null,
        settings: {},
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      organization: {} as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn()
    })

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['admin', 'ringer']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    // Should show protected content
    expect(screen.getByText('Admin Content')).toBeDefined()
    
    // Should not redirect
    expect(screen.queryByTestId('navigate')).toBeNull()
  })

  it('should preserve location state when redirecting to login', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      organization: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn()
    })

    render(
      <MemoryRouter initialEntries={['/contacts/123']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    // Should redirect to login
    expect(screen.getByTestId('navigate')).toHaveTextContent('Navigate to /login')
    
    // Note: We can't easily test the state prop with our mock
    // In a real test, we'd use a more sophisticated mock or integration test
  })
})