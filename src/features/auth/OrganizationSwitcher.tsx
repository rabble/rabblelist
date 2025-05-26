import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import { Building2, Check, ChevronDown, Plus } from 'lucide-react'
import type { Tables } from '@/lib/database.types'

type Organization = Tables<'organizations'>

interface UserOrganization {
  organization_id: string
  role: string
  organization: Organization
}

export function OrganizationSwitcher() {
  const { profile, organization, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (profile?.id) {
      loadUserOrganizations()
    }
  }, [profile?.id])

  const loadUserOrganizations = async () => {
    if (!profile?.id) return

    setIsLoading(true)
    try {
      // For now, we'll simulate multi-org by checking if user is admin
      // In a real implementation, you'd have a user_organizations junction table
      const organizations: UserOrganization[] = []

      // Add current organization
      if (organization) {
        organizations.push({
          organization_id: organization.id,
          role: profile.role,
          organization
        })
      }

      // If user is admin, load all organizations (simulating multi-org access)
      if (profile.role === 'admin') {
        const { data: allOrgs, error } = await supabase
          .from('organizations')
          .select('*')
          .order('name')

        if (!error && allOrgs) {
          // Add other organizations
          allOrgs.forEach(org => {
            if (org.id !== organization?.id) {
              organizations.push({
                organization_id: org.id,
                role: 'viewer', // Simulated role in other orgs
                organization: org
              })
            }
          })
        }
      }

      setUserOrganizations(organizations)
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const switchOrganization = async (orgId: string) => {
    if (orgId === organization?.id) {
      setShowDropdown(false)
      return
    }

    try {
      // Update user's current organization
      const { error } = await updateProfile({ organization_id: orgId })
      
      if (error) {
        console.error('Error switching organization:', error)
        alert('Failed to switch organization')
        return
      }

      // Reload the page to refresh all data
      window.location.href = '/'
    } catch (error) {
      console.error('Error switching organization:', error)
      alert('Failed to switch organization')
    }
  }

  // Don't show switcher if user only has access to one org
  if (userOrganizations.length <= 1) {
    return null
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2"
      >
        <Building2 className="w-4 h-4" />
        <span className="hidden sm:inline">{organization?.name}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50 overflow-hidden">
            <div className="p-2">
              <p className="text-xs text-gray-500 px-3 py-2">
                Switch Organization
              </p>
              
              {isLoading ? (
                <div className="px-3 py-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {userOrganizations.map((userOrg) => (
                    <button
                      key={userOrg.organization_id}
                      onClick={() => switchOrganization(userOrg.organization_id)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center justify-between group"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">
                          {userOrg.organization.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {userOrg.role === 'admin' ? 'Administrator' : 
                           userOrg.role === 'ringer' ? 'Ringer' : 'Viewer'}
                        </p>
                      </div>
                      {userOrg.organization_id === organization?.id && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {profile?.role === 'admin' && (
              <div className="border-t p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setShowDropdown(false)
                    navigate('/admin/organizations/new')
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Organization
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Create a more robust version with proper multi-org support
export function OrganizationSwitcherWithJoinTable() {
  // This would be used when we have a proper user_organizations junction table
  // CREATE TABLE user_organizations (
  //   user_id UUID REFERENCES users(id),
  //   organization_id UUID REFERENCES organizations(id),
  //   role TEXT CHECK (role IN ('admin', 'member', 'viewer')),
  //   joined_at TIMESTAMPTZ DEFAULT NOW(),
  //   PRIMARY KEY (user_id, organization_id)
  // );
  
  // The implementation would query this table to get all organizations
  // the user has access to, along with their role in each org
}