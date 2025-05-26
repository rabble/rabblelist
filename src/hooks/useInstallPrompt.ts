import { useState, useEffect, useCallback } from 'react'

// ============================================================================
// Types
// ============================================================================

/**
 * Extended Event interface for the beforeinstallprompt event
 * This event is fired when the browser detects that the site can be installed as a PWA
 */
interface BeforeInstallPromptEvent extends Event {
  /** Prompts the user to install the PWA */
  prompt: () => Promise<void>
  /** Promise that resolves with the user's choice */
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UseInstallPromptReturn {
  /** Whether the app is already installed */
  isInstalled: boolean
  /** Whether the install prompt is available */
  isInstallable: boolean
  /** Function to trigger the install prompt */
  install: () => Promise<boolean>
}

// ============================================================================
// Constants
// ============================================================================

const STANDALONE_MEDIA_QUERY = '(display-mode: standalone)' as const
const BEFOREINSTALLPROMPT_EVENT = 'beforeinstallprompt' as const
const APPINSTALLED_EVENT = 'appinstalled' as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if the app is running in standalone mode (installed)
 */
function isRunningStandalone(): boolean {
  return window.matchMedia(STANDALONE_MEDIA_QUERY).matches
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to manage PWA installation prompt
 * 
 * @example
 * ```tsx
 * function InstallButton() {
 *   const { isInstalled, isInstallable, install } = useInstallPrompt()
 *   
 *   if (isInstalled) {
 *     return <p>App is installed!</p>
 *   }
 *   
 *   if (!isInstallable) {
 *     return null
 *   }
 *   
 *   return (
 *     <button onClick={install}>
 *       Install App
 *     </button>
 *   )
 * }
 * ```
 */
export function useInstallPrompt(): UseInstallPromptReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  // Check if already installed on mount
  useEffect(() => {
    if (isRunningStandalone()) {
      setIsInstalled(true)
    }
  }, [])

  // Handle install prompt event
  const handleBeforeInstallPrompt = useCallback((event: Event) => {
    // Prevent the default browser install prompt
    event.preventDefault()
    
    // Cast to the correct type since we know this event type
    setInstallPrompt(event as BeforeInstallPromptEvent)
  }, [])

  // Handle app installed event
  const handleAppInstalled = useCallback(() => {
    setIsInstalled(true)
    setInstallPrompt(null)
  }, [])

  // Set up event listeners
  useEffect(() => {
    // Skip if already installed in standalone mode
    if (isRunningStandalone()) {
      return
    }

    window.addEventListener(BEFOREINSTALLPROMPT_EVENT, handleBeforeInstallPrompt)
    window.addEventListener(APPINSTALLED_EVENT, handleAppInstalled)

    return () => {
      window.removeEventListener(BEFOREINSTALLPROMPT_EVENT, handleBeforeInstallPrompt)
      window.removeEventListener(APPINSTALLED_EVENT, handleAppInstalled)
    }
  }, [handleBeforeInstallPrompt, handleAppInstalled])

  // Install function
  const install = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      return false
    }

    try {
      // Show the install prompt
      await installPrompt.prompt()
      
      // Wait for the user's response
      const { outcome } = await installPrompt.userChoice
      
      if (outcome === 'accepted') {
        // Clear the prompt after successful installation
        setInstallPrompt(null)
        return true
      }
      
      // User dismissed the prompt
      return false
    } catch (error) {
      console.error('Error installing PWA:', error)
      return false
    }
  }, [installPrompt])

  return {
    isInstalled,
    isInstallable: !!installPrompt,
    install
  }
}