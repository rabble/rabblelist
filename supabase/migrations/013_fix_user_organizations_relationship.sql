-- Fix user_organizations relationship with organizations table
-- This ensures the foreign key is properly exposed to PostgREST

-- First, let's drop and recreate the foreign key constraint with a proper name
ALTER TABLE user_organizations 
  DROP CONSTRAINT IF EXISTS user_organizations_organization_id_fkey;

ALTER TABLE user_organizations
  ADD CONSTRAINT user_organizations_organization_id_fkey 
  FOREIGN KEY (organization_id) 
  REFERENCES organizations(id) 
  ON DELETE CASCADE;

-- Grant necessary permissions for the relationship to be visible
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON user_organizations TO authenticated;

-- Create a view that explicitly joins the tables (as a fallback)
CREATE OR REPLACE VIEW user_organizations_with_org AS
SELECT 
  uo.user_id,
  uo.organization_id,
  uo.role,
  uo.joined_at,
  uo.invited_by,
  uo.is_primary,
  o.id as org_id,
  o.name as org_name,
  o.country_code as org_country_code,
  o.settings as org_settings,
  o.features as org_features,
  o.created_at as org_created_at,
  o.updated_at as org_updated_at
FROM user_organizations uo
INNER JOIN organizations o ON uo.organization_id = o.id;

-- Grant access to the view
GRANT SELECT ON user_organizations_with_org TO authenticated;

-- Add RLS policy for the view
ALTER VIEW user_organizations_with_org OWNER TO authenticated;

-- Refresh the schema cache (this helps PostgREST recognize the relationships)
NOTIFY pgrst, 'reload schema';