import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { Mail, UserPlus, Copy, Check, AlertCircle } from 'lucide-react'

export function OrganizationInvite() {
  const { profile, organization } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'ringer' | 'viewer'>('ringer')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  // Only admins can invite users
  if (profile?.role !== 'admin') {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-yellow-600">
              <AlertCircle className="w-5 h-5" />
              <p>Only administrators can invite users to the organization.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !organization) return

    setIsInviting(true)
    setError('')
    setInviteLink('')

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        // Add existing user to organization
        const { error: addError } = await supabase
          .from('user_organizations')
          .insert({
            user_id: existingUser.id,
            organization_id: organization.id,
            role,
            invited_by: profile?.id
          })

        if (addError) {
          if (addError.code === '23505') {
            setError('This user is already a member of your organization.')
          } else {
            throw addError
          }
        } else {
          setEmail('')
          alert('User added to organization successfully!')
        }
      } else {
        // Generate invite link for new user
        const inviteToken = crypto.randomUUID()
        const baseUrl = window.location.origin
        const link = `${baseUrl}/invite?token=${inviteToken}&org=${organization.id}&role=${role}&email=${encodeURIComponent(email)}`
        
        // In a real app, you would:
        // 1. Store the invite token in the database with expiry
        // 2. Send an email with the invite link
        // 3. Handle the invite acceptance flow
        
        setInviteLink(link)
        
        // For now, just show the link
        console.log('Invite link generated:', link)
      }
    } catch (err) {
      console.error('Error inviting user:', err)
      setError('Failed to invite user. Please try again.')
    } finally {
      setIsInviting(false)
    }
  }

  const handleCopyLink = async () => {
    if (!inviteLink) return
    
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Invite Users</h1>
          <p className="text-gray-600 mt-1">
            Add new members to {organization?.name}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="viewer">Viewer - Can view data only</option>
                  <option value="ringer">Ringer - Can make calls and manage contacts</option>
                  <option value="admin">Admin - Full access to all features</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                isLoading={isInviting}
                disabled={isInviting || !email}
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </form>

            {inviteLink && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Invitation link generated!
                </p>
                <p className="text-sm text-blue-700 mb-3">
                  Share this link with the user to join your organization:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-md text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Note: In production, this would be sent via email.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Current Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>To view and manage organization members, visit the</p>
              <Button
                variant="link"
                onClick={() => navigate('/admin')}
                className="p-0 h-auto font-medium"
              >
                Admin Dashboard →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}