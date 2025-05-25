import { useState, useEffect, useCallback } from 'react'

// ============================================================================
// Types
// ============================================================================

type OnlineStatusListener = () => void

// ============================================================================
// Constants
// ============================================================================

const ONLINE_EVENT = 'online' as const
const OFFLINE_EVENT = 'offline' as const

// ============================================================================
// Helpers
// ============================================================================

/**
 * Gets the current online status from the browser
 * Handles cases where navigator.onLine might be undefined
 */
function getOnlineStatus(): boolean {
  return navigator.onLine ?? false
}


// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook to track browser online/offline status
 * @returns Current online status
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isOnline = useOnlineStatus()
 *   
 *   return (
 *     <div>
 *       {isOnline ? 'Connected' : 'Offline'}
 *     </div>
 *   )
 * }
 * ```
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(getOnlineStatus)
  
  const handleStatusChange = useCallback(() => {
    setIsOnline(getOnlineStatus())
  }, [])
  
  useEffect(() => {
    // Subscribe to online/offline events
    window.addEventListener(ONLINE_EVENT, handleStatusChange)
    window.addEventListener(OFFLINE_EVENT, handleStatusChange)
    
    // Cleanup function
    return () => {
      window.removeEventListener(ONLINE_EVENT, handleStatusChange)
      window.removeEventListener(OFFLINE_EVENT, handleStatusChange)
    }
  }, [handleStatusChange])
  
  return isOnline
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if the browser is currently online
 * Can be used outside of React components
 * 
 * @example
 * ```ts
 * if (isOnline()) {
 *   // Perform network operation
 * }
 * ```
 */
export function isOnline(): boolean {
  return getOnlineStatus()
}

/**
 * Checks if the browser is currently offline
 * Can be used outside of React components
 * 
 * @example
 * ```ts
 * if (isOffline()) {
 *   // Show offline message
 * }
 * ```
 */
export function isOffline(): boolean {
  return !getOnlineStatus()
}