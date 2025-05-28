import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { 
  ArrowLeft,
  Code,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Terminal,
  Book,
  Zap,
  Shield,
  Database,
  Globe
} from 'lucide-react'

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  parameters?: Array<{
    name: string
    type: string
    required: boolean
    description: string
  }>
  requestBody?: any
  responseExample?: any
}

export function ApiDocumentation() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('getting-started')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: <Book className="w-4 h-4" /> },
    { id: 'authentication', title: 'Authentication', icon: <Shield className="w-4 h-4" /> },
    { id: 'contacts', title: 'Contacts API', icon: <Database className="w-4 h-4" /> },
    { id: 'campaigns', title: 'Campaigns API', icon: <Zap className="w-4 h-4" /> },
    { id: 'webhooks', title: 'Webhooks', icon: <Globe className="w-4 h-4" /> },
    { id: 'examples', title: 'Code Examples', icon: <Terminal className="w-4 h-4" /> }
  ]

  const contactEndpoints: ApiEndpoint[] = [
    {
      method: 'GET',
      path: '/api/v1/contacts',
      description: 'List all contacts with pagination and filtering',
      parameters: [
        { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
        { name: 'limit', type: 'integer', required: false, description: 'Items per page (default: 50, max: 100)' },
        { name: 'search', type: 'string', required: false, description: 'Search by name, email, or phone' },
        { name: 'tags', type: 'array', required: false, description: 'Filter by tags' }
      ],
      responseExample: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            full_name: 'Jane Doe',
            email: 'jane@example.com',
            phone: '+1234567890',
            tags: ['volunteer', 'donor'],
            created_at: '2024-01-15T10:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 150,
          pages: 3
        }
      }
    },
    {
      method: 'POST',
      path: '/api/v1/contacts',
      description: 'Create a new contact',
      requestBody: {
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1234567890',
        address: '123 Main St, City, State 12345',
        tags: ['volunteer'],
        custom_fields: {
          birthday: '1990-01-01',
          company: 'Acme Corp'
        }
      },
      responseExample: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        created_at: '2024-01-15T10:00:00Z'
      }
    }
  ]

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/engagement/automations')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Automations
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">API Documentation</h1>
              <p className="text-gray-600 mt-1">
                Complete reference for the Organizing Platform API
              </p>
            </div>
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              OpenAPI Spec
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {sections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === section.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {section.icon}
                      {section.title}
                      {activeSection === section.id && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {activeSection === 'getting-started' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Getting Started</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none">
                    <p>
                      The Organizing Platform API allows you to programmatically access your organizing data
                      and integrate with external services. This RESTful API uses JSON for request and response bodies.
                    </p>
                    
                    <h3 className="text-lg font-medium mt-6 mb-3">Base URL</h3>
                    <code className="block p-3 bg-gray-100 rounded">
                      https://api.your-organization.com/api/v1
                    </code>
                    
                    <h3 className="text-lg font-medium mt-6 mb-3">Rate Limits</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>1000 requests per hour per API key</li>
                      <li>Burst limit of 100 requests per minute</li>
                      <li>Rate limit headers included in all responses</li>
                    </ul>
                    
                    <h3 className="text-lg font-medium mt-6 mb-3">Response Format</h3>
                    <p>All responses follow a consistent format:</p>
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto">
{`{
  "data": { ... },      // Response data
  "error": null,        // Error object if applicable
  "meta": {            // Additional metadata
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}`}
                    </pre>
                  </CardContent>
                </Card>
              </>
            )}

            {activeSection === 'authentication' && (
              <Card>
                <CardHeader>
                  <CardTitle>Authentication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">API Key Authentication</h3>
                    <p className="text-gray-600 mb-4">
                      Include your API key in the Authorization header of all requests:
                    </p>
                    <div className="relative">
                      <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto">
{`Authorization: Bearer YOUR_API_KEY`}
                      </pre>
                      <button
                        onClick={() => copyCode('Authorization: Bearer YOUR_API_KEY', 'auth-header')}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                      >
                        {copiedCode === 'auth-header' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">OAuth 2.0 (Coming Soon)</h3>
                    <p className="text-gray-600">
                      OAuth 2.0 support for third-party applications is coming soon. This will allow
                      users to authorize your application to access their data without sharing credentials.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="flex gap-3">
                      <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-900">Security Best Practices</p>
                        <ul className="mt-2 space-y-1 text-amber-700">
                          <li>• Never expose your API key in client-side code</li>
                          <li>• Rotate your API keys regularly</li>
                          <li>• Use environment variables to store keys</li>
                          <li>• Implement proper error handling for auth failures</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'contacts' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Contacts API</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-6">
                      The Contacts API allows you to manage your contact database programmatically.
                    </p>
                    
                    <div className="space-y-8">
                      {contactEndpoints.map((endpoint, index) => (
                        <div key={index} className="border-b pb-8 last:border-0">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`px-2 py-1 text-xs font-mono font-medium rounded ${
                              endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                              endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                              endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {endpoint.method}
                            </span>
                            <code className="text-sm font-mono">{endpoint.path}</code>
                          </div>
                          
                          <p className="text-gray-600 mb-4">{endpoint.description}</p>
                          
                          {endpoint.parameters && (
                            <div className="mb-4">
                              <h4 className="font-medium mb-2">Parameters</h4>
                              <div className="space-y-2">
                                {endpoint.parameters.map(param => (
                                  <div key={param.name} className="flex items-start gap-3 text-sm">
                                    <code className="px-2 py-1 bg-gray-100 rounded font-mono">
                                      {param.name}
                                    </code>
                                    <span className="text-gray-500">{param.type}</span>
                                    {param.required && (
                                      <span className="text-red-600 text-xs">required</span>
                                    )}
                                    <span className="text-gray-600 flex-1">— {param.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {endpoint.requestBody && (
                            <div className="mb-4">
                              <h4 className="font-medium mb-2">Request Body</h4>
                              <div className="relative">
                                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{JSON.stringify(endpoint.requestBody, null, 2)}
                                </pre>
                                <button
                                  onClick={() => copyCode(JSON.stringify(endpoint.requestBody, null, 2), `req-${index}`)}
                                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                                >
                                  {copiedCode === `req-${index}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {endpoint.responseExample && (
                            <div>
                              <h4 className="font-medium mb-2">Response Example</h4>
                              <div className="relative">
                                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{JSON.stringify(endpoint.responseExample, null, 2)}
                                </pre>
                                <button
                                  onClick={() => copyCode(JSON.stringify(endpoint.responseExample, null, 2), `res-${index}`)}
                                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                                >
                                  {copiedCode === `res-${index}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeSection === 'webhooks' && (
              <Card>
                <CardHeader>
                  <CardTitle>Webhooks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Webhook Payload Structure</h3>
                    <p className="text-gray-600 mb-4">
                      All webhook payloads follow a consistent structure:
                    </p>
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{`{
  "event": "contact.created",
  "data": {
    // Event-specific data
  },
  "timestamp": "2024-01-15T10:00:00Z",
  "organization_id": "org_123"
}`}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Webhook Security</h3>
                    <p className="text-gray-600 mb-4">
                      Verify webhook signatures to ensure requests are from our servers:
                    </p>
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{`// Node.js example
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const [timestamp, hash] = signature.split(',');
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(timestamp + JSON.stringify(payload))
    .digest('hex');
  
  return hash === expectedHash;
}`}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Retry Policy</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Webhooks are retried up to 3 times on failure</li>
                      <li>Retries happen after 1 minute, 5 minutes, and 30 minutes</li>
                      <li>Webhooks are disabled after 10 consecutive failures</li>
                      <li>Successful delivery requires a 2xx HTTP status code</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'examples' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Code Examples</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div>
                      <h3 className="text-lg font-medium mb-3">JavaScript/Node.js</h3>
                      <div className="relative">
                        <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{`// Create a new contact
const axios = require('axios');

async function createContact(contactData) {
  try {
    const response = await axios.post(
      'https://api.your-organization.com/api/v1/contacts',
      contactData,
      {
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating contact:', error.response.data);
    throw error;
  }
}

// Usage
createContact({
  full_name: 'Jane Doe',
  email: 'jane@example.com',
  tags: ['volunteer']
}).then(contact => {
});`}
                        </pre>
                        <button
                          onClick={() => copyCode(`const axios = require('axios');...`, 'js-example')}
                          className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                        >
                          {copiedCode === 'js-example' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Python</h3>
                      <div className="relative">
                        <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{`import requests

def create_contact(contact_data):
    """Create a new contact via API"""
    url = 'https://api.your-organization.com/api/v1/contacts'
    headers = {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    }
    
    response = requests.post(url, json=contact_data, headers=headers)
    
    if response.status_code == 201:
        return response.json()
    else:
        raise Exception(f"API Error: {response.status_code} - {response.text}")

# Usage
contact = create_contact({
    'full_name': 'Jane Doe',
    'email': 'jane@example.com',
    'tags': ['volunteer']
})
print(f"Contact created: {contact['id']}")`}
                        </pre>
                        <button
                          onClick={() => copyCode(`import requests...`, 'python-example')}
                          className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                        >
                          {copiedCode === 'python-example' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">cURL</h3>
                      <div className="relative">
                        <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{`curl -X POST https://api.your-organization.com/api/v1/contacts \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "tags": ["volunteer"]
  }'`}
                        </pre>
                        <button
                          onClick={() => copyCode(`curl -X POST...`, 'curl-example')}
                          className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                        >
                          {copiedCode === 'curl-example' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>SDKs & Libraries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <a href="#" className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50">
                        <Code className="w-8 h-8 text-gray-400" />
                        <div>
                          <h4 className="font-medium">JavaScript SDK</h4>
                          <p className="text-sm text-gray-600">npm install @organizing/sdk</p>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                      </a>
                      <a href="#" className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50">
                        <Code className="w-8 h-8 text-gray-400" />
                        <div>
                          <h4 className="font-medium">Python SDK</h4>
                          <p className="text-sm text-gray-600">pip install organizing-sdk</p>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}