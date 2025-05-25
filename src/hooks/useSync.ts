import { useState, useEffect } from 'react'
import { syncService } from '@/lib/sync'

export function useSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    // Start auto sync
    syncService.startAutoSync()

    // Update online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check sync status periodically
    const checkStatus = async () => {
      const status = await syncService.getSyncStatus()
      setIsSyncing(status.isSyncing)
      setPendingCount(status.pendingChanges)
    }

    checkStatus()
    const interval = setInterval(checkStatus, 5000) // Check every 5 seconds

    return () => {
      syncService.stopAutoSync()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const sync = async () => {
    setIsSyncing(true)
    try {
      await syncService.sync()
      const status = await syncService.getSyncStatus()
      setPendingCount(status.pendingChanges)
    } finally {
      setIsSyncing(false)
    }
  }

  const addPendingChange = async (change: any) => {
    // This is now handled internally by the sync service
    // But we'll keep the interface for compatibility
    const status = await syncService.getSyncStatus()
    setPendingCount(status.pendingChanges)
  }

  return {
    isOnline,
    isSyncing,
    pendingCount,
    sync,
    addPendingChange
  }
}