-- CONTACT MANAGER PWA - DATABASE SCHEMA
-- This file contains only the database structure (tables, indexes, functions, policies)
-- For demo data, see seed-data.sql

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
    external_id TEXT,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    status TEXT CHECK (status IN ('active', 'inactive', 'pending', 'unsubscribed')) DEFAULT 'active',
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    source TEXT CHECK (source IN ('manual', 'import', 'api', 'form', 'referral', 'event')) DEFAULT 'manual',
    engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
    notes TEXT,
    last_contact_date TIMESTAMPTZ,
    total_events_attended INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, external_id)
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
    event_type TEXT,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT true,
    registration_required BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
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
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    group_type TEXT CHECK (group_type IN ('volunteer_team', 'action_team', 'donor_circle', 'leadership', 'working_group', 'other')) DEFAULT 'other',
    member_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
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
    added_by UUID REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pathways
CREATE TABLE pathways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    pathway_type TEXT CHECK (pathway_type IN ('engagement', 'fundraising', 'leadership', 'reactivation', 'onboarding', 'training', 'other')) DEFAULT 'other',
    status TEXT CHECK (status IN ('active', 'inactive', 'draft', 'archived')) DEFAULT 'draft',
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
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
    step_type TEXT CHECK (step_type IN ('action', 'wait', 'condition', 'trigger')) DEFAULT 'action',
    trigger_type TEXT CHECK (trigger_type IN ('tag', 'event', 'time', 'manual', 'email_open', 'email_click', 'form_submit', 'immediate', 'delay')),
    trigger_value TEXT,
    action_type TEXT CHECK (action_type IN ('send_email', 'send_sms', 'add_tag', 'remove_tag', 'create_task', 'schedule_call', 'move_to_group', 'email', 'sms', 'task', 'call', 'tag')),
    action_value TEXT,
    requirements JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
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
    direction TEXT CHECK (direction IN ('inbound', 'outbound')) DEFAULT 'outbound',
    status TEXT CHECK (status IN ('completed', 'missed', 'busy', 'no_answer', 'voicemail', 'scheduled', 'cancelled')) DEFAULT 'completed',
    duration INTEGER,
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
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'phonebank', 'event', 'petition', 'fundraising', 'canvassing', 'social', 'phone_bank', 'donation', 'canvas')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')) DEFAULT 'draft',
    settings JSONB DEFAULT '{}',
    goal_type TEXT CHECK (goal_type IN ('contacts', 'responses', 'donations', 'signatures', 'registrations')),
    goal_target INTEGER,
    goal INTEGER,
    current_value INTEGER DEFAULT 0,
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

-- SCHEMA SETUP COMPLETE

-- ================================================================
-- MIGRATIONS INCLUDED BELOW (previously in separate files)
-- ================================================================

-- ================================================================
-- Migration: 20250529_add_recurring_events
-- Add recurring event support to events table
-- ================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS parent_event_id UUID REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS occurrence_date DATE;

-- Create index for parent_event_id for performance
CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_events_occurrence_date ON events(occurrence_date);

-- Function to generate recurring event occurrences
CREATE OR REPLACE FUNCTION generate_recurring_events(
    parent_id UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ DEFAULT NULL
) RETURNS SETOF events AS $$
DECLARE
    parent_event events%ROWTYPE;
    recurrence JSONB;
    current_date TIMESTAMPTZ;
    occurrence_count INTEGER := 0;
    max_occurrences INTEGER;
    frequency TEXT;
    interval_value INTEGER;
    end_type TEXT;
    event_duration INTERVAL;
