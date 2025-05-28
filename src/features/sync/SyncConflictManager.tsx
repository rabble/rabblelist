import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { EnhancedSyncService } from '@/lib/enhancedSyncService'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Database,
  Cloud,
  Merge
} from 'lucide-react'
import { format } from 'date-fns'

interface SyncConflict {
  id: string
  type: 'create' | 'update' | 'delete'
  table: string
  recordId?: string
  data?: any
  conflictDetectedAt: string
  retries: number
}

export function SyncConflictManager() {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([])
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null)
  const [resolving, setResolving] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadConflicts()
    // Reload conflicts periodically
    const interval = setInterval(loadConflicts, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadConflicts = () => {
    const storedConflicts = EnhancedSyncService.getConflicts()
    setConflicts(storedConflicts)
  }

  const resolveConflict = async (conflict: SyncConflict, resolution: 'client' | 'server' | 'merge') => {
    setResolving(true)
    try {
      // Implementation would depend on your specific conflict resolution strategy
      
      // Remove from conflicts
      const updatedConflicts = conflicts.filter(c => c.id !== conflict.id)
      setConflicts(updatedConflicts)
      localStorage.setItem('syncConflicts', JSON.stringify(updatedConflicts))
      
      // Re-queue the change if needed
      if (resolution === 'client' && conflict.data) {
        EnhancedSyncService.addToQueue({
          type: conflict.type,
          table: conflict.table,
          recordId: conflict.recordId,
          data: conflict.data
        })
      }
      
      alert('Conflict resolved successfully')
      setSelectedConflict(null)
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
      alert('Failed to resolve conflict')
    } finally {
      setResolving(false)
    }
  }

  const clearAllConflicts = () => {
    if (confirm('Are you sure you want to clear all conflicts? This cannot be undone.')) {
      EnhancedSyncService.clearConflicts()
      setConflicts([])
      setSelectedConflict(null)
    }
  }

  if (conflicts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium">No sync conflicts</p>
          <p className="text-gray-600">All data is synchronized</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Conflicts Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Sync Conflicts ({conflicts.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllConflicts}
            >
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {conflicts.map(conflict => (
              <div
                key={conflict.id}
                className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  selectedConflict?.id === conflict.id ? 'border-primary-500 bg-primary-50' : ''
                }`}
                onClick={() => setSelectedConflict(conflict)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {conflict.type.charAt(0).toUpperCase() + conflict.type.slice(1)} operation on {conflict.table}
                    </p>
                    <p className="text-sm text-gray-600">
                      Detected {format(new Date(conflict.conflictDetectedAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conflict Details */}
      {selectedConflict && (
        <Card>
          <CardHeader>
            <CardTitle>Conflict Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Operation</p>
                <p className="text-gray-900">{selectedConflict.type}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Table</p>
                <p className="text-gray-900">{selectedConflict.table}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Record ID</p>
                <p className="text-gray-900">{selectedConflict.recordId || 'New record'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Retry Count</p>
                <p className="text-gray-900">{selectedConflict.retries}</p>
              </div>
            </div>

            {selectedConflict.data && (
              <div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {showDetails ? 'Hide' : 'Show'} Data Details
                </button>
                
                {showDetails && (
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedConflict.data, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* Resolution Options */}
            <div className="pt-4 border-t">
              <p className="font-medium mb-3">Resolution Options</p>
              <div className="space-y-2">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => resolveConflict(selectedConflict, 'client')}
                  disabled={resolving}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Use Local Version (Client Wins)
                </Button>
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => resolveConflict(selectedConflict, 'server')}
                  disabled={resolving}
                >
                  <Cloud className="w-4 h-4 mr-2" />
                  Use Server Version (Server Wins)
                </Button>
                <Button
                  fullWidth
                  variant="primary"
                  onClick={() => resolveConflict(selectedConflict, 'merge')}
                  disabled={resolving}
                >
                  <Merge className="w-4 h-4 mr-2" />
                  Merge Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}