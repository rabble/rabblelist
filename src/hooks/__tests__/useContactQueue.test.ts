import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useContactQueue } from '../useContactQueue'
import { useAuth } from '@/features/auth/AuthContext'
import { useContactStore } from '@/stores/contactStore'
import type { User, CallQueueItem } from '@/types'

// Mock the stores and auth context
vi.mock('@/features/auth/AuthContext')
vi.mock('@/stores/contactStore')

describe('useContactQueue', () => {
  const mockUser: User = {
    id: 'user-123',
    organization_id: 'org-123',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'ringer',
    phone: null,
    settings: {},
    last_active: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }

  const mockContacts: CallQueueItem[] = [
    {
      id: '1',
      organization_id: 'org-123',
      external_id: null,
      full_name: 'John Doe',
      phone: '+1234567890',
      email: 'john@example.com',
      address: null,
      tags: [],
      custom_fields: {},
      last_contact_date: null,
      total_events_attended: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      priority: 1,
      assigned_at: '2024-01-01'
    }
  ]

  const mockLoadQueue = vi.fn()
  
  // Create mock selectors
  const createMockContactStore = (overrides = {}) => {
    const defaults = {
      queue: [],
      currentIndex: 0,
      isLoadingQueue: false,
      loadQueue: mockLoadQueue,
      ...overrides
    }
    
    return (selector: any) => {
      if (typeof selector === 'function') {
        return selector(defaults)
      }
      return defaults
    }
  }
  

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
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
      vi.mocked(useContactStore).mockImplementation(createMockContactStore())
    })

    it('should not load queue', () => {
      const { result } = renderHook(() => useContactQueue())

      expect(mockLoadQueue).not.toHaveBeenCalled()
      expect(result.current.queue).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.currentContact).toBeNull()
      expect(result.current.hasContacts).toBe(false)
      expect(result.current.totalContacts).toBe(0)
    })
  })

  describe('when user is authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: mockUser.id, email: mockUser.email } as any,
        profile: mockUser,
        organization: { id: 'org-123', name: 'Test Org' } as any,
        session: {} as any,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn()
      })
    })

    it('should return queue and loading state', () => {
      vi.mocked(useContactStore).mockImplementation(createMockContactStore({
        queue: mockContacts,
        currentIndex: 0,
        isLoadingQueue: false
      }))

      const { result } = renderHook(() => useContactQueue())

      expect(result.current.queue).toEqual(mockContacts)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.currentContact).toEqual(mockContacts[0])
      expect(result.current.hasContacts).toBe(true)
      expect(result.current.totalContacts).toBe(1)
    })

    it('should return loading state when loading', () => {
      vi.mocked(useContactStore).mockImplementation(createMockContactStore({
        queue: [],
        currentIndex: 0,
        isLoadingQueue: true
      }))

      const { result } = renderHook(() => useContactQueue())

      expect(result.current.queue).toEqual([])
      expect(result.current.isLoading).toBe(true)
      expect(result.current.currentContact).toBeNull()
      expect(result.current.hasContacts).toBe(false)
    })

    it('should load queue on mount', async () => {
      vi.mocked(useContactStore).mockImplementation(createMockContactStore())

      renderHook(() => useContactQueue())

      await waitFor(() => {
        expect(mockLoadQueue).toHaveBeenCalledTimes(1)
      })
    })

    it('should reload queue when user changes', async () => {
      const { rerender } = renderHook(() => useContactQueue())

      expect(mockLoadQueue).toHaveBeenCalledTimes(1)

      // Change user
      const newUser = { ...mockUser, id: 'user-456' }
      vi.mocked(useAuth).mockReturnValue({
        user: { id: newUser.id, email: newUser.email } as any,
        profile: newUser,
        organization: { id: 'org-123', name: 'Test Org' } as any,
        session: {} as any,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn()
      })

      rerender()

      await waitFor(() => {
        expect(mockLoadQueue).toHaveBeenCalledTimes(2)
      })
    })

    it('should handle current contact navigation', () => {
      const queue = [mockContacts[0], { ...mockContacts[0], id: '2', full_name: 'Jane Doe' }]
      vi.mocked(useContactStore).mockImplementation(createMockContactStore({
        queue,
        currentIndex: 1,
        isLoadingQueue: false
      }))

      const { result } = renderHook(() => useContactQueue())

      expect(result.current.currentContact?.full_name).toBe('Jane Doe')
      expect(result.current.currentIndex).toBe(1)
    })

    it('should handle empty queue', () => {
      vi.mocked(useContactStore).mockImplementation(createMockContactStore({
        queue: [],
        currentIndex: 0,
        isLoadingQueue: false
      }))

      const { result } = renderHook(() => useContactQueue())

      expect(result.current.currentContact).toBeNull()
      expect(result.current.hasContacts).toBe(false)
      expect(result.current.totalContacts).toBe(0)
    })
  })
})