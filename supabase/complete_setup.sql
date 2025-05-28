-- CONTACT MANAGER PWA - COMPLETE DATABASE SETUP
-- Run this ENTIRE file in Supabase SQL Editor
-- It will drop everything and recreate from scratch with all features

-- STEP 1: CLEAN SLATE - DROP EVERYTHING
DROP TABLE IF EXISTS public.org_api_keys CASCADE;
DROP TABLE IF EXISTS public.api_usage_logs CASCADE;
DROP TABLE IF EXISTS public.org_billing CASCADE;
DROP TABLE IF EXISTS public.petition_signatures CASCADE;
DROP TABLE IF EXISTS public.phonebank_sessions CASCADE;
DROP TABLE IF EXISTS public.communication_logs CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.pathway_members CASCADE;
DROP TABLE IF EXISTS public.contact_pathways CASCADE;
DROP TABLE IF EXISTS public.campaign_activities CASCADE;
DROP TABLE IF EXISTS public.campaign_stats CASCADE;
DROP TABLE IF EXISTS public.campaign_communications CASCADE;
DROP TABLE IF EXISTS public.campaign_donations CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.user_organizations CASCADE;
DROP TABLE IF EXISTS public.webhook_events CASCADE;
DROP TABLE IF EXISTS public.webhook_configs CASCADE;
DROP TABLE IF EXISTS public.call_transcripts CASCADE;
DROP TABLE IF EXISTS public.call_sessions CASCADE;
DROP TABLE IF EXISTS public.pathway_steps CASCADE;
DROP TABLE IF EXISTS public.pathways CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.contact_interactions CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Drop views
DROP VIEW IF EXISTS public.user_organizations_with_org CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.get_user_organization_id() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_current_organization() CASCADE;
DROP FUNCTION IF EXISTS public.switch_organization(UUID) CASCADE;

-- STEP 2: CREATE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- STEP 3: CREATE CORE TABLES

-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'US',
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{"calling": true, "events": true, "imports": true, "groups": true, "pathways": true, "campaigns": true, "automation": true}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (linked to auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    role TEXT NOT NULL CHECK (role IN ('admin', 'ringer', 'viewer')) DEFAULT 'ringer',
    settings JSONB DEFAULT '{}',
    phone TEXT,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Organizations (multi-org support)
CREATE TABLE user_organizations (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'ringer', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES users(id),
  is_primary BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, organization_id)
);

-- Contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    notes TEXT,
    last_contact_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    capacity INTEGER,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Registrations
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT CHECK (status IN ('registered', 'attended', 'no_show', 'cancelled')) DEFAULT 'registered',
    registration_source TEXT DEFAULT 'manual',
    notes TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES groups(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Members
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pathways
CREATE TABLE pathways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pathway Steps
CREATE TABLE pathway_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pathway_id UUID NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    step_order INTEGER NOT NULL,
    requirements JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pathway Members
CREATE TABLE pathway_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pathway_id UUID NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    current_step INTEGER DEFAULT 1,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact Pathways (legacy - kept for compatibility)
CREATE TABLE contact_pathways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    pathway_id UUID NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 1,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact Interactions
CREATE TABLE contact_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('call', 'text', 'email', 'event', 'note', 'tag_added', 'tag_removed')),
    outcome TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: CAMPAIGNS SYSTEM

-- Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'phonebank', 'event', 'petition', 'fundraising', 'canvassing', 'social')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')) DEFAULT 'draft',
    settings JSONB DEFAULT '{}',
    goal_type TEXT CHECK (goal_type IN ('contacts', 'responses', 'donations', 'signatures', 'registrations')),
    goal_target INTEGER,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Activities
CREATE TABLE campaign_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    activity_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    outcome TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Stats
CREATE TABLE campaign_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    stat_type TEXT NOT NULL,
    stat_value INTEGER NOT NULL DEFAULT 0,
    stat_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, stat_type, stat_date)
);

-- Campaign Communications
CREATE TABLE campaign_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'call')),
    status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')) DEFAULT 'sent',
    subject TEXT,
    content TEXT,
    metadata JSONB DEFAULT '{}',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ
);

-- Campaign Donations
CREATE TABLE campaign_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    payment_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    donated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 5: SPECIALIZED TABLES

-- Petition Signatures
CREATE TABLE petition_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    comment TEXT,
    is_public BOOLEAN DEFAULT true,
    ip_address INET,
    user_agent TEXT,
    signed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phone Bank Sessions
CREATE TABLE phonebank_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    call_duration INTEGER, -- in seconds
    outcome TEXT CHECK (outcome IN ('answered', 'voicemail', 'busy', 'no_answer', 'wrong_number', 'do_not_call')),
    notes TEXT,
    script_used TEXT,
    follow_up_needed BOOLEAN DEFAULT false,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- Communication Logs
CREATE TABLE communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'call', 'voicemail')),
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
    to_address TEXT,
    from_address TEXT,
    subject TEXT,
    content TEXT,
    provider TEXT,
    provider_id TEXT,
    metadata JSONB DEFAULT '{}',
    cost_cents INTEGER,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ
);

-- STEP 6: WEBHOOK SYSTEM

-- Webhook Configurations
CREATE TABLE webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_triggered_at TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0
);

-- Webhook Events
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    response_status INTEGER,
    response_body TEXT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

-- STEP 7: API KEYS AND BILLING

