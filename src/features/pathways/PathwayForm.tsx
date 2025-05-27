import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { usePathwayStore } from '@/stores/pathwayStore'
import { 
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Loader2,
  Target,
  Clock,
  Tag
} from 'lucide-react'

const pathwaySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  is_active: z.boolean(),
  tags: z.array(z.string()).optional()
})

type PathwayFormValues = z.infer<typeof pathwaySchema>

interface PathwayStepForm {
  id?: string
  name: string
  description: string
  order_index: number
  step_type: string
  is_required: boolean
  settings: {
    estimated_duration?: string
    requirements?: string[]
  }
}

export function PathwayForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  
  const { 
    currentPathway, 
    isLoadingPathway,
    loadPathway, 
    createPathway, 
    updatePathway,
    createStep,
    updateStep,
    deleteStep
  } = usePathwayStore()
  
  const [isSaving, setIsSaving] = useState(false)
  const [steps, setSteps] = useState<PathwayStepForm[]>([])
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<PathwayFormValues>({
    resolver: zodResolver(pathwaySchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
      tags: []
    }
  })

  const selectedTags = watch('tags') || []

  useEffect(() => {
    if (isEditing && id) {
      loadPathway(id)
    }
  }, [id, isEditing, loadPathway])

  useEffect(() => {
    if (isEditing && currentPathway) {
      reset({
        name: currentPathway.name,
        description: currentPathway.description || '',
        is_active: currentPathway.is_active,
        tags: currentPathway.tags || []
      })
      
      // Set steps from current pathway
      if (currentPathway.pathway_steps) {
        setSteps(currentPathway.pathway_steps.map(step => ({
          id: step.id,
          name: step.name,
          description: step.description || '',
          order_index: step.order_index,
          step_type: step.step_type,
          is_required: step.is_required,
          settings: step.settings || {}
        })))
      }
    }
  }, [currentPathway, isEditing, reset])

  const onSubmit = async (data: PathwayFormValues) => {
    setIsSaving(true)
    
    try {
      let pathwayId = id
      
      if (isEditing && id) {
        const success = await updatePathway(id, data)
        if (!success) {
          alert('Failed to update pathway')
          setIsSaving(false)
          return
        }
      } else {
        const newPathway = await createPathway(data)
        if (!newPathway) {
          alert('Failed to create pathway')
          setIsSaving(false)
          return
        }
        pathwayId = newPathway.id
      }

      // Save steps
      if (pathwayId) {
        // Delete removed steps
        if (isEditing && currentPathway?.pathway_steps) {
          const currentStepIds = currentPathway.pathway_steps.map(s => s.id)
          const newStepIds = steps.filter(s => s.id).map(s => s.id!)
          const deletedStepIds = currentStepIds.filter(id => !newStepIds.includes(id))
          
          for (const stepId of deletedStepIds) {
            await deleteStep(stepId)
          }
        }

        // Create or update steps
        for (const step of steps) {
          const stepData = {
            pathway_id: pathwayId,
            name: step.name,
            description: step.description,
            order_index: step.order_index,
            step_type: step.step_type || 'action',
            is_required: step.is_required,
            settings: step.settings
          }

          if (step.id) {
            await updateStep(step.id, stepData)
          } else {
            await createStep(stepData)
          }
        }
      }

      navigate('/pathways')
    } catch (error) {
      console.error('Error saving pathway:', error)
      alert('Failed to save pathway')
    } finally {
      setIsSaving(false)
    }
  }

  const addStep = () => {
    const newStep: PathwayStepForm = {
      name: '',
      description: '',
      order_index: steps.length,
      step_type: 'action',
      is_required: true,
      settings: {
        estimated_duration: '1 week'
      }
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const updateStepField = (index: number, field: keyof PathwayStepForm, value: any) => {
    setSteps(steps.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    ))
  }

  const updateStepSettings = (index: number, settings: any) => {
    setSteps(steps.map((step, i) => 
      i === index ? { ...step, settings: { ...step.settings, ...settings } } : step
    ))
  }


  const availableTags = ['engagement', 'leadership', 'skill', 'volunteer', 'donor', 'custom']

  const handleTagToggle = (tag: string) => {
    const currentTags = selectedTags || []
    if (currentTags.includes(tag)) {
      setValue('tags', currentTags.filter(t => t !== tag))
    } else {
      setValue('tags', [...currentTags, tag])
    }
  }

  if (isLoadingPathway) {
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
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/pathways')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pathways
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Pathway' : 'Create New Pathway'}
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Pathway Details */}
          <Card>
            <CardHeader>
              <CardTitle>Pathway Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Pathway Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., New Volunteer Onboarding"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe the purpose and goals of this pathway"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  {...register('is_active')}
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Active (members can be enrolled)
                </label>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pathway Steps */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pathway Steps</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  onClick={addStep}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        className="mt-2 text-gray-400 hover:text-gray-600 cursor-move"
                      >
                        <GripVertical className="w-5 h-5" />
                      </button>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <input
                            type="text"
                            value={step.name}
                            onChange={(e) => updateStepField(index, 'name', e.target.value)}
                            placeholder="Step name"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <textarea
                          value={step.description}
                          onChange={(e) => updateStepField(index, 'description', e.target.value)}
                          placeholder="Step description"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              Estimated Duration
                            </label>
                            <input
                              type="text"
                              value={step.settings.estimated_duration || ''}
                              onChange={(e) => updateStepSettings(index, { estimated_duration: e.target.value })}
                              placeholder="e.g., 1 week"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          
                          <div className="flex items-end">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={step.is_required}
                                onChange={(e) => updateStepField(index, 'is_required', e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Required step</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {steps.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No steps defined yet</p>
                    <p className="text-sm">Click "Add Step" to create your first pathway step</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/pathways')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Pathway' : 'Create Pathway'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}