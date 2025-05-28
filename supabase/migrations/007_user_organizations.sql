-- Create user_organizations junction table for multi-org support
CREATE TABLE IF NOT EXISTS user_organizations (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'ringer', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES users(id),
  is_primary BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, organization_id)
);

-- Add indexes for performance
CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org_id ON user_organizations(organization_id);

-- RLS policies
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Users can see their own organization memberships
CREATE POLICY "Users can view own organization memberships" ON user_organizations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Organization admins can view all memberships in their org
CREATE POLICY "Org admins can view organization memberships" ON user_organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.organization_id = user_organizations.organization_id
      AND users.role = 'admin'
    )
  );

-- Organization admins can add users to their org
CREATE POLICY "Org admins can add users to organization" ON user_organizations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.organization_id = user_organizations.organization_id
      AND users.role = 'admin'
    )
  );

-- Organization admins can update roles in their org
CREATE POLICY "Org admins can update roles" ON user_organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.organization_id = user_organizations.organization_id
      AND users.role = 'admin'
    )
  );

-- Organization admins can remove users from their org
CREATE POLICY "Org admins can remove users" ON user_organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.organization_id = user_organizations.organization_id
      AND users.role = 'admin'
    )
  );

-- Function to get user's current organization
CREATE OR REPLACE FUNCTION get_user_current_organization()
RETURNS UUID AS $$
DECLARE
  current_org_id UUID;
BEGIN
  -- First check if user has a primary organization
  SELECT organization_id INTO current_org_id
  FROM user_organizations
  WHERE user_id = auth.uid()
  AND is_primary = TRUE
  LIMIT 1;
  
  -- If no primary, get from users table
  IF current_org_id IS NULL THEN
    SELECT organization_id INTO current_org_id
    FROM users
    WHERE id = auth.uid();
  END IF;
  
  RETURN current_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to switch user's current organization
CREATE OR REPLACE FUNCTION switch_organization(target_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Check if user has access to target organization
  SELECT EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid()
    AND organization_id = target_org_id
  ) INTO has_access;
  
  IF NOT has_access THEN
    RAISE EXCEPTION 'User does not have access to this organization';
  END IF;
  
  -- Update user's current organization
  UPDATE users
  SET organization_id = target_org_id,
      updated_at = NOW()
  WHERE id = auth.uid();
  
  -- Update primary organization
  UPDATE user_organizations
  SET is_primary = CASE 
    WHEN organization_id = target_org_id THEN TRUE
    ELSE FALSE
  END
  WHERE user_id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migrate existing users to user_organizations
INSERT INTO user_organizations (user_id, organization_id, role, is_primary)
SELECT 
  u.id,
  u.organization_id,
  u.role,
  TRUE
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_organizations uo
  WHERE uo.user_id = u.id
  AND uo.organization_id = u.organization_id
)
ON CONFLICT DO NOTHING;