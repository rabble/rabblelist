import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInstallPrompt } from '../useInstallPrompt'

// Mock BeforeInstallPromptEvent
class MockBeforeInstallPromptEvent extends Event {
  prompt = vi.fn()
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  
  constructor(outcome: 'accepted' | 'dismissed' = 'accepted') {
    super('beforeinstallprompt')
    this.userChoice = Promise.resolve({ outcome })
  }
}

describe('useInstallPrompt', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>
  let mockAddEventListener: ReturnType<typeof vi.fn>
  let mockRemoveEventListener: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Mock window.matchMedia
    mockMatchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
    window.matchMedia = mockMatchMedia

    // Mock event listeners
    mockAddEventListener = vi.fn()
    mockRemoveEventListener = vi.fn()
    window.addEventListener = mockAddEventListener
    window.removeEventListener = mockRemoveEventListener
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial values when not installed', () => {
      const { result } = renderHook(() => useInstallPrompt())

      expect(result.current.isInstalled).toBe(false)
      expect(result.current.isInstallable).toBe(false)
      expect(typeof result.current.install).toBe('function')
    })

    it('should detect standalone mode as installed', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(display-mode: standalone)',
      })

      const { result } = renderHook(() => useInstallPrompt())

      expect(result.current.isInstalled).toBe(true)
      expect(result.current.isInstallable).toBe(false)
    })
  })

  describe('event handling', () => {
    it('should add event listeners on mount', () => {
      renderHook(() => useInstallPrompt())

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'beforeinstallprompt',
        expect.any(Function)
      )
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'appinstalled',
        expect.any(Function)
      )
    })

    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => useInstallPrompt())

      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'beforeinstallprompt',
        expect.any(Function)
      )
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'appinstalled',
        expect.any(Function)
      )
    })

    it('should not add listeners when already installed', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(display-mode: standalone)',
      })

      renderHook(() => useInstallPrompt())

      expect(mockAddEventListener).not.toHaveBeenCalled()
    })
  })

  describe('beforeinstallprompt event', () => {
    it('should handle beforeinstallprompt event', () => {
      const { result } = renderHook(() => useInstallPrompt())

      const mockEvent = new MockBeforeInstallPromptEvent()
      const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault')

      // Get the event handler that was registered
      const beforeInstallHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'beforeinstallprompt'
      )?.[1]

      act(() => {
        beforeInstallHandler?.(mockEvent)
      })

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(result.current.isInstallable).toBe(true)
    })
  })

  describe('appinstalled event', () => {
    it('should handle appinstalled event', () => {
      const { result } = renderHook(() => useInstallPrompt())

      // First set up install prompt
      const mockPromptEvent = new MockBeforeInstallPromptEvent()
      const beforeInstallHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'beforeinstallprompt'
      )?.[1]

      act(() => {
        beforeInstallHandler?.(mockPromptEvent)
      })

      expect(result.current.isInstallable).toBe(true)

      // Then trigger app installed
      const appInstalledHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'appinstalled'
      )?.[1]

      act(() => {
        appInstalledHandler?.(new Event('appinstalled'))
      })

      expect(result.current.isInstalled).toBe(true)
      expect(result.current.isInstallable).toBe(false)
    })
  })

  describe('install function', () => {
    it('should return false when no install prompt available', async () => {
      const { result } = renderHook(() => useInstallPrompt())

      const installed = await result.current.install()

      expect(installed).toBe(false)
    })

    it('should prompt and return true when accepted', async () => {
      const { result } = renderHook(() => useInstallPrompt())

      const mockEvent = new MockBeforeInstallPromptEvent('accepted')
      const beforeInstallHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'beforeinstallprompt'
      )?.[1]

      act(() => {
        beforeInstallHandler?.(mockEvent)
      })

      let installed: boolean = false
      await act(async () => {
        installed = await result.current.install()
      })

      expect(mockEvent.prompt).toHaveBeenCalled()
      expect(installed).toBe(true)
      expect(result.current.isInstallable).toBe(false)
    })

    it('should prompt and return false when dismissed', async () => {
      const { result } = renderHook(() => useInstallPrompt())

      const mockEvent = new MockBeforeInstallPromptEvent('dismissed')
      const beforeInstallHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'beforeinstallprompt'
      )?.[1]

      act(() => {
        beforeInstallHandler?.(mockEvent)
      })

      let installed: boolean = false
      await act(async () => {
        installed = await result.current.install()
      })

      expect(mockEvent.prompt).toHaveBeenCalled()
      expect(installed).toBe(false)
      expect(result.current.isInstallable).toBe(true) // Still installable after dismissal
    })

    it('should handle errors during installation', async () => {
      const { result } = renderHook(() => useInstallPrompt())
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const mockEvent = new MockBeforeInstallPromptEvent()
      mockEvent.prompt = vi.fn().mockRejectedValue(new Error('Installation failed'))

      const beforeInstallHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'beforeinstallprompt'
      )?.[1]

      act(() => {
        beforeInstallHandler?.(mockEvent)
      })

      let installed: boolean = false
      await act(async () => {
        installed = await result.current.install()
      })

      expect(installed).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error installing PWA:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })
  })
})