-- Organization API Keys
CREATE TABLE org_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    permissions JSONB DEFAULT '{"read": true, "write": false}',
    service_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Usage Logs
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    api_key_id UUID REFERENCES org_api_keys(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    response_status INTEGER,
    response_time_ms INTEGER,
    usage_date DATE DEFAULT CURRENT_DATE,
    hour_bucket INTEGER DEFAULT EXTRACT(HOUR FROM NOW()),
    request_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Billing
CREATE TABLE org_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL DEFAULT 'free',
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 month',
    usage_limits JSONB DEFAULT '{"contacts": 1000, "monthly_emails": 5000, "monthly_sms": 1000, "api_calls_per_hour": 100}',
    current_usage JSONB DEFAULT '{"contacts": 0, "monthly_emails": 0, "monthly_sms": 0}',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 8: INDEXES FOR PERFORMANCE

-- Primary indexes
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_last_contact_date ON contacts(last_contact_date);

CREATE INDEX idx_events_organization_id ON events(organization_id);
CREATE INDEX idx_events_start_time ON events(start_time);

CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_contact_id ON event_registrations(contact_id);
CREATE INDEX idx_event_registrations_organization_id ON event_registrations(organization_id);

CREATE INDEX idx_groups_organization_id ON groups(organization_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_contact_id ON group_members(contact_id);

CREATE INDEX idx_pathways_organization_id ON pathways(organization_id);
CREATE INDEX idx_pathway_members_pathway_id ON pathway_members(pathway_id);
CREATE INDEX idx_pathway_members_contact_id ON pathway_members(contact_id);

CREATE INDEX idx_contact_interactions_contact_id ON contact_interactions(contact_id);
CREATE INDEX idx_contact_interactions_organization_id ON contact_interactions(organization_id);
CREATE INDEX idx_contact_interactions_type ON contact_interactions(type);
CREATE INDEX idx_contact_interactions_created_at ON contact_interactions(created_at);

CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org_id ON user_organizations(organization_id);

CREATE INDEX idx_campaigns_organization_id ON campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);

CREATE INDEX idx_campaign_activities_campaign_id ON campaign_activities(campaign_id);
CREATE INDEX idx_campaign_activities_contact_id ON campaign_activities(contact_id);
CREATE INDEX idx_campaign_activities_organization_id ON campaign_activities(organization_id);

CREATE INDEX idx_webhook_configs_organization_id ON webhook_configs(organization_id);
CREATE INDEX idx_webhook_events_webhook_id ON webhook_events(webhook_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);

CREATE INDEX idx_api_usage_logs_organization_id ON api_usage_logs(organization_id);
CREATE INDEX idx_api_usage_logs_date_hour ON api_usage_logs(usage_date, hour_bucket);

-- STEP 9: ROW LEVEL SECURITY

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathway_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathway_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE phonebank_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_billing ENABLE ROW LEVEL SECURITY;

-- STEP 10: RLS POLICIES

-- Users can see their own organization
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
            UNION
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

-- Users can see their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

-- Users can update their own profile  
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- User organizations policies
CREATE POLICY "Users can view own organization memberships" ON user_organizations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Org admins can view organization memberships" ON user_organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.organization_id = user_organizations.organization_id
            AND users.role = 'admin'
        )
    );

-- Organization-scoped policies for main tables
CREATE POLICY "Organization members can view contacts" ON contacts
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
            UNION
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can insert contacts" ON contacts
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
            UNION
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can update contacts" ON contacts
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
            UNION
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can delete contacts" ON contacts
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
            UNION
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

-- Apply similar patterns to other organization-scoped tables
-- (Events, Groups, Pathways, Campaigns, etc.)

CREATE POLICY "Organization members can access events" ON events
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
            UNION
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can access event registrations" ON event_registrations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
            UNION
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can access groups" ON groups
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
            UNION
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can access group members" ON group_members
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
            UNION
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can access pathways" ON pathways
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
            UNION
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can access campaigns" ON campaigns
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
            UNION
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

-- STEP 11: FUNCTIONS

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

-- Function to get user organization ID (legacy compatibility)
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN get_user_current_organization();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Insert user into public.users table
    INSERT INTO public.users (id, email, full_name, organization_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        (SELECT id FROM organizations LIMIT 1) -- Default to first org
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- STEP 12: CREATE VIEW FOR ORGANIZATION RELATIONSHIP

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

-- STEP 13: GRANT PERMISSIONS

GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON user_organizations TO authenticated;
GRANT SELECT ON user_organizations_with_org TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- STEP 14: CREATE DEFAULT ORGANIZATION

INSERT INTO organizations (id, name, country_code, settings, features)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo Organization',
    'US',
    '{"timezone": "America/New_York", "calling_hours": {"start": "09:00", "end": "20:00"}}',
    '{"calling": true, "events": true, "imports": true, "groups": true, "pathways": true, "campaigns": true, "automation": true, "api_access": true}'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    settings = EXCLUDED.settings,
    features = EXCLUDED.features,
    updated_at = NOW();

-- Create demo user
INSERT INTO users (id, email, full_name, organization_id, role)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'demo@example.com',
    'Demo User',
    '00000000-0000-0000-0000-000000000001',
    'admin'
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Add demo user to user_organizations
INSERT INTO user_organizations (user_id, organization_id, role, is_primary)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'admin',
    true
)
ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role = EXCLUDED.role,
    is_primary = EXCLUDED.is_primary;

-- SETUP COMPLETE
-- You can now add demo data by running the seed file separately