BEGIN
    -- Get parent event
    SELECT * INTO parent_event FROM events WHERE id = parent_id;
    IF NOT FOUND OR NOT parent_event.is_recurring OR parent_event.recurrence_rule IS NULL THEN
        RETURN;
    END IF;
    
    recurrence := parent_event.recurrence_rule;
    frequency := recurrence->>'frequency';
    interval_value := COALESCE((recurrence->>'interval')::INTEGER, 1);
    end_type := COALESCE(recurrence->>'endType', 'never');
    max_occurrences := COALESCE((recurrence->>'endAfterOccurrences')::INTEGER, 365);
    
    -- Calculate event duration
    IF parent_event.end_time IS NOT NULL THEN
        event_duration := parent_event.end_time - parent_event.start_time;
    ELSE
        event_duration := INTERVAL '2 hours';
    END IF;
    
    -- Set end date based on end type
    IF end_type = 'on' AND recurrence->>'endDate' IS NOT NULL THEN
        end_date := LEAST(end_date, (recurrence->>'endDate')::TIMESTAMPTZ);
    ELSIF end_date IS NULL THEN
        end_date := start_date + INTERVAL '1 year';
    END IF;
    
    current_date := parent_event.start_time;
    
    -- Generate occurrences
    WHILE current_date <= end_date AND (end_type != 'after' OR occurrence_count < max_occurrences) LOOP
        -- Skip if this date is in exceptions
        IF recurrence->'exceptions' IS NOT NULL AND 
           recurrence->'exceptions' @> to_jsonb(current_date::DATE::TEXT) THEN
            -- Skip this occurrence
        ELSIF current_date > parent_event.start_time THEN
            -- Create occurrence (skip the first one as it's the parent)
            parent_event.id := gen_random_uuid();
            parent_event.parent_event_id := parent_id;
            parent_event.start_time := current_date;
            parent_event.end_time := current_date + event_duration;
            parent_event.occurrence_date := current_date::DATE;
            parent_event.is_recurring := false;
            parent_event.recurrence_rule := NULL;
            parent_event.created_at := NOW();
            parent_event.updated_at := NOW();
            
            RETURN NEXT parent_event;
            occurrence_count := occurrence_count + 1;
        END IF;
        
        -- Calculate next occurrence
        CASE frequency
            WHEN 'daily' THEN
                current_date := current_date + (interval_value || ' days')::INTERVAL;
            WHEN 'weekly' THEN
                current_date := current_date + (interval_value || ' weeks')::INTERVAL;
            WHEN 'monthly' THEN
                current_date := current_date + (interval_value || ' months')::INTERVAL;
            WHEN 'yearly' THEN
                current_date := current_date + (interval_value || ' years')::INTERVAL;
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create all occurrences for a recurring event
CREATE OR REPLACE FUNCTION create_recurring_event_occurrences(parent_id UUID)
RETURNS INTEGER AS $$
DECLARE
    occurrence events%ROWTYPE;
    count INTEGER := 0;
BEGIN
    -- Delete existing occurrences first
    DELETE FROM events WHERE parent_event_id = parent_id;
    
    -- Generate and insert new occurrences
    FOR occurrence IN SELECT * FROM generate_recurring_events(parent_id, NOW()::TIMESTAMPTZ) LOOP
        INSERT INTO events VALUES (occurrence.*);
        count := count + 1;
    END LOOP;
    
    RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate occurrences when a recurring event is created/updated
CREATE OR REPLACE FUNCTION handle_recurring_event_change() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_recurring AND NEW.recurrence_rule IS NOT NULL AND NEW.parent_event_id IS NULL THEN
        -- This is a parent recurring event
        PERFORM create_recurring_event_occurrences(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS recurring_event_trigger ON events;
CREATE TRIGGER recurring_event_trigger
    AFTER INSERT OR UPDATE ON events
    FOR EACH ROW
    WHEN (NEW.is_recurring = true)
    EXECUTE FUNCTION handle_recurring_event_change();

-- ================================================================
-- Migration: 20250529_add_email_tracking
-- Create email tracking tables for tracking opens, clicks, etc
-- ================================================================

-- Email tracking events table
CREATE TABLE IF NOT EXISTS email_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  campaign_id uuid REFERENCES campaigns(id),
  contact_id uuid REFERENCES contacts(id),
  email_address text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('send', 'delivered', 'open', 'click', 'bounce', 'spam', 'unsubscribe', 'dropped')),
  event_data jsonb DEFAULT '{}',
  clicked_url text,
  bounce_reason text,
  occurrence_count int DEFAULT 1,
  user_agent text,
  ip_address inet,
  device_type text,
  email_client text,
  event_timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_email_tracking_campaign ON email_tracking_events(campaign_id);
CREATE INDEX idx_email_tracking_contact ON email_tracking_events(contact_id);
CREATE INDEX idx_email_tracking_email ON email_tracking_events(email_address);
CREATE INDEX idx_email_tracking_type ON email_tracking_events(event_type);
CREATE INDEX idx_email_tracking_timestamp ON email_tracking_events(event_timestamp);
CREATE INDEX idx_email_tracking_org ON email_tracking_events(organization_id);

-- Email links table for tracking specific links in emails
CREATE TABLE IF NOT EXISTS email_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  campaign_id uuid NOT NULL REFERENCES campaigns(id),
  original_url text NOT NULL,
  tracking_url text NOT NULL UNIQUE,
  link_alias text,
  click_count int DEFAULT 0,
  unique_click_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_email_links_tracking_url ON email_links(tracking_url);
CREATE INDEX idx_email_links_campaign ON email_links(campaign_id);

-- Add email tracking pixel URL to campaign assets
ALTER TABLE campaign_assets ADD COLUMN IF NOT EXISTS tracking_pixel_url text;
ALTER TABLE campaign_assets ADD COLUMN IF NOT EXISTS email_statistics jsonb DEFAULT '{
  "sent": 0,
  "delivered": 0,
  "opened": 0,
  "clicked": 0,
  "bounced": 0,
  "unsubscribed": 0,
  "spam_reports": 0,
  "unique_opens": 0,
  "unique_clicks": 0,
  "open_rate": 0,
  "click_rate": 0,
  "bounce_rate": 0
}';

