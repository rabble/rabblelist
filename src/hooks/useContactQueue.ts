import { useEffect } from 'react'
import { useContactStore } from '@/stores/contactStore'
import { useAuthStore } from '@/stores/authStore'
import { contactsService } from '@/features/contacts/contacts.service'

export function useContactQueue() {
  const user = useAuthStore(state => state.user)
  const {
    setQueue,
    setLoadingQueue,
    setAssignments,
  } = useContactStore()

  useEffect(() => {
    if (!user) return

    const loadContacts = async () => {
      try {
        setLoadingQueue(true)
        
        // For now, we'll load contacts assigned to the ringer
        // In a real app, this would use the call_assignments table
        const contacts = await contactsService.getContactsForRinger(user.id)
        
        setQueue(contacts)
      } catch (error) {
        console.error('Failed to load contacts:', error)
        // In production, show a user-friendly error
      } finally {
        setLoadingQueue(false)
      }
    }

    loadContacts()
  }, [user, setQueue, setLoadingQueue, setAssignments])
}