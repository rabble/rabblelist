-- Multi-organization support
-- This migration adds proper many-to-many relationship between users and organizations

-- Create user_organizations junction table
CREATE TABLE IF NOT EXISTS user_organizations (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'member', 'viewer')) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, organization_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org_id ON user_organizations(organization_id);

-- Migrate existing data
-- Insert current user-org relationships into the new table
INSERT INTO user_organizations (user_id, organization_id, role)
SELECT id, organization_id, role 
FROM users 
WHERE organization_id IS NOT NULL
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Add function to get user's organizations
CREATE OR REPLACE FUNCTION user_organizations_list(user_uuid UUID)
RETURNS TABLE (
    organization_id UUID,
    organization_name TEXT,
    role TEXT,
    joined_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uo.organization_id,
        o.name as organization_name,
        uo.role,
        uo.joined_at
    FROM user_organizations uo
    JOIN organizations o ON o.id = uo.organization_id
    WHERE uo.user_id = user_uuid
    ORDER BY o.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to switch organization
CREATE OR REPLACE FUNCTION switch_organization(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN;
BEGIN
    -- Check if user has access to the organization
    SELECT EXISTS (
        SELECT 1 
        FROM user_organizations 
        WHERE user_id = user_uuid 
        AND organization_id = org_uuid
    ) INTO has_access;
    
    IF has_access THEN
        -- Update the user's current organization
        UPDATE users 
        SET organization_id = org_uuid,
            updated_at = NOW()
        WHERE id = user_uuid;
        
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for user_organizations
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Users can see their own organization memberships
CREATE POLICY "Users can view their organization memberships"
    ON user_organizations
    FOR SELECT
    USING (user_id = auth.uid());

-- Organization admins can manage memberships
CREATE POLICY "Organization admins can manage memberships"
    ON user_organizations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM user_organizations uo
            WHERE uo.organization_id = user_organizations.organization_id
            AND uo.user_id = auth.uid()
            AND uo.role = 'admin'
        )
    );

-- Add invitation system tables (optional but useful)
CREATE TABLE organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'member', 'viewer')) NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES users(id),
    token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for token lookups
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);

-- RLS for invitations
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Only org admins can create/view invitations
CREATE POLICY "Organization admins can manage invitations"
    ON organization_invitations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM user_organizations
            WHERE organization_id = organization_invitations.organization_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );