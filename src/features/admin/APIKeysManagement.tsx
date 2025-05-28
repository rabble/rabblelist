import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Trash2, 
  TestTube,
  Save
} from 'lucide-react'
import { OrganizationAPIKeyService, type ServiceName } from '@/services/api-key.service'
import type { Tables } from '@/lib/database.types'

interface APIKeyField {
  name: string
  label: string
  type: 'text' | 'password'
  placeholder: string
  required: boolean
}

interface ServiceInfo {
  name: ServiceName
  label: string
  description: string
  fields: APIKeyField[]
  docsUrl: string
}

const SERVICES: ServiceInfo[] = [
  {
    name: 'twilio',
    label: 'Twilio (SMS & Voice)',
    description: 'Send SMS messages and make phone calls',
    docsUrl: 'https://www.twilio.com/docs/sms/quickstart',
    fields: [
      {
        name: 'account_sid',
        label: 'Account SID',
        type: 'text',
        placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true
      },
      {
        name: 'auth_token',
        label: 'Auth Token',
        type: 'password',
        placeholder: 'Your auth token',
        required: true
      },
      {
        name: 'api_key',
        label: 'API Key (Optional)',
        type: 'text',
        placeholder: 'SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: false
      },
      {
        name: 'api_secret',
        label: 'API Secret (Optional)',
        type: 'password',
        placeholder: 'Your API secret',
        required: false
      }
    ]
  },
  {
    name: 'sendgrid',
    label: 'SendGrid (Email)',
    description: 'Send transactional and marketing emails',
    docsUrl: 'https://docs.sendgrid.com/for-developers/sending-email/api-getting-started',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true
      }
    ]
  }
]

export const APIKeysManagement = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<ServiceName | null>(null)
  const [organization, setOrganization] = useState<Tables<'organizations'> | null>(null)
  const [subscription, setSubscription] = useState<Tables<'organization_subscriptions'> | null>(null)
  const [apiKeys, setApiKeys] = useState<Record<ServiceName, Record<string, string>>>({
    twilio: {},
    sendgrid: {},
    openai: {},
    stripe: {}
  })
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<Record<ServiceName, { success: boolean; message: string } | null>>({
    twilio: null,
    sendgrid: null,
    openai: null,
    stripe: null
  })
  
  const apiKeyService = OrganizationAPIKeyService.getInstance()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get current organization
      const { data: orgId } = await supabase.rpc('get_user_current_organization')
      if (!orgId) throw new Error('No organization found')
      
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()
      
      if (org) {
        setOrganization(org)
        
        // Load subscription info
        const sub = await apiKeyService.getOrganizationSubscription(org.id)
        setSubscription(sub)
        
        // Load API keys for each service
        const keys: Record<ServiceName, Record<string, string>> = {
          twilio: {},
          sendgrid: {},
          openai: {},
          stripe: {}
        }
        
        for (const service of SERVICES) {
          keys[service.name] = await apiKeyService.getOrganizationKeys(org.id, service.name)
        }
        
        setApiKeys(keys)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveKeys = async (serviceName: ServiceName, values: Record<string, string>) => {
    if (!organization) return
    
    setSaving(true)
    try {
      // Save each key
      for (const [keyName, value] of Object.entries(values)) {
        if (value) {
          await apiKeyService.setOrganizationKey(
            organization.id,
            serviceName,
            keyName,
            value
          )
        }
      }
      
      // Reload keys
      const updatedKeys = await apiKeyService.getOrganizationKeys(organization.id, serviceName)
      setApiKeys(prev => ({
        ...prev,
        [serviceName]: updatedKeys
      }))
      
      // Show success message
      setTestResults(prev => ({
        ...prev,
        [serviceName]: { success: true, message: 'API keys saved successfully' }
      }))
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setTestResults(prev => ({
          ...prev,
          [serviceName]: null
        }))
      }, 3000)
    } catch (error) {
      console.error('Error saving keys:', error)
      setTestResults(prev => ({
        ...prev,
        [serviceName]: { 
          success: false, 
          message: error instanceof Error ? error.message : 'Failed to save keys' 
        }
      }))
    } finally {
      setSaving(false)
    }
  }

  const handleTestKeys = async (serviceName: ServiceName, values: Record<string, string>) => {
    if (!organization) return
    
    setTesting(serviceName)
    try {
      const result = await apiKeyService.testKeys(organization.id, serviceName, values)
      setTestResults(prev => ({
        ...prev,
        [serviceName]: {
          success: result.success,
          message: result.success ? 'Connection successful!' : result.error || 'Connection failed'
        }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [serviceName]: {
          success: false,
          message: error instanceof Error ? error.message : 'Test failed'
        }
      }))
    } finally {
      setTesting(null)
    }
  }

  const handleDeleteKey = async (serviceName: ServiceName, keyName: string) => {
    if (!organization) return
    
    if (!confirm(`Are you sure you want to delete the ${keyName} for ${serviceName}?`)) {
      return
    }
    
    try {
      await apiKeyService.deleteOrganizationKey(organization.id, serviceName, keyName)
      
      // Reload keys
      const updatedKeys = await apiKeyService.getOrganizationKeys(organization.id, serviceName)
      setApiKeys(prev => ({
        ...prev,
        [serviceName]: updatedKeys
      }))
    } catch (error) {
      console.error('Error deleting key:', error)
    }
  }

  const toggleShowKey = (fieldKey: string) => {
    setShowKeys(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your third-party service API keys. Using your own keys gives you full control and removes rate limits.
        </p>
      </div>

      {/* Subscription Status */}
      {subscription && (
        <Card className="bg-primary-50 border-primary-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {subscription.plan_type === 'free' ? (
                <AlertCircle className="h-5 w-5 text-primary-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-primary-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-primary-900">
                {subscription.plan_type === 'free' ? 'Free Plan' : `${subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1)} Plan`}
              </h3>
              <p className="mt-1 text-sm text-primary-700">
                {subscription.plan_type === 'free' ? (
                  <>You're using the system API keys with rate limits. Upgrade to use your own keys without limits.</>
                ) : (
                  <>You can use your own API keys without any rate limits.</>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Service Cards */}
      {SERVICES.map((service) => {
        const serviceKeys = apiKeys[service.name] || {}
        const hasKeys = Object.keys(serviceKeys).length > 0
        const testResult = testResults[service.name]
        
        return (
          <Card key={service.name}>
            <div className="space-y-4">
              {/* Service Header */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">{service.label}</h2>
                  {hasKeys && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Configured
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{service.description}</p>
                <a 
                  href={service.docsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  View documentation →
                </a>
              </div>

              {/* API Key Fields */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const values: Record<string, string> = {}
                  service.fields.forEach(field => {
                    const value = formData.get(field.name) as string
                    if (value) values[field.name] = value
                  })
                  handleSaveKeys(service.name, values)
                }}
                className="space-y-3"
              >
                {service.fields.map((field) => {
                  const fieldKey = `${service.name}-${field.name}`
                  const currentValue = serviceKeys[field.name] || ''
                  const showValue = showKeys[fieldKey] || field.type === 'text'
                  
                  return (
                    <div key={field.name}>
                      <label htmlFor={fieldKey} className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <div className="mt-1 relative">
                        <input
                          id={fieldKey}
                          name={field.name}
                          type={showValue ? 'text' : 'password'}
                          placeholder={currentValue ? '••••••••' : field.placeholder}
                          className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          required={field.required && !currentValue}
                        />
                        {field.type === 'password' && (
                          <button
                            type="button"
                            onClick={() => toggleShowKey(fieldKey)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showValue ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                      {currentValue && (
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Key is set (last 4 chars: ...{currentValue.slice(-4)})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteKey(service.name, field.name)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3 inline mr-1" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Test Result */}
                {testResult && (
                  <div className={`p-3 rounded-md ${
                    testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    <div className="flex items-center">
                      {testResult.success ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mr-2" />
                      )}
                      <span className="text-sm">{testResult.message}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Keys
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={testing === service.name}
                    onClick={() => {
                      const form = document.querySelector(`form`) as HTMLFormElement
                      const formData = new FormData(form)
                      const values: Record<string, string> = {}
                      service.fields.forEach(field => {
                        const value = formData.get(field.name) as string || serviceKeys[field.name]
                        if (value) values[field.name] = value
                      })
                      handleTestKeys(service.name, values)
                    }}
                    className="flex items-center"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )
      })}

      {/* Information */}
      <Card className="bg-gray-50">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Important Information</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              API keys are encrypted and stored securely. We never have access to your keys.
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              Using your own API keys gives you full control over costs and usage.
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              You can delete your keys at any time to revert to using system keys (with rate limits).
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              Make sure to keep your API keys secure and rotate them regularly.
            </li>
          </ul>
        </div>
      </Card>
    </div>
  )
}