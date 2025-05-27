import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const groupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['geographic', 'interest', 'working', 'affinity']),
  parent_id: z.string().optional(),
  active: z.boolean().default(true)
})

type GroupFormData = z.infer<typeof groupSchema>

export function GroupForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<any[]>([])
  
  const isEdit = !!id

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      type: 'interest',
      active: true
    }
  })

  useEffect(() => {
    loadParentGroups()
    if (isEdit && id) {
      loadGroup(id)
    }
  }, [id, isEdit])

  const loadParentGroups = async () => {
    try {
      const { data } = await supabase
        .from('groups')
        .select('id, name')
        .eq('active', true)
        .order('name')
      
      setGroups(data || [])
    } catch (error) {
      console.error('Failed to load parent groups:', error)
    }
  }

  const loadGroup = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()
      
      if (error) throw error
      
      if (data) {
        reset({
          name: data.name,
          description: data.description || '',
          type: data.type,
          parent_id: data.parent_id || '',
          active: data.active
        })
      }
    } catch (error) {
      console.error('Failed to load group:', error)
      alert('Failed to load group')
      navigate('/groups')
    }
  }

  const onSubmit = async (data: GroupFormData) => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) throw new Error('Not authenticated')
      
      // Get user's organization
      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single()
      
      if (!profile?.organization_id) {
        throw new Error('Organization not found')
      }

      if (isEdit && id) {
        // Update existing group
        const { error } = await supabase
          .from('groups')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
        
        if (error) throw error
      } else {
        // Create new group
        const { error } = await supabase
          .from('groups')
          .insert({
            ...data,
            organization_id: profile.organization_id,
            created_by: userData.user.id
          })
        
        if (error) throw error
      }

      navigate('/groups')
    } catch (error: any) {
      console.error('Failed to save group:', error)
      alert(error.message || 'Failed to save group')
    } finally {
      setLoading(false)
    }
  }

  const groupTypes = [
    { value: 'geographic', label: 'Geographic', description: 'Based on location (neighborhoods, regions)' },
    { value: 'interest', label: 'Interest', description: 'Shared interests or issues' },
    { value: 'working', label: 'Working Group', description: 'Task-focused committees' },
    { value: 'affinity', label: 'Affinity', description: 'Shared identity or experience' }
  ]

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/groups')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Groups
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Group' : 'Create New Group'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update group information' : 'Set up a new organizational unit'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Group Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Downtown Climate Action"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe the group's purpose and activities..."
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Type *
                </label>
                <div className="space-y-2">
                  {groupTypes.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        {...register('type')}
                        value={type.value}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              {/* Parent Group */}
              {groups.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Group (Optional)
                  </label>
                  <select
                    {...register('parent_id')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">No parent group</option>
                    {groups
                      .filter(g => g.id !== id) // Don't allow group to be its own parent
                      .map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-600">
                    Select if this group is a subgroup of another
                  </p>
                </div>
              )}

              {/* Active Status */}
              {isEdit && (
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('active')}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Group is active
                    </span>
                  </label>
                  <p className="mt-1 text-sm text-gray-600">
                    Inactive groups are hidden from most views
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-initial"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : (isEdit ? 'Update Group' : 'Create Group')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/groups')}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}