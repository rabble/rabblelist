import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { 
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Target,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  Mail,
  Phone,
  Globe,
  Hash,
  Zap
} from 'lucide-react'

interface PathwayStep {
  id: string
  name: string
  description: string
  order: number
  requirements?: string[]
  estimated_duration?: string
  actions?: PathwayAction[]
  engagement_type?: 'manual' | 'automated' | 'triggered'
  triggers?: PathwayTrigger[]
}

interface PathwayAction {
  id: string
  type: 'email' | 'sms' | 'call' | 'task' | 'event' | 'tag' | 'field_update'
  config: any
  delay_days?: number
}

interface PathwayTrigger {
  type: 'time_based' | 'action_completed' | 'tag_added' | 'event_attended' | 'form_submitted'
  config: any
}

export function PathwayForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'engagement',
    auto_enrollment: false,
    enrollment_criteria: {
      tags: [] as string[],
      custom_fields: [] as any[],
      source: 'all'
    },
    completion_actions: {
      add_tags: [] as string[],
      send_notification: false,
      create_certificate: false
    }
  })
  
  const [steps, setSteps] = useState<PathwayStep[]>([
    {
      id: '1',
      name: '',
      description: '',
      order: 1,
      requirements: [],
      estimated_duration: '1 week',
      actions: [],
      engagement_type: 'manual',
      triggers: []
    }
  ])

  const addStep = () => {
    const newStep: PathwayStep = {
      id: Date.now().toString(),
      name: '',
      description: '',
      order: steps.length + 1,
      requirements: [],
      estimated_duration: '1 week',
      actions: [],
      engagement_type: 'manual',
      triggers: []
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id))
  }

  const updateStep = (id: string, updates: Partial<PathwayStep>) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, ...updates } : step
    ))
  }

  const addAction = (stepId: string, action: PathwayAction) => {
    const step = steps.find(s => s.id === stepId)
    if (step) {
      updateStep(stepId, {
        actions: [...(step.actions || []), action]
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // In a real app, this would save to the database
    console.log('Saving pathway:', { ...formData, steps })
    
    // Navigate back to pathways list
    navigate('/pathways')
  }

  return (
    <Layout>
      <form onSubmit={handleSubmit} className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/pathways')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Pathway</h1>
          <p className="text-gray-600 mt-1">
            Design a journey to guide members through their organizing experience
          </p>
        </div>

        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pathway Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., New Volunteer Onboarding"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Describe the purpose and goals of this pathway"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pathway Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="engagement">Engagement - Getting people involved</option>
                <option value="leadership">Leadership - Developing leaders</option>
                <option value="skill">Skill Building - Learning specific skills</option>
                <option value="mobilization">Mobilization - Action-focused</option>
                <option value="custom">Custom - Other pathway type</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Auto-Enrollment Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enrollment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto_enrollment"
                checked={formData.auto_enrollment}
                onChange={(e) => setFormData({ ...formData, auto_enrollment: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="auto_enrollment" className="text-sm font-medium text-gray-700">
                Enable automatic enrollment
              </label>
            </div>

            {formData.auto_enrollment && (
              <div className="ml-6 space-y-3 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto-enroll contacts with these tags
                  </label>
                  <input
                    type="text"
                    placeholder="Enter tags separated by commas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="all">All sources</option>
                    <option value="signup_form">Signup form</option>
                    <option value="event_attendance">Event attendance</option>
                    <option value="import">Import</option>
                    <option value="api">API/Integration</option>
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pathway Steps */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pathway Steps</CardTitle>
              <Button type="button" size="sm" onClick={addStep}>
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Step Name
                          </label>
                          <input
                            type="text"
                            value={step.name}
                            onChange={(e) => updateStep(step.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g., Attend Orientation"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estimated Duration
                          </label>
                          <select
                            value={step.estimated_duration}
                            onChange={(e) => updateStep(step.id, { estimated_duration: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="1 day">1 day</option>
                            <option value="3 days">3 days</option>
                            <option value="1 week">1 week</option>
                            <option value="2 weeks">2 weeks</option>
                            <option value="1 month">1 month</option>
                            <option value="2 months">2 months</option>
                            <option value="3 months">3 months</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={step.description}
                          onChange={(e) => updateStep(step.id, { description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          rows={2}
                          placeholder="Describe what happens in this step"
                        />
                      </div>

                      {/* Engagement Actions */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Engagement Actions</h4>
                          <select
                            value={step.engagement_type}
                            onChange={(e) => updateStep(step.id, { engagement_type: e.target.value as any })}
                            className="text-sm px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="manual">Manual</option>
                            <option value="automated">Automated</option>
                            <option value="triggered">Triggered</option>
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => addAction(step.id, { 
                              id: Date.now().toString(), 
                              type: 'email',
                              config: {}
                            })}
                            className="flex items-center justify-center gap-1 p-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          >
                            <Mail className="w-4 h-4" />
                            Email
                          </button>
                          <button
                            type="button"
                            onClick={() => addAction(step.id, { 
                              id: Date.now().toString(), 
                              type: 'sms',
                              config: {}
                            })}
                            className="flex items-center justify-center gap-1 p-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          >
                            <MessageSquare className="w-4 h-4" />
                            SMS
                          </button>
                          <button
                            type="button"
                            onClick={() => addAction(step.id, { 
                              id: Date.now().toString(), 
                              type: 'task',
                              config: {}
                            })}
                            className="flex items-center justify-center gap-1 p-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Task
                          </button>
                          <button
                            type="button"
                            onClick={() => addAction(step.id, { 
                              id: Date.now().toString(), 
                              type: 'tag',
                              config: {}
                            })}
                            className="flex items-center justify-center gap-1 p-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          >
                            <Hash className="w-4 h-4" />
                            Tag
                          </button>
                        </div>
                        
                        {step.actions && step.actions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {step.actions.map(action => (
                              <div key={action.id} className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-medium">{action.type}</span>
                                {action.delay_days && <span>after {action.delay_days} days</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(step.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Completion Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Completion Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags to add on completion
              </label>
              <input
                type="text"
                placeholder="Enter tags separated by commas"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="send_notification"
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="send_notification" className="text-sm font-medium text-gray-700">
                Send completion notification to member
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="create_certificate"
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="create_certificate" className="text-sm font-medium text-gray-700">
                Generate completion certificate
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/pathways')}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            Create Pathway
          </Button>
        </div>
      </form>
    </Layout>
  )
}