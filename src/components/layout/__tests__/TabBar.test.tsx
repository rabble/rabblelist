import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import { TabBar } from '../TabBar'
import { useAuth } from '@/features/auth/AuthContext'

// Mock the auth hook
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: vi.fn()
}))

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn()
  }
})

describe('TabBar', () => {
  const mockNavigate = vi.fn()
  const mockLocation = { 
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default'
  }

  const createMockAuth = (role?: string) => ({
    user: role ? { role } as any : null,
    profile: role ? { role } as any : null,
    organization: null,
    session: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    loading: false
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(useLocation).mockReturnValue(mockLocation)
  })

  describe('Rendering', () => {
    it('renders nothing when user is not authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({ 
        user: null,
        profile: null,
        organization: null,
        session: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn(),
        loading: false
      })

      const { container } = render(
        <BrowserRouter>
          <TabBar />
        </BrowserRouter>
      )

      expect(container.firstChild).toBeNull()
    })

    it('renders all tabs for admin user', () => {
      vi.mocked(useAuth).mockReturnValue({ 
        user: { role: 'admin' } as any,
        profile: { role: 'admin' } as any,
        organization: null,
        session: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn(),
        loading: false
      })

      render(
        <BrowserRouter>
          <TabBar />
        </BrowserRouter>
      )

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Contacts')).toBeInTheDocument()
      expect(screen.getByText('Queue')).toBeInTheDocument()
      expect(screen.getByText('Events')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('hides admin tab for non-admin user', () => {
      vi.mocked(useAuth).mockReturnValue({ 
        user: { role: 'member' } as any,
        profile: { role: 'member' } as any,
        organization: null,
        session: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn(),
        loading: false
      })

      render(
        <BrowserRouter>
          <TabBar />
        </BrowserRouter>
      )

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Contacts')).toBeInTheDocument()
      expect(screen.getByText('Queue')).toBeInTheDocument()
      expect(screen.getByText('Events')).toBeInTheDocument()
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue(createMockAuth('member'))
    })

    it('navigates to correct path when tab is clicked', () => {
      render(
        <BrowserRouter>
          <TabBar />
        </BrowserRouter>
      )

      fireEvent.click(screen.getByText('Contacts'))
      expect(mockNavigate).toHaveBeenCalledWith('/contacts')

      fireEvent.click(screen.getByText('Queue'))
      expect(mockNavigate).toHaveBeenCalledWith('/contacts/queue')

      fireEvent.click(screen.getByText('Events'))
      expect(mockNavigate).toHaveBeenCalledWith('/events')
    })
  })

  describe('Active State', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue(createMockAuth('member'))
    })

    it('highlights home tab when on home page', () => {
      vi.mocked(useLocation).mockReturnValue({ ...mockLocation, pathname: '/' })

      render(
        <BrowserRouter>
          <TabBar />
        </BrowserRouter>
      )

      const homeTab = screen.getByText('Home')
      expect(homeTab).toHaveClass('text-blue-600', 'font-medium')
      
      const contactsTab = screen.getByText('Contacts')
      expect(contactsTab).toHaveClass('text-gray-400')
    })

    it('highlights contacts tab when on contacts page', () => {
      vi.mocked(useLocation).mockReturnValue({ ...mockLocation, pathname: '/contacts' })

      render(
        <BrowserRouter>
          <TabBar />
        </BrowserRouter>
      )

      const contactsTab = screen.getByText('Contacts')
      expect(contactsTab).toHaveClass('text-blue-600', 'font-medium')
    })

    it('highlights contacts tab when on nested contacts page', () => {
      vi.mocked(useLocation).mockReturnValue({ ...mockLocation, pathname: '/contacts/123/edit' })

      render(
        <BrowserRouter>
          <TabBar />
        </BrowserRouter>
      )

      const contactsTab = screen.getByText('Contacts')
      expect(contactsTab).toHaveClass('text-blue-600', 'font-medium')
    })

    it('highlights queue tab when on queue page', () => {
      vi.mocked(useLocation).mockReturnValue({ ...mockLocation, pathname: '/contacts/queue' })

      render(
        <BrowserRouter>
          <TabBar />
        </BrowserRouter>
      )

      const queueTab = screen.getByText('Queue')
      expect(queueTab).toHaveClass('text-blue-600', 'font-medium')
    })
  })

  describe('Styling', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue(createMockAuth('member'))
    })

    it('has correct navigation container styling', () => {
      const { container } = render(
        <BrowserRouter>
          <TabBar />
        </BrowserRouter>
      )

      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0', 'z-50', 'bg-white', 'border-t', 'border-gray-200')
    })

    it('renders icons with correct size', () => {
      render(
        <BrowserRouter>
          <TabBar />
        </BrowserRouter>
      )

      const icons = screen.getByText('Home').parentElement?.querySelector('svg')
      expect(icons).toHaveClass('w-6', 'h-6')
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue(createMockAuth('member'))
    })

    it('uses nav element for semantic structure', () => {
      const { container } = render(
        <BrowserRouter>
          <TabBar />
        </BrowserRouter>
      )

      expect(container.querySelector('nav')).toBeInTheDocument()
    })

    it('uses button elements for interactive tabs', () => {
      render(
        <BrowserRouter>
          <TabBar />
        </BrowserRouter>
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4) // 4 tabs for non-admin user
    })
  })
})