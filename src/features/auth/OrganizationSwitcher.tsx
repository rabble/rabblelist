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
  role: 'admin' | 'ringer' | 'viewer'
  is_primary: boolean
  organization: Organization
}

export function OrganizationSwitcher() {
  const { profile, organization } = useAuth()
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
      // Try the preferred query with join first
      let { data: userOrgs, error } = await supabase
        .from('user_organizations')
        .select(`
          organization_id,
          role,
          is_primary,
          organizations (*)
        `)
        .eq('user_id', profile.id)
        .order('is_primary', { ascending: false })

      // If the join fails, try the view as fallback
      if (error?.code === 'PGRST200') {
        console.log('Falling back to view-based query')
        const { data: viewData, error: viewError } = await supabase
          .from('user_organizations_with_org')
          .select('*')
          .eq('user_id', profile.id)
          .order('is_primary', { ascending: false })

        if (!viewError && viewData) {
          userOrgs = viewData.map(row => ({
            organization_id: row.organization_id,
            role: row.role,
            is_primary: row.is_primary,
            organizations: {
              id: row.org_id,
              name: row.org_name,
              country_code: row.org_country_code,
              settings: row.org_settings,
              features: row.org_features,
              created_at: row.org_created_at,
              updated_at: row.org_updated_at
            }
          }))
        } else if (viewError) {
          throw viewError
        }
      } else if (error) {
        throw error
      }

      const organizations: UserOrganization[] = userOrgs?.map(uo => ({
        organization_id: uo.organization_id,
        role: uo.role,
        is_primary: uo.is_primary,
        organization: uo.organizations as Organization
      })) || []

      // If user doesn't have any user_organization records yet, add their current org
      if (organizations.length === 0 && organization) {
        organizations.push({
          organization_id: organization.id,
          role: profile.role,
          is_primary: true,
          organization
        })
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
      // Call the switch_organization function
      const { data, error } = await supabase
        .rpc('switch_organization', { target_org_id: orgId })

      if (error) throw error

      // Reload the page to refresh all data with new organization context
      window.location.reload()
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