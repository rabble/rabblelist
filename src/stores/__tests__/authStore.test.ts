import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../authStore'
import type { User } from '@/types'

describe('authStore', () => {
  // Helper to create a complete mock user
  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: '123',
    organization_id: 'org-123',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'ringer',
    phone: null,
    settings: {},
    last_active: new Date().toISOString(),
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides
  })

  beforeEach(() => {
    // Reset localStorage to ensure clean state
    localStorage.clear()
  })

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('setUser', () => {
    it('should set user correctly', () => {
      const { result } = renderHook(() => useAuthStore())
      const mockUser = createMockUser()

      act(() => {
        result.current.setUser(mockUser)
      })

      expect(result.current.user).toEqual(mockUser)
    })

    it('should update user with partial data', () => {
      const { result } = renderHook(() => useAuthStore())
      const initialUser = createMockUser()

      act(() => {
        result.current.setUser(initialUser)
      })

      const updatedUser = createMockUser({
        ...initialUser,
        email: 'updated@example.com'
      })

      act(() => {
        result.current.setUser(updatedUser)
      })

      expect(result.current.user).toEqual(updatedUser)
      expect(result.current.user?.email).toBe('updated@example.com')
    })

    it('should handle null user', () => {
      const { result } = renderHook(() => useAuthStore())
      const mockUser = createMockUser()

      act(() => {
        result.current.setUser(mockUser)
      })

      expect(result.current.user).not.toBeNull()

      act(() => {
        result.current.setUser(null)
      })

      expect(result.current.user).toBeNull()
    })
  })

  describe('setLoading', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('clear', () => {
    it('should clear user and reset loading state', () => {
      const { result } = renderHook(() => useAuthStore())
      const mockUser = createMockUser()

      act(() => {
        result.current.setUser(mockUser)
        result.current.setLoading(true)
      })

      expect(result.current.user).not.toBeNull()
      expect(result.current.isLoading).toBe(true)

      act(() => {
        result.current.clear()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('persistence', () => {
    it('should persist user state', () => {
      const mockUser = createMockUser()
      
      // First render
      const { result: result1 } = renderHook(() => useAuthStore())
      
      act(() => {
        result1.current.setUser(mockUser)
      })

      // Unmount and remount
      const { result: result2 } = renderHook(() => useAuthStore())
      
      // User should be persisted
      expect(result2.current.user).toEqual(mockUser)
    })

    it('should not persist loading state', () => {
      // First render
      const { result: result1, unmount } = renderHook(() => useAuthStore())
      
      act(() => {
        result1.current.setLoading(false)
      })

      expect(result1.current.isLoading).toBe(false)

      // Unmount first hook
      unmount()
      
      // Clear localStorage to simulate fresh app start
      localStorage.clear()
      
      // Mount new hook - should have initial loading state
      const { result: result2 } = renderHook(() => useAuthStore())
      
      // Loading should be back to initial state
      expect(result2.current.isLoading).toBe(true)
    })
  })

  describe('selectors', () => {
    it('should have working user selector', () => {
      const { result } = renderHook(() => useAuthStore())
      const mockUser = createMockUser()

      act(() => {
        result.current.setUser(mockUser)
      })

      const selectedUser = useAuthStore.getState().user
      expect(selectedUser).toEqual(mockUser)
    })

    it('should have working isLoading selector', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setLoading(false)
      })

      const isLoading = useAuthStore.getState().isLoading
      expect(isLoading).toBe(false)
    })
  })
})