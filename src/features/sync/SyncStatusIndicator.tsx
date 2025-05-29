import { useEffect, useState } from 'react'
import { useSyncStore } from '@/stores/syncStore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { EnhancedSyncService } from '@/lib/enhancedSyncService'
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function SyncStatusIndicator() {
  const isOnline = useOnlineStatus()
  const { isSyncing, lastSyncTime, pendingChanges } = useSyncStore()
  const [conflicts, setConflicts] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Check for conflicts
    const checkConflicts = () => {
      const conflictCount = EnhancedSyncService.getConflicts().length
      setConflicts(conflictCount)
    }

    checkConflicts()
    const interval = setInterval(checkConflicts, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSync = () => {
    if (isOnline && !isSyncing) {
      EnhancedSyncService.performFullSync()
    }
  }

  // Determine status
  let status: 'synced' | 'syncing' | 'pending' | 'offline' | 'conflict'
  let statusColor: string
  let StatusIcon: any

  if (!isOnline) {
    status = 'offline'
    statusColor = 'text-gray-500'
    StatusIcon = CloudOff
  } else if (conflicts > 0) {
    status = 'conflict'
    statusColor = 'text-yellow-500'
    StatusIcon = AlertTriangle
  } else if (false) { // TODO: check for sync errors
    status = 'conflict'
    statusColor = 'text-red-500'
    StatusIcon = AlertTriangle
  } else if (isSyncing) {
    status = 'syncing'
    statusColor = 'text-blue-500'
    StatusIcon = RefreshCw
  } else if (pendingChanges.length > 0) {
    status = 'pending'
    statusColor = 'text-yellow-500'
    StatusIcon = Cloud
  } else {
    status = 'synced'
    statusColor = 'text-green-500'
    StatusIcon = CheckCircle
  }

  const getStatusText = () => {
    switch (status) {
      case 'offline':
        return 'Offline'
      case 'conflict':
        return `${conflicts} conflict${conflicts > 1 ? 's' : ''}`
      case 'syncing':
        return 'Syncing...'
      case 'pending':
        return `${pendingChanges.length} pending`
      case 'synced':
        return 'All synced'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors ${statusColor}`}
        title={`Sync status: ${getStatusText()}`}
      >
        {status === 'syncing' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <StatusIcon className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </button>

      {/* Dropdown Details */}
      {showDetails && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 space-y-3">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Connection</span>
              <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-600'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Last Sync */}
            {lastSyncTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last sync</span>
                <span className="text-sm font-medium">
                  {formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}
                </span>
              </div>
            )}

            {/* Pending Changes */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending changes</span>
              <span className="text-sm font-medium">{pendingChanges.length}</span>
            </div>

            {/* Conflicts */}
            {conflicts > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Conflicts</span>
                <span className="text-sm font-medium text-yellow-600">{conflicts}</span>
              </div>
            )}

            {/* Error Message */}
            {false && (
              <div className="pt-2 border-t">
                <p className="text-xs text-red-600">Error message</p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t space-y-2">
              <button
                onClick={handleSync}
                disabled={!isOnline || isSyncing}
                className="w-full px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sync Now
              </button>
              
              {conflicts > 0 && (
                <button
                  onClick={() => {
                    setShowDetails(false)
                    // Navigate to conflict resolution
                    window.location.href = '/admin/sync-conflicts'
                  }}
                  className="w-full px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200"
                >
                  Resolve Conflicts
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}