-- Function to update email statistics
CREATE OR REPLACE FUNCTION update_email_statistics(p_campaign_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE campaign_assets
  SET email_statistics = (
    SELECT jsonb_build_object(
      'sent', COUNT(*) FILTER (WHERE event_type = 'send'),
      'delivered', COUNT(*) FILTER (WHERE event_type = 'delivered'),
      'opened', COUNT(*) FILTER (WHERE event_type = 'open'),
      'clicked', COUNT(*) FILTER (WHERE event_type = 'click'),
      'bounced', COUNT(*) FILTER (WHERE event_type = 'bounce'),
      'unsubscribed', COUNT(*) FILTER (WHERE event_type = 'unsubscribe'),
      'spam_reports', COUNT(*) FILTER (WHERE event_type = 'spam'),
      'unique_opens', COUNT(DISTINCT contact_id) FILTER (WHERE event_type = 'open'),
      'unique_clicks', COUNT(DISTINCT contact_id) FILTER (WHERE event_type = 'click'),
      'open_rate', 
        CASE 
          WHEN COUNT(*) FILTER (WHERE event_type = 'delivered') > 0 
          THEN ROUND((COUNT(DISTINCT contact_id) FILTER (WHERE event_type = 'open')::numeric / 
                      COUNT(*) FILTER (WHERE event_type = 'delivered')::numeric) * 100, 2)
          ELSE 0
        END,
      'click_rate',
        CASE 
          WHEN COUNT(*) FILTER (WHERE event_type = 'delivered') > 0 
          THEN ROUND((COUNT(DISTINCT contact_id) FILTER (WHERE event_type = 'click')::numeric / 
                      COUNT(*) FILTER (WHERE event_type = 'delivered')::numeric) * 100, 2)
          ELSE 0
        END,
      'bounce_rate',
        CASE 
          WHEN COUNT(*) FILTER (WHERE event_type = 'send') > 0 
          THEN ROUND((COUNT(*) FILTER (WHERE event_type = 'bounce')::numeric / 
                      COUNT(*) FILTER (WHERE event_type = 'send')::numeric) * 100, 2)
          ELSE 0
        END
    )
    FROM email_tracking_events
    WHERE campaign_id = p_campaign_id
  ),
  updated_at = now()
  WHERE campaign_id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update statistics when tracking events are inserted
CREATE OR REPLACE FUNCTION email_tracking_event_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Update campaign statistics
  PERFORM update_email_statistics(NEW.campaign_id);
  
  -- Update link click counts if it's a click event
  IF NEW.event_type = 'click' AND NEW.clicked_url IS NOT NULL THEN
    UPDATE email_links
    SET 
      click_count = click_count + 1,
      unique_click_count = unique_click_count + 
        CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM email_tracking_events 
            WHERE campaign_id = NEW.campaign_id 
            AND contact_id = NEW.contact_id 
            AND event_type = 'click'
            AND clicked_url = NEW.clicked_url
            AND id != NEW.id
          ) THEN 1 
          ELSE 0 
        END,
      updated_at = now()
    WHERE tracking_url = NEW.clicked_url;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_tracking_event_after_insert
