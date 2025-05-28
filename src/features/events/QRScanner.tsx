import { useState, useCallback } from 'react'
import { QrReader } from 'react-qr-reader'
import { Button } from '@/components/common/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { 
  X, 
  Camera, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react'
import { QRCodeService } from '@/services/qrcode.service'
import { useAuth } from '@/features/auth/AuthContext'

interface QRScannerProps {
  eventId: string
  onClose: () => void
  onSuccess?: (registration: any) => void
}

export function QRScanner({ eventId, onClose, onSuccess }: QRScannerProps) {
  const { user } = useAuth()
  const [scanning, setScanning] = useState(true)
  const [result, setResult] = useState<{
    type: 'success' | 'error' | 'warning'
    message: string
    registration?: any
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleScan = useCallback(async (data: string | null) => {
    if (!data || isProcessing || !user) return

    setIsProcessing(true)
    setScanning(false)

    try {
      // Try to parse as URL first
      let code = data
      try {
        const url = new URL(data)
        // Extract registration ID from URL if it's a check-in URL
        const match = url.pathname.match(/\/events\/[^\/]+\/check-in\/([^\/]+)/)
        if (match) {
          // For URL-based QR codes, we'll need to fetch the registration directly
          const registrationId = match[1]
          code = `EVT-${eventId.slice(0, 8)}-${registrationId.slice(0, 8)}-${Date.now().toString(36)}`
        }
      } catch {
        // Not a URL, treat as raw code
      }

      const verifyResult = await QRCodeService.verifyAndCheckIn(code, user.id)

      if (verifyResult.success) {
        setResult({
          type: 'success',
          message: verifyResult.message,
          registration: verifyResult.registration
        })
        onSuccess?.(verifyResult.registration)
        
        // Auto-reset after successful scan
        setTimeout(() => {
          setResult(null)
          setScanning(true)
          setIsProcessing(false)
        }, 3000)
      } else {
        setResult({
          type: verifyResult.message.includes('Already checked in') ? 'warning' : 'error',
          message: verifyResult.message,
          registration: verifyResult.registration
        })
        
        // Reset for next scan
        setTimeout(() => {
          setResult(null)
          setScanning(true)
          setIsProcessing(false)
        }, 5000)
      }
    } catch (error) {
      console.error('Scan error:', error)
      setResult({
        type: 'error',
        message: 'Failed to process QR code'
      })
      
      setTimeout(() => {
        setResult(null)
        setScanning(true)
        setIsProcessing(false)
      }, 3000)
    }
  }, [eventId, isProcessing, user, onSuccess])

  const handleError = (error: any) => {
    console.error('QR Scanner error:', error)
    if (error?.name === 'NotAllowedError') {
      setResult({
        type: 'error',
        message: 'Camera permission denied. Please enable camera access.'
      })
      setScanning(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Event Check-in Scanner
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {scanning && !result && (
              <div className="relative">
                <QrReader
                  onResult={(result, error) => {
                    if (!!result) {
                      handleScan(result.getText())
                    }
                    if (!!error) {
                      handleError(error)
                    }
                  }}
                  constraints={{ facingMode: 'environment' }}
                  className="w-full"
                />
                <div className="absolute inset-0 border-2 border-primary-500 pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                <span className="ml-2">Processing check-in...</span>
              </div>
            )}

            {result && (
              <div className={`p-4 rounded-lg ${
                result.type === 'success' ? 'bg-green-50 border border-green-200' :
                result.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {result.type === 'success' ? (
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : result.type === 'warning' ? (
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      result.type === 'success' ? 'text-green-800' :
                      result.type === 'warning' ? 'text-yellow-800' :
                      'text-red-800'
                    }`}>
                      {result.message}
                    </p>
                    {result.registration && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p><strong>Name:</strong> {result.registration.first_name} {result.registration.last_name}</p>
                        <p><strong>Email:</strong> {result.registration.email}</p>
                        {result.registration.ticket_type && (
                          <p><strong>Ticket:</strong> {result.registration.ticket_type}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-600 text-center">
              {scanning ? (
                <p>Position the QR code within the frame to scan</p>
              ) : (
                <Button
                  onClick={() => {
                    setScanning(true)
                    setResult(null)
                  }}
                  className="mt-2"
                >
                  Scan Another
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}