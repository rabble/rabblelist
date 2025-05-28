import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { ArrowLeft, Send, Copy, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { WebhookService, WebhookEventType } from '@/services/webhook.service'
import { useAuth } from '@/features/auth/AuthContext'

interface TestPayload {
  eventType: WebhookEventType
  sampleData: any
}

const testPayloads: TestPayload[] = [
  {
    eventType: 'contact.created',
    sampleData: {
      id: 'test-contact-id',
      full_name: 'Test Contact',
      email: 'test@example.com',
      phone: '+1234567890',
      created_at: new Date().toISOString()
    }
  },
  {
    eventType: 'campaign.created',
    sampleData: {
      id: 'test-campaign-id',
      name: 'Test Campaign',
      type: 'email',
      status: 'active',
      created_at: new Date().toISOString()
    }
  },
  {
    eventType: 'event.registered',
    sampleData: {
      event_id: 'test-event-id',
      contact_id: 'test-contact-id',
      event_name: 'Community Meeting',
      registration_date: new Date().toISOString()
    }
  },
  {
    eventType: 'pathway.completed',
    sampleData: {
      pathway_id: 'test-pathway-id',
      contact_id: 'test-contact-id',
      pathway_name: 'New Member Onboarding',
      completed_at: new Date().toISOString()
    }
  }
]

export function WebhookTester() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedEvent, setSelectedEvent] = useState<WebhookEventType>('contact.created')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)
  const [copiedPayload, setCopiedPayload] = useState(false)

  const selectedPayload = testPayloads.find(p => p.eventType === selectedEvent)

  const handleTest = async () => {
    if (!user?.organization_id) return

    setTesting(true)
    setTestResult(null)

    try {
      await WebhookService.triggerWebhook(
        user.organization_id,
        selectedEvent,
        selectedPayload?.sampleData
      )

      setTestResult({
        success: true,
        message: 'Test webhook sent successfully',
        details: {
          event: selectedEvent,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to send test webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setTesting(false)
    }
  }

  const copyPayload = () => {
    if (selectedPayload) {
      navigator.clipboard.writeText(JSON.stringify(selectedPayload.sampleData, null, 2))
      setCopiedPayload(true)
      setTimeout(() => setCopiedPayload(false), 2000)
    }
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/automation/webhooks')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Webhooks
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Webhook Tester</h1>
          <p className="text-gray-600 mt-1">
            Test your webhook endpoints with sample payloads
          </p>
        </div>

        {/* Event Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Event Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {testPayloads.map(payload => (
                <button
                  key={payload.eventType}
                  onClick={() => setSelectedEvent(payload.eventType)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedEvent === payload.eventType
                      ? 'border-primary-600 bg-primary-50 text-primary-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{payload.eventType}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {payload.eventType.split('.')[0].charAt(0).toUpperCase() + 
                     payload.eventType.split('.')[0].slice(1)} event
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payload Preview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sample Payload</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={copyPayload}
              >
                {copiedPayload ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code>{JSON.stringify(selectedPayload?.sampleData, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>

        {/* Test Button */}
        <div className="flex justify-center mb-6">
          <Button
            size="lg"
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending Test...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Test Webhook
              </>
            )}
          </Button>
        </div>

        {/* Test Result */}
        {testResult && (
          <Card className={testResult.success ? 'border-green-200' : 'border-red-200'}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  testResult.success ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {testResult.success ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    testResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {testResult.message}
                  </h3>
                  {testResult.details && (
                    <pre className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {typeof testResult.details === 'string' 
                        ? testResult.details 
                        : JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Testing Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                Make sure you have at least one active webhook configured
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                Check your webhook endpoint logs to see the received payload
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                Use tools like RequestBin or ngrok for testing local endpoints
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                Verify webhook signatures in your endpoint for security
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}