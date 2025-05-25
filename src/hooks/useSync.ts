import { useEffect, useCallback } from 'react'
import { useSyncStore } from '@/stores/syncStore'
import { useOnlineStatus } from './useOnlineStatus'
import { syncManager } from '@/lib/sync'

export function useSync() {
  const isOnline = useOnlineStatus()
  const { 
    pendingChanges, 
    isSyncing, 
    lastSyncTime,
    addPendingChange,
    startSync,
    syncComplete,
    syncError
  } = useSyncStore()

  const sync = useCallback(async () => {
    if (!isOnline || isSyncing || pendingChanges.length === 0) return
    
    startSync()
    try {
      await syncManager.syncAll(pendingChanges)
      syncComplete()
    } catch (error) {
      syncError(error as Error)
    }
  }, [isOnline, isSyncing, pendingChanges, startSync, syncComplete, syncError])

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingChanges.length > 0) {
      sync()
    }
  }, [isOnline, pendingChanges.length, sync])

  // Periodic sync attempt
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && pendingChanges.length > 0 && !isSyncing) {
        sync()
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [isOnline, pendingChanges.length, isSyncing, sync])

  return {
    pendingCount: pendingChanges.length,
    isSyncing,
    lastSyncTime,
    sync,
    addPendingChange,
    isOnline
  }
}