AFTER INSERT ON email_tracking_events
FOR EACH ROW
EXECUTE FUNCTION email_tracking_event_trigger();

-- RLS policies
ALTER TABLE email_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_links ENABLE ROW LEVEL SECURITY;

-- Email tracking events policies
CREATE POLICY "Users can view email tracking for their organization"
  ON email_tracking_events FOR SELECT
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert email tracking for their organization"
  ON email_tracking_events FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Email links policies
CREATE POLICY "Users can view email links for their organization"
  ON email_links FOR SELECT
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage email links for their organization"
  ON email_links FOR ALL
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ================================================================
-- Migration: 20250529_add_ab_testing
-- Add A/B testing support to campaigns
-- ================================================================

-- Add A/B test configuration to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_ab_test BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ab_test_config JSONB DEFAULT '{}';

-- Create A/B test assignments table
CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id),
  variant_id text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, contact_id)
);

CREATE INDEX idx_ab_test_assignments_campaign ON ab_test_assignments(campaign_id);
CREATE INDEX idx_ab_test_assignments_variant ON ab_test_assignments(campaign_id, variant_id);

-- Create A/B test results table for tracking variant performance
CREATE TABLE IF NOT EXISTS ab_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  variant_id text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  sample_size int NOT NULL DEFAULT 0,
  conversions int NOT NULL DEFAULT 0,
  confidence_score numeric DEFAULT NULL,
  is_winner boolean DEFAULT false,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, variant_id, metric_name)
);

CREATE INDEX idx_ab_test_results_campaign ON ab_test_results(campaign_id);

-- Add variant tracking to communication logs
ALTER TABLE communication_logs ADD COLUMN IF NOT EXISTS ab_variant_id text;

-- Add variant tracking to email tracking
ALTER TABLE email_tracking_events ADD COLUMN IF NOT EXISTS ab_variant_id text;

-- Add winning variant to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS winning_variant_id text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ab_test_ended_at timestamptz;

-- Function to randomly assign contacts to variants
CREATE OR REPLACE FUNCTION assign_ab_test_variant(
  p_campaign_id uuid,
  p_contact_id uuid
) RETURNS text AS $$
DECLARE
  v_variant_id text;
  v_ab_config jsonb;
  v_random_num numeric;
  v_cumulative_allocation numeric := 0;
  v_variant jsonb;
BEGIN
  -- Check if already assigned
  SELECT variant_id INTO v_variant_id
  FROM ab_test_assignments
  WHERE campaign_id = p_campaign_id AND contact_id = p_contact_id;
  
  IF v_variant_id IS NOT NULL THEN
    RETURN v_variant_id;
  END IF;
  
  -- Get A/B test config
  SELECT ab_test_config INTO v_ab_config
  FROM campaigns
  WHERE id = p_campaign_id AND is_ab_test = true;
  
  IF v_ab_config IS NULL OR v_ab_config = '{}' THEN
    RETURN NULL;
  END IF;
  
  -- Generate random number 0-100
  v_random_num := random() * 100;
  
  -- Assign based on allocation percentages
  FOR v_variant IN SELECT * FROM jsonb_array_elements(v_ab_config->'variants')
  LOOP
    v_cumulative_allocation := v_cumulative_allocation + (v_variant->>'allocation')::numeric;
    IF v_random_num <= v_cumulative_allocation THEN
      v_variant_id := v_variant->>'id';
      EXIT;
    END IF;
  END LOOP;
  
  -- Store assignment
  INSERT INTO ab_test_assignments (campaign_id, contact_id, variant_id)
  VALUES (p_campaign_id, p_contact_id, v_variant_id);
  
  RETURN v_variant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate A/B test results
CREATE OR REPLACE FUNCTION calculate_ab_test_results(p_campaign_id uuid)
RETURNS void AS $$
DECLARE
  v_variant jsonb;
  v_variant_id text;
  v_ab_config jsonb;
  v_sample_size int;
  v_opens int;
  v_clicks int;
  v_conversions int;
  v_open_rate numeric;
  v_click_rate numeric;
  v_conversion_rate numeric;
  v_winning_criteria text;
  v_best_value numeric := 0;
  v_best_variant text;
  v_confidence numeric;
BEGIN
  -- Get A/B test config
  SELECT ab_test_config INTO v_ab_config
  FROM campaigns
  WHERE id = p_campaign_id AND is_ab_test = true;
  
  IF v_ab_config IS NULL OR v_ab_config = '{}' THEN
    RETURN;
  END IF;
  
  v_winning_criteria := v_ab_config->>'winning_criteria';
  
  -- Calculate results for each variant
  FOR v_variant IN SELECT * FROM jsonb_array_elements(v_ab_config->'variants')
  LOOP
    v_variant_id := v_variant->>'id';
    
    -- Get sample size
    SELECT COUNT(*) INTO v_sample_size
    FROM ab_test_assignments
    WHERE campaign_id = p_campaign_id AND variant_id = v_variant_id;
    
    -- Get email metrics
    SELECT 
      COUNT(DISTINCT contact_id) FILTER (WHERE event_type = 'open'),
      COUNT(DISTINCT contact_id) FILTER (WHERE event_type = 'click')
    INTO v_opens, v_clicks
    FROM email_tracking_events
    WHERE campaign_id = p_campaign_id AND ab_variant_id = v_variant_id;
    
    -- Get conversions (placeholder)
    v_conversions := 0;
    
    -- Calculate rates
    v_open_rate := CASE WHEN v_sample_size > 0 THEN v_opens::numeric / v_sample_size * 100 ELSE 0 END;
    v_click_rate := CASE WHEN v_sample_size > 0 THEN v_clicks::numeric / v_sample_size * 100 ELSE 0 END;
    v_conversion_rate := CASE WHEN v_sample_size > 0 THEN v_conversions::numeric / v_sample_size * 100 ELSE 0 END;
    
    -- Store results
    INSERT INTO ab_test_results (
      campaign_id, variant_id, metric_name, metric_value, sample_size, conversions
    ) VALUES
      (p_campaign_id, v_variant_id, 'open_rate', v_open_rate, v_sample_size, v_opens),
      (p_campaign_id, v_variant_id, 'click_rate', v_click_rate, v_sample_size, v_clicks),
      (p_campaign_id, v_variant_id, 'conversion_rate', v_conversion_rate, v_sample_size, v_conversions)
    ON CONFLICT (campaign_id, variant_id, metric_name) 
    DO UPDATE SET
      metric_value = EXCLUDED.metric_value,
      sample_size = EXCLUDED.sample_size,
      conversions = EXCLUDED.conversions,
      calculated_at = now();
    
    -- Track best variant
    IF v_winning_criteria = 'open_rate' AND v_open_rate > v_best_value THEN
      v_best_value := v_open_rate;
      v_best_variant := v_variant_id;
    ELSIF v_winning_criteria = 'click_rate' AND v_click_rate > v_best_value THEN
      v_best_value := v_click_rate;
      v_best_variant := v_variant_id;
    ELSIF v_winning_criteria = 'conversion_rate' AND v_conversion_rate > v_best_value THEN
      v_best_value := v_conversion_rate;
      v_best_variant := v_variant_id;
    END IF;
  END LOOP;
  
  -- Calculate statistical confidence (simplified)
  v_confidence := CASE 
    WHEN v_sample_size > 100 THEN 0.95
    WHEN v_sample_size > 50 THEN 0.85
    ELSE 0.50
  END;
  
  -- Mark winner if confidence threshold met
  IF v_confidence >= (v_ab_config->>'confidence_level')::numeric THEN
    UPDATE ab_test_results
    SET 
      is_winner = (variant_id = v_best_variant),
      confidence_score = v_confidence
    WHERE campaign_id = p_campaign_id;
    
    -- Update campaign with winner
    UPDATE campaigns
    SET 
      winning_variant_id = v_best_variant,
      ab_test_ended_at = now()
    WHERE id = p_campaign_id AND winning_variant_id IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- Assignments policies
CREATE POLICY "Users can view A/B test assignments for their organization"
  ON ab_test_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = ab_test_assignments.campaign_id
      AND c.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage A/B test assignments for their organization"
  ON ab_test_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = ab_test_assignments.campaign_id
      AND c.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- Results policies
CREATE POLICY "Users can view A/B test results for their organization"
  ON ab_test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = ab_test_results.campaign_id
      AND c.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage A/B test results for their organization"
  ON ab_test_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = ab_test_results.campaign_id
      AND c.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- ALL MIGRATIONS COMPLETE
-- To load demo data, run seed-data.sql