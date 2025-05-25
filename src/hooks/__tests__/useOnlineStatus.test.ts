import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnlineStatus, isOnline, isOffline } from '../useOnlineStatus'

describe('useOnlineStatus', () => {
  // Store original values
  let originalNavigatorOnLine: boolean
  let mockAddEventListener: ReturnType<typeof vi.fn>
  let mockRemoveEventListener: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Save original values
    originalNavigatorOnLine = navigator.onLine

    // Mock window event listeners
    mockAddEventListener = vi.fn()
    mockRemoveEventListener = vi.fn()
    
    window.addEventListener = mockAddEventListener
    window.removeEventListener = mockRemoveEventListener
  })

  afterEach(() => {
    // Restore original values
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: originalNavigatorOnLine
    })
    
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should return true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true
      })

      const { result } = renderHook(() => useOnlineStatus())
      expect(result.current).toBe(true)
    })

    it('should return false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false
      })

      const { result } = renderHook(() => useOnlineStatus())
      expect(result.current).toBe(false)
    })
  })

  describe('event listeners', () => {
    it('should register online and offline event listeners on mount', () => {
      renderHook(() => useOnlineStatus())

      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
      expect(mockAddEventListener).toHaveBeenCalledTimes(2)
    })

    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => useOnlineStatus())

      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
      expect(mockRemoveEventListener).toHaveBeenCalledTimes(2)
    })

    it('should use the same function references for add and remove', () => {
      const { unmount } = renderHook(() => useOnlineStatus())

      // Get the functions passed to addEventListener
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1]
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1]

      unmount()

      // Check that the same functions were passed to removeEventListener
      const removedOnlineHandler = mockRemoveEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1]
      const removedOfflineHandler = mockRemoveEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1]

      expect(onlineHandler).toBe(removedOnlineHandler)
      expect(offlineHandler).toBe(removedOfflineHandler)
    })
  })

  describe('status changes', () => {
    it('should update to online when online event is triggered', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false
      })

      const { result } = renderHook(() => useOnlineStatus())
      
      expect(result.current).toBe(false)

      // Get the online handler
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1]

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true
      })

      // Trigger online event
      act(() => {
        onlineHandler?.()
      })

      expect(result.current).toBe(true)
    })

    it('should update to offline when offline event is triggered', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true
      })

      const { result } = renderHook(() => useOnlineStatus())
      
      expect(result.current).toBe(true)

      // Get the offline handler
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1]

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false
      })

      // Trigger offline event
      act(() => {
        offlineHandler?.()
      })

      expect(result.current).toBe(false)
    })

    it('should handle multiple status changes', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true
      })

      const { result } = renderHook(() => useOnlineStatus())

      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1]
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1]

      // Go offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false
      })
      act(() => offlineHandler?.())
      expect(result.current).toBe(false)

      // Go online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true
      })
      act(() => onlineHandler?.())
      expect(result.current).toBe(true)

      // Go offline again
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false
      })
      act(() => offlineHandler?.())
      expect(result.current).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle navigator.onLine being undefined', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: undefined
      })

      const { result } = renderHook(() => useOnlineStatus())
      // Should default to false when undefined (due to ?? operator)
      expect(result.current).toBe(false)
    })

    it('should not cause memory leaks on rapid mount/unmount', () => {
      const { rerender, unmount } = renderHook(() => useOnlineStatus())

      // Rapid remount
      rerender()
      rerender()
      rerender()

      unmount()

      // Should have same number of remove calls as add calls
      const addCalls = mockAddEventListener.mock.calls.length
      const removeCalls = mockRemoveEventListener.mock.calls.length
      
      expect(removeCalls).toBe(2) // Should only have 2 removes (online and offline)
    })
  })

  describe('utility functions', () => {
    it('isOnline should return current online status', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true
      })
      expect(isOnline()).toBe(true)

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false
      })
      expect(isOnline()).toBe(false)
    })

    it('isOffline should return inverse of online status', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true
      })
      expect(isOffline()).toBe(false)

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false
      })
      expect(isOffline()).toBe(true)
    })

    it('utility functions should handle undefined navigator.onLine', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: undefined
      })
      
      expect(isOnline()).toBe(false)
      expect(isOffline()).toBe(true)
    })
  })

})