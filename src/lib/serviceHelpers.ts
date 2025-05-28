import { supabase } from './supabase'

/**
 * Get the current user's organization ID
 * This should be used by all services to ensure proper data isolation
 */
export async function getCurrentOrganizationId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile, error } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (error || !profile?.organization_id) {
    throw new Error('Organization not found')
  }

  return profile.organization_id
}

/**
 * Get the current user's profile with organization info
 */
export async function getCurrentUserProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile, error } = await supabase
    .from('users')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    throw new Error('Profile not found')
  }

  return profile
}

/**
 * Validate that a resource belongs to the current user's organization
 * Use this before update/delete operations
 */
export async function validateResourceOwnership(
  table: string,
  resourceId: string,
  organizationId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .select('organization_id')
    .eq('id', resourceId)
    .single()

  if (error || !data) {
    return false
  }

  return data.organization_id === organizationId
}