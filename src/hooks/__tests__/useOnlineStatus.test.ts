import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnlineStatus } from '../useOnlineStatus'

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

      // Trigger offline event
      act(() => {
        offlineHandler?.()
      })

      expect(result.current).toBe(false)
    })

    it('should handle multiple status changes', () => {
      const { result } = renderHook(() => useOnlineStatus())

      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1]
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1]

      // Go offline
      act(() => offlineHandler?.())
      expect(result.current).toBe(false)

      // Go online
      act(() => onlineHandler?.())
      expect(result.current).toBe(true)

      // Go offline again
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
      // useState preserves undefined as the initial value
      expect(result.current).toBe(undefined)
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
})