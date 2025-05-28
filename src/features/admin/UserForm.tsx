import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { 
  ArrowLeft,
  Save,
  Loader2,
  User,
  Mail,
  Phone,
  Shield,
  Key
} from 'lucide-react'

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'organizer', 'volunteer']),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type UserFormValues = z.infer<typeof userSchema>

export function UserForm() {
  const navigate = useNavigate()
  const { organization } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      full_name: '',
      phone: '',
      role: 'volunteer',
      password: ''
    }
  })

  const onSubmit = async (data: UserFormValues) => {
    if (!organization?.id) {
      alert('No organization found')
      return
    }
    
    setIsSaving(true)
    
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            organization_id: organization.id
          }
        }
      })

      if (authError) {
        throw authError
      }

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            full_name: data.full_name,
            phone: data.phone,
            role: data.role,
            organization_id: organization.id
          })

        if (profileError) {
          throw profileError
        }

        alert('User created successfully! They will receive an email to confirm their account.')
        navigate('/admin')
      }
    } catch (error: any) {
      console.error('Error creating user:', error)
      alert(error.message || 'Failed to create user')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Add New User
          </h1>
          <p className="text-gray-600 mt-1">
            Create a new organizer or volunteer account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('email')}
                    type="email"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="user@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('full_name')}
                    type="text"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.full_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.full_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    {...register('role')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                  >
                    <option value="volunteer">Volunteer</option>
                    <option value="organizer">Organizer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Admins have full access, organizers can manage campaigns, volunteers have limited access
                </p>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Temporary Password *
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('password')}
                    type="password"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="At least 6 characters"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  User will be prompted to change this on first login
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin')}
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}