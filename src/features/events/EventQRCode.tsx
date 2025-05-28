import { useState, useEffect } from 'react'
import { Button } from '@/components/common/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy,
  Check,
  Loader2
} from 'lucide-react'
import { QRCodeService } from '@/services/qrcode.service'

interface EventQRCodeProps {
  eventId: string
  eventName: string
  registration: {
    id: string
    first_name: string
    last_name: string
    email: string
    organization?: string
    ticket_type?: string
  }
}

export function EventQRCode({ eventId, eventName, registration }: EventQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    generateQRCode()
  }, [eventId, registration.id])

  const generateQRCode = async () => {
    try {
      setLoading(true)
      const checkInCode = QRCodeService.generateCheckInCode(eventId, registration.id)
      const qrDataUrl = await QRCodeService.generateQRCode(checkInCode)
      setQrCodeUrl(qrDataUrl)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.download = `${registration.first_name}-${registration.last_name}-checkin.png`
    link.href = qrCodeUrl
    link.click()
  }

  const handlePrint = async () => {
    const badgeHTML = await QRCodeService.generateBadgeHTML(
      registration,
      eventName,
      qrCodeUrl
    )

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Event Badge - ${registration.first_name} ${registration.last_name}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { size: 4in 3in; margin: 0; }
            }
          </style>
        </head>
        <body>
          ${badgeHTML}
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleCopyCheckInUrl = () => {
    const checkInUrl = `${window.location.origin}/events/${eventId}/check-in/${registration.id}`
    navigator.clipboard.writeText(checkInUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Check-in QR Code
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <img 
                  src={qrCodeUrl} 
                  alt="Check-in QR Code" 
                  className="border-2 border-gray-200 rounded-lg p-2"
                />
              </div>

              <div className="text-center text-sm text-gray-600">
                <p className="font-medium">{registration.first_name} {registration.last_name}</p>
                <p>{registration.email}</p>
                {registration.ticket_type && (
                  <p className="text-primary-600 font-medium mt-1">{registration.ticket_type}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleDownload}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </Button>
                
                <Button
                  onClick={handlePrint}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Badge
                </Button>
                
                <Button
                  onClick={handleCopyCheckInUrl}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                <p className="font-medium mb-1">How to use:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Show this QR code at the event entrance</li>
                  <li>Event staff will scan it to check you in</li>
                  <li>You can also use the link for self check-in</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}