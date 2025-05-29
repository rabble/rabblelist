import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { 
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  GitBranch,
  Workflow,
  Code,
  AlertCircle,
  Lightbulb,
  Terminal,
  Settings
} from 'lucide-react'

interface CodeExample {
  id: string
  title: string
  description: string
  code: string
  language: string
}

export function N8nIntegrationGuide() {
  const navigate = useNavigate()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const workflows: CodeExample[] = [
    {
      id: 'contact-sync',
      title: 'Contact Sync to Google Sheets',
      description: 'Automatically sync new contacts to a Google Sheet for easy sharing',
      language: 'json',
      code: `{
  "name": "Contact Sync to Google Sheets",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "webhookId": "contact-created",
      "parameters": {
        "httpMethod": "POST",
        "path": "contact-created",
        "options": {}
      }
    },
    {
      "name": "Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "position": [450, 300],
      "parameters": {
        "operation": "append",
        "sheetId": "YOUR_SHEET_ID",
        "range": "Sheet1!A:E",
        "options": {}
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Google Sheets",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}`
    },
    {
      id: 'campaign-notification',
      title: 'Campaign Completion Notifications',
      description: 'Send Slack notifications when campaigns complete',
      language: 'json',
      code: `{
  "name": "Campaign Completion Slack Alert",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "campaign-completed"
      }
    },
    {
      "name": "Slack",
      "type": "n8n-nodes-base.slack",
      "parameters": {
        "operation": "post",
        "channel": "#campaigns",
        "text": "🎉 Campaign {{$json.data.name}} completed!\\n\\nTotal participants: {{$json.data.participant_count}}\\nSuccess rate: {{$json.data.success_rate}}%"
      }
    }
  ]
}`
    },
    {
      id: 'event-calendar',
      title: 'Event Registration to Calendar',
      description: 'Create calendar events when people register',
      language: 'json',
      code: `{
  "name": "Event Registration Calendar Sync",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "event-registration"
      }
    },
    {
      "name": "Google Calendar",
      "type": "n8n-nodes-base.googleCalendar",
      "parameters": {
        "operation": "create",
        "calendar": "primary",
        "summary": "{{$json.data.event_name}} - {{$json.data.contact_name}}",
        "start": "{{$json.data.event_date}}",
        "end": "{{$json.data.event_end_date}}"
      }
    }
  ]
}`
    }
  ]

  const setupSteps = [
    {
      title: 'Install n8n',
      command: 'npm install -g n8n',
      description: 'Install n8n globally on your system'
    },
    {
      title: 'Start n8n',
      command: 'n8n start',
      description: 'Start n8n on http://localhost:5678'
    },
    {
      title: 'Create Webhook Node',
      description: 'Add a Webhook node and set the HTTP Method to POST'
    },
    {
      title: 'Configure Webhook URL',
      description: 'Copy the webhook URL from n8n and add it to your Contact Manager'
    }
  ]

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/engagement/automations')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Automations
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <GitBranch className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">n8n Integration Guide</h1>
              <p className="text-gray-600 mt-1">
                Connect your organizing tools with n8n workflow automation
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {setupSteps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{step.title}</h4>
                    {step.command && (
                      <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 px-3 py-1 bg-gray-900 text-gray-100 rounded text-sm">
                          {step.command}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyCode(`cmd-${index}`, step.command!)}
                        >
                          {copiedId === `cmd-${index}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Webhook Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Webhook Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Available Events</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['contact.created', 'campaign.completed', 'event.registered', 'pathway.completed', 'petition.signed', 'phonebank.call_completed'].map(event => (
                    <div key={event} className="px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                      {event}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Webhook Headers</h4>
                <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
                  <div><span className="font-mono text-gray-600">X-Webhook-Event:</span> The event type</div>
                  <div><span className="font-mono text-gray-600">X-Webhook-Signature:</span> HMAC signature for verification</div>
                  <div><span className="font-mono text-gray-600">X-Webhook-ID:</span> Unique webhook delivery ID</div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900">Security Note</p>
                  <p className="text-amber-700 mt-1">
                    Always verify webhook signatures in production to ensure requests are authentic.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example Workflows */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Workflow className="w-6 h-6" />
            Example Workflows
          </h2>

          <div className="space-y-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{workflow.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCode(workflow.id, workflow.code)}
                    >
                      {copiedId === workflow.id ? (
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
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{workflow.code}</code>
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Advanced Tips */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Advanced Integration Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Data Transformation</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Use n8n's Function node to transform webhook data:
                </p>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                  <code>{`// Extract and format contact data
const contact = $json.data;
return {
  name: contact.full_name,
  email: contact.email,
  phone: contact.phone,
  tags: contact.tags.join(', '),
  created: new Date(contact.created_at).toLocaleDateString()
};`}</code>
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">Error Handling</h4>
                <p className="text-sm text-gray-600">
                  Add error handling nodes to catch failures and send notifications:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Use Error Trigger nodes to catch workflow failures</li>
                  <li>• Send alerts via email or Slack when errors occur</li>
                  <li>• Log errors to a database for debugging</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Webhook Security</h4>
                <p className="text-sm text-gray-600">
                  Validate webhook signatures in n8n using a Function node before processing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <a
                href="https://docs.n8n.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium">n8n Documentation</div>
                  <div className="text-sm text-gray-600">Official n8n docs and guides</div>
                </div>
              </a>
              
              <a
                href="https://n8n.io/workflows"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Workflow className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium">Workflow Templates</div>
                  <div className="text-sm text-gray-600">Pre-built n8n workflows</div>
                </div>
              </a>
              
              <button
                onClick={() => navigate('/automation/webhooks')}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Settings className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium">Configure Webhooks</div>
                  <div className="text-sm text-gray-600">Set up webhooks in Contact Manager</div>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/docs/api')}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Code className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium">API Documentation</div>
                  <div className="text-sm text-gray-600">Full API reference</div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}