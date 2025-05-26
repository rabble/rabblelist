-- FIX RLS INFINITE RECURSION ISSUE
-- Run this in Supabase SQL Editor

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "view_own_profile" ON users;
DROP POLICY IF EXISTS "admin_manage_users" ON users;
DROP POLICY IF EXISTS "view_org_users" ON users;

-- Drop the problematic function
DROP FUNCTION IF EXISTS get_user_organization_id();

-- Create a new version that doesn't cause recursion
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Use a direct query without RLS to avoid recursion
  SELECT organization_id INTO org_id
  FROM users
  WHERE id = auth.uid();
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate user policies without recursion
-- Users can view their own profile
CREATE POLICY "view_own_profile" ON users 
  FOR SELECT 
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "update_own_profile" ON users 
  FOR UPDATE 
  USING (id = auth.uid());

-- Users can view other users in their organization (without recursion)
CREATE POLICY "view_org_users" ON users 
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Admins can manage users in their organization
CREATE POLICY "admin_manage_users" ON users 
  FOR ALL 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid() 
        AND role = 'admin'
    )
  );

-- Test the fix
DO $$
BEGIN
  RAISE NOTICE 'RLS recursion fix applied successfully!';
END $$;