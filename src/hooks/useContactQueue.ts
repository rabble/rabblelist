import { useEffect } from 'react'
import { useContactStore } from '@/stores/contactStore'
import { useAuth } from '@/features/auth/AuthContext'

/**
 * Hook to manage the contact queue for the current user
 * Automatically loads the queue when the user is authenticated
 * 
 * @returns Queue data and loading state
 */
export function useContactQueue() {
  const { profile: user } = useAuth()
  const queue = useContactStore(state => state.queue)
  const currentIndex = useContactStore(state => state.currentIndex)
  const isLoadingQueue = useContactStore(state => state.isLoadingQueue)
  const loadQueue = useContactStore(state => state.loadQueue)

  useEffect(() => {
    if (!user) return

    // Load the queue when user is authenticated
    loadQueue()
  }, [user, loadQueue])

  return {
    queue,
    currentIndex,
    isLoading: isLoadingQueue,
    currentContact: queue[currentIndex] || null,
    hasContacts: queue.length > 0,
    totalContacts: queue.length
  }
}