import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { WebhookService, WebhookConfig, WebhookEventType } from '@/services/webhook.service'
import { useAuth } from '@/features/auth/AuthContext'
import { 
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Activity,
  Clock,
  X,
  Save,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Webhook,
  TestTube2,
  ArrowLeft
} from 'lucide-react'

const eventTypes: { value: WebhookEventType; label: string; category: string }[] = [
  // Contact events
  { value: 'contact.created', label: 'Contact Created', category: 'Contacts' },
  { value: 'contact.updated', label: 'Contact Updated', category: 'Contacts' },
  { value: 'contact.deleted', label: 'Contact Deleted', category: 'Contacts' },
  { value: 'contact.tagged', label: 'Contact Tagged', category: 'Contacts' },
  
  // Campaign events
  { value: 'campaign.created', label: 'Campaign Created', category: 'Campaigns' },
  { value: 'campaign.started', label: 'Campaign Started', category: 'Campaigns' },
  { value: 'campaign.completed', label: 'Campaign Completed', category: 'Campaigns' },
  { value: 'campaign.participant_added', label: 'Campaign Participant Added', category: 'Campaigns' },
  
  // Event events
  { value: 'event.created', label: 'Event Created', category: 'Events' },
  { value: 'event.registration', label: 'Event Registration', category: 'Events' },
  { value: 'event.attendance_marked', label: 'Event Attendance Marked', category: 'Events' },
  { value: 'event.cancelled', label: 'Event Cancelled', category: 'Events' },
  
  // Pathway events
  { value: 'pathway.started', label: 'Pathway Started', category: 'Pathways' },
  { value: 'pathway.step_completed', label: 'Pathway Step Completed', category: 'Pathways' },
  { value: 'pathway.completed', label: 'Pathway Completed', category: 'Pathways' },
  
  // Communication events
  { value: 'communication.sent', label: 'Communication Sent', category: 'Communications' },
  { value: 'communication.opened', label: 'Communication Opened', category: 'Communications' },
  { value: 'communication.clicked', label: 'Communication Link Clicked', category: 'Communications' },
  
  // Action events
  { value: 'petition.signed', label: 'Petition Signed', category: 'Actions' },
  { value: 'donation.received', label: 'Donation Received', category: 'Actions' },
  { value: 'phonebank.call_completed', label: 'Phone Bank Call Completed', category: 'Actions' }
]

export function WebhookManagement() {
  const navigate = useNavigate()
  const { organization } = useAuth()
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewWebhook, setShowNewWebhook] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null)
  const [viewingSecret, setViewingSecret] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (organization?.id) {
      loadWebhooks()
    }
  }, [organization?.id])

  const loadWebhooks = async () => {
    if (!organization?.id) return
    
    setLoading(true)
    try {
      const data = await WebhookService.getWebhooks(organization.id)
      setWebhooks(data)
    } catch (error) {
      console.error('Failed to load webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWebhook = async (webhook: WebhookConfig) => {
    if (!confirm(`Delete webhook "${webhook.name}"? This cannot be undone.`)) return
    
    try {
      await WebhookService.deleteWebhook(webhook.id)
      setWebhooks(webhooks.filter(w => w.id !== webhook.id))
    } catch (error) {
      console.error('Failed to delete webhook:', error)
      alert('Failed to delete webhook')
    }
  }

  const handleToggleWebhook = async (webhook: WebhookConfig) => {
    try {
      await WebhookService.updateWebhook(webhook.id, {
        is_active: !webhook.is_active
      })
      setWebhooks(webhooks.map(w => 
        w.id === webhook.id ? { ...w, is_active: !w.is_active } : w
      ))
    } catch (error) {
      console.error('Failed to toggle webhook:', error)
    }
  }

  const copySecret = (secret: string, id: string) => {
    navigator.clipboard.writeText(secret)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Webhooks</h1>
              <p className="text-gray-600 mt-1">
                Configure webhooks to receive real-time event notifications
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate('/automation/webhooks/test')}
              >
                <TestTube2 className="w-4 h-4 mr-2" />
                Test Webhooks
              </Button>
              <Button onClick={() => setShowNewWebhook(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Webhook
              </Button>
            </div>
          </div>
        </div>

        {/* New/Edit Webhook Form */}
        {(showNewWebhook || editingWebhook) && (
          <WebhookForm
            webhook={editingWebhook}
            organizationId={organization?.id || ''}
            onSave={async (webhook) => {
              await loadWebhooks()
              setShowNewWebhook(false)
              setEditingWebhook(null)
            }}
            onCancel={() => {
              setShowNewWebhook(false)
              setEditingWebhook(null)
            }}
          />
        )}

        {/* Webhook List */}
        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Webhook className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks configured</h3>
              <p className="text-gray-600 mb-4">
                Create webhooks to integrate with external services
              </p>
              <Button onClick={() => setShowNewWebhook(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {webhooks.map(webhook => (
              <Card key={webhook.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{webhook.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          webhook.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {webhook.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {webhook.failure_count > 5 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {webhook.failure_count} failures
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-2">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {webhook.url}
                          </code>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          <span>{webhook.events.length === 1 && webhook.events[0] === '*' ? 'All events' : `${webhook.events.length} events`}</span>
                        </div>
                        
                        {webhook.last_triggered_at && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Last triggered: {new Date(webhook.last_triggered_at).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Secret:</span>
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                            {viewingSecret === webhook.id ? webhook.secret : '••••••••••••••••'}
                          </code>
                          <button
                            onClick={() => setViewingSecret(viewingSecret === webhook.id ? null : webhook.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {viewingSecret === webhook.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => copySecret(webhook.secret, webhook.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {copiedId === webhook.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleWebhook(webhook)}
                      >
                        {webhook.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingWebhook(webhook)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

// Webhook Form Component
function WebhookForm({ 
  webhook, 
  organizationId,
  onSave, 
  onCancel 
}: { 
  webhook: WebhookConfig | null
  organizationId: string
  onSave: (webhook: WebhookConfig) => void
  onCancel: () => void 
}) {
  const [name, setName] = useState(webhook?.name || '')
  const [url, setUrl] = useState(webhook?.url || '')
  const [selectedEvents, setSelectedEvents] = useState<string[]>(webhook?.events || [])
  const [selectAll, setSelectAll] = useState(webhook?.events?.[0] === '*')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !url) {
      alert('Please fill in all required fields')
      return
    }
    
    if (!selectAll && selectedEvents.length === 0) {
      alert('Please select at least one event')
      return
    }
    
    setSaving(true)
    try {
      const events = selectAll ? ['*'] : selectedEvents
      
      if (webhook) {
        const updated = await WebhookService.updateWebhook(webhook.id, {
          name,
          url,
          events
        })
        onSave(updated)
      } else {
        const newWebhook = await WebhookService.createWebhook({
          organization_id: organizationId,
          name,
          url,
          events,
          is_active: true
        })
        onSave(newWebhook)
      }
    } catch (error) {
      console.error('Failed to save webhook:', error)
      alert('Failed to save webhook')
    } finally {
      setSaving(false)
    }
  }

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    )
  }

  const handleSelectAll = () => {
    setSelectAll(!selectAll)
    if (!selectAll) {
      setSelectedEvents([])
    }
  }

  // Group events by category
  const eventsByCategory = eventTypes.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = []
    acc[event.category].push(event)
    return acc
  }, {} as Record<string, typeof eventTypes>)

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{webhook ? 'Edit Webhook' : 'Create New Webhook'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="My Integration"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com/webhook"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              We'll send POST requests to this URL when events occur
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Events to Subscribe *
            </label>
            
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="font-medium">Subscribe to all events</span>
              </label>
            </div>
            
            {!selectAll && (
              <div className="space-y-4">
                {Object.entries(eventsByCategory).map(([category, events]) => (
                  <div key={category}>
                    <h4 className="font-medium text-sm text-gray-900 mb-2">{category}</h4>
                    <div className="space-y-2 ml-4">
                      {events.map(event => (
                        <label key={event.value} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedEvents.includes(event.value)}
                            onChange={() => toggleEvent(event.value)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm">{event.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {webhook ? 'Update Webhook' : 'Create Webhook'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}