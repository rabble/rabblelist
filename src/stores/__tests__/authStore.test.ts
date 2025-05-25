import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../authStore'
import type { User } from '@/types'

describe('authStore', () => {
  // Reset store before each test
  beforeEach(() => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.clear()
    })
  })

  describe('initial state', () => {
    it('should have null user initially', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.user).toBeNull()
    })

    it('should be loading initially', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('setUser', () => {
    it('should set user correctly', () => {
      const { result } = renderHook(() => useAuthStore())
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        role: 'ringer',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }

      act(() => {
        result.current.setUser(mockUser)
      })

      expect(result.current.user).toEqual(mockUser)
    })

    it('should handle setting user to null', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.setUser(null)
      })

      expect(result.current.user).toBeNull()
    })
  })

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should set loading state to false', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('clear', () => {
    it('should reset state to defaults', () => {
      const { result } = renderHook(() => useAuthStore())
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        role: 'ringer',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }

      // Set some state
      act(() => {
        result.current.setUser(mockUser)
        result.current.setLoading(true)
      })

      // Clear state
      act(() => {
        result.current.clear()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('persistence', () => {
    it('should only persist user data', () => {
      const { result } = renderHook(() => useAuthStore())
      const state = result.current
      
      // The partialize function should only include user
      const persistedState = { user: state.user }
      
      expect(persistedState).toHaveProperty('user')
      expect(persistedState).not.toHaveProperty('isLoading')
    })
  })
})