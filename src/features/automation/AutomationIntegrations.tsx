import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { 
  ArrowLeft,
  Zap,
  Link,
  Settings,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Code,
  Webhook,
  Bot,
  Workflow,
  GitBranch,
  Globe
} from 'lucide-react'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  status: 'available' | 'coming_soon' | 'beta'
  category: 'automation' | 'webhook' | 'api' | 'nocode'
  setupUrl?: string
  docsUrl?: string
}

export function AutomationIntegrations() {
  const navigate = useNavigate()
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  
  // In production, this would come from the backend
  const webhookUrl = 'https://api.your-org.com/webhooks/engagement'
  const apiKey = 'sk_live_xxxxxxxxxxxxxxxxxxxxxx'

  const integrations: Integration[] = [
    {
      id: 'n8n',
      name: 'n8n',
      description: 'Open-source workflow automation tool. Connect your organizing tools with 200+ apps.',
      icon: <GitBranch className="w-6 h-6" />,
      status: 'available',
      category: 'automation',
      setupUrl: 'https://docs.n8n.io',
      docsUrl: '/docs/n8n-integration'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect with 5,000+ apps to automate your workflows without code.',
      icon: <Zap className="w-6 h-6" />,
      status: 'coming_soon',
      category: 'nocode'
    },
    {
      id: 'make',
      name: 'Make (Integromat)',
      description: 'Visual automation platform to connect apps and design powerful workflows.',
      icon: <Workflow className="w-6 h-6" />,
      status: 'beta',
      category: 'nocode',
      setupUrl: 'https://www.make.com'
    },
    {
      id: 'webhooks',
      name: 'Webhooks',
      description: 'Send real-time data to your own endpoints when events occur.',
      icon: <Webhook className="w-6 h-6" />,
      status: 'available',
      category: 'webhook'
    },
    {
      id: 'api',
      name: 'REST API',
      description: 'Full API access to build custom integrations and tools.',
      icon: <Code className="w-6 h-6" />,
      status: 'available',
      category: 'api',
      docsUrl: '/api/docs'
    },
    {
      id: 'ifttt',
      name: 'IFTTT',
      description: 'Simple conditional automation for everyday tasks.',
      icon: <Bot className="w-6 h-6" />,
      status: 'coming_soon',
      category: 'nocode'
    }
  ]

  const categories = [
    { id: 'all', name: 'All Integrations' },
    { id: 'automation', name: 'Automation Platforms' },
    { id: 'nocode', name: 'No-Code Tools' },
    { id: 'webhook', name: 'Webhooks' },
    { id: 'api', name: 'API Access' }
  ]

  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredIntegrations = selectedCategory === 'all' 
    ? integrations 
    : integrations.filter(i => i.category === selectedCategory)

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2000)
  }

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'available':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Available</span>
      case 'beta':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Beta</span>
      case 'coming_soon':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Coming Soon</span>
    }
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/engagement')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Engagement
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Automation & Integrations</h1>
              <p className="text-gray-600 mt-1">
                Connect your organizing tools with automation platforms
              </p>
            </div>
          </div>
        </div>

        {/* Quick Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Webhook Endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Use this webhook URL to receive real-time events from your campaigns
              </p>
              <div className="flex items-center gap-2 mb-4">
                <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                  {webhookUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyWebhook}
                >
                  {copiedWebhook ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4 mt-0.5 text-amber-500" />
                <p>
                  Events sent: contact.created, campaign.completed, event.registered, pathway.completed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* API Access */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Use your API key to authenticate requests to our REST API
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                    {showApiKey ? apiKey : 'sk_live_••••••••••••••••••••••••'}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/docs/api')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View API Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map(integration => (
            <Card key={integration.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
                      {integration.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      {getStatusBadge(integration.status)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {integration.description}
                </p>
                
                {integration.status === 'available' ? (
                  <div className="flex gap-2">
                    {integration.id === 'webhooks' ? (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate('/automation/webhooks')}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Configure
                      </Button>
                    ) : integration.id === 'api' ? (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate('/docs/api')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Documentation
                      </Button>
                    ) : (
                      <>
                        {integration.setupUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(integration.setupUrl, '_blank')}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Setup
                          </Button>
                        )}
                        {integration.docsUrl && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(integration.docsUrl)}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Docs
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ) : integration.status === 'beta' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Request Beta Access
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Coming Soon
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* n8n Setup Guide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Start: n8n Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. Install n8n</h4>
                <code className="block p-3 bg-gray-100 rounded text-sm">
                  npm install -g n8n
                </code>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">2. Create a Webhook Trigger</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Add a Webhook node in n8n and use this URL:
                </p>
                <code className="block p-3 bg-gray-100 rounded text-sm">
                  {webhookUrl}
                </code>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">3. Example Workflow</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• When new contact is created → Add to Google Sheets</li>
                  <li>• When petition signed → Send Slack notification</li>
                  <li>• When event registered → Create calendar event</li>
                  <li>• When campaign completed → Generate report and email</li>
                </ul>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => window.open('https://n8n.io/workflows/', '_blank')}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  n8n Templates
                </Button>
                <Button onClick={() => navigate('/docs/integrations/n8n')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Full Integration Guide
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}