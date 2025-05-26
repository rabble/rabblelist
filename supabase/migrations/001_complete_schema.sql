-- Complete Schema Setup for Contact Manager PWA
-- This file drops everything and recreates the entire schema

-- Drop all existing tables and functions
DROP TABLE IF EXISTS public.call_transcripts CASCADE;
DROP TABLE IF EXISTS public.call_sessions CASCADE;
DROP TABLE IF EXISTS public.pathway_steps CASCADE;
DROP TABLE IF EXISTS public.pathways CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.contact_interactions CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP FUNCTION IF EXISTS public.get_user_organization_id() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'US',
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{"calling": true, "events": true, "imports": true, "groups": true, "pathways": true}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_contacted TIMESTAMPTZ,
    source TEXT DEFAULT 'manual',
    engagement_score INTEGER DEFAULT 0,
    UNIQUE(organization_id, email),
    UNIQUE(organization_id, phone)
);

-- Contact interactions
CREATE TABLE contact_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'task')),
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    status TEXT DEFAULT 'completed',
    duration INTEGER, -- in seconds
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'general',
    location TEXT,
    capacity INTEGER,
    settings JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_published BOOLEAN DEFAULT false,
    registration_required BOOLEAN DEFAULT false
);

-- Event registrations
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'no-show', 'cancelled')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    attended_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE(event_id, contact_id)
);

-- Groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    member_count INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    group_type TEXT DEFAULT 'manual'
);

-- Group members
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES users(id),
    role TEXT DEFAULT 'member',
    UNIQUE(group_id, contact_id)
);

-- Pathways table
CREATE TABLE pathways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pathway steps
CREATE TABLE pathway_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pathway_id UUID NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    step_type TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pathway_id, order_index)
);

-- Call sessions table
CREATE TABLE call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    contact_id UUID REFERENCES contacts(id),
    twilio_call_sid TEXT UNIQUE,
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    status TEXT DEFAULT 'initiated',
    duration INTEGER,
    recording_url TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Call transcripts table
CREATE TABLE call_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_session_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    transcript TEXT,
    summary TEXT,
    sentiment TEXT,
    keywords TEXT[],
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_contacts_organization ON contacts(organization_id);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_events_organization ON events(organization_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_groups_organization ON groups(organization_id);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_call_sessions_user ON call_sessions(user_id);
CREATE INDEX idx_call_sessions_contact ON call_sessions(contact_id);

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current user ID from auth context
  current_user_id := auth.uid();
  
  -- Return the organization ID for this user
  RETURN (
    SELECT organization_id 
    FROM users 
    WHERE id = current_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(
      (NEW.raw_user_meta_data->>'organization_id')::uuid,
      (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathway_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations policies
CREATE POLICY "Users can view their organization"
    ON organizations FOR SELECT
    USING (id = get_user_organization_id());

CREATE POLICY "Admins can update their organization"
    ON organizations FOR UPDATE
    USING (
        id = get_user_organization_id() AND 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Users policies
CREATE POLICY "Users can view users in their organization"
    ON users FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Admins can manage users in their organization"
    ON users FOR ALL
    USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Contacts policies
CREATE POLICY "Users can view contacts in their organization"
    ON contacts FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Ringers and admins can manage contacts"
    ON contacts FOR ALL
    USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'ringer'))
    );

-- Contact interactions policies
CREATE POLICY "Users can view interactions for contacts in their organization"
    ON contact_interactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_interactions.contact_id 
            AND contacts.organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Users can create their own interactions"
    ON contact_interactions FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_interactions.contact_id 
            AND contacts.organization_id = get_user_organization_id()
        )
    );

-- Events policies
CREATE POLICY "Users can view published events in their organization"
    ON events FOR SELECT
    USING (
        organization_id = get_user_organization_id() AND
        (is_published = true OR created_by = auth.uid() OR 
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    );

CREATE POLICY "Admins can manage events"
    ON events FOR ALL
    USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Event registrations policies
CREATE POLICY "Users can view registrations for events in their organization"
    ON event_registrations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_registrations.event_id 
            AND events.organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Ringers and admins can manage registrations"
    ON event_registrations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_registrations.event_id 
            AND events.organization_id = get_user_organization_id()
        ) AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'ringer'))
    );

-- Groups policies
CREATE POLICY "Users can view groups in their organization"
    ON groups FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage groups"
    ON groups FOR ALL
    USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Group members policies
CREATE POLICY "Users can view group members in their organization"
    ON group_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Admins can manage group members"
    ON group_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.organization_id = get_user_organization_id()
        ) AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Pathways policies
CREATE POLICY "Users can view pathways in their organization"
    ON pathways FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage pathways"
    ON pathways FOR ALL
    USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Pathway steps policies
CREATE POLICY "Users can view pathway steps in their organization"
    ON pathway_steps FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pathways 
            WHERE pathways.id = pathway_steps.pathway_id 
            AND pathways.organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Admins can manage pathway steps"
    ON pathway_steps FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM pathways 
            WHERE pathways.id = pathway_steps.pathway_id 
            AND pathways.organization_id = get_user_organization_id()
        ) AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Call sessions policies
CREATE POLICY "Users can view their own call sessions"
    ON call_sessions FOR SELECT
    USING (
        organization_id = get_user_organization_id() AND
        (user_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    );

CREATE POLICY "Users can create their own call sessions"
    ON call_sessions FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id() AND
        user_id = auth.uid()
    );

CREATE POLICY "Users can update their own call sessions"
    ON call_sessions FOR UPDATE
    USING (
        organization_id = get_user_organization_id() AND
        user_id = auth.uid()
    );

-- Call transcripts policies
CREATE POLICY "Users can view transcripts for their calls"
    ON call_transcripts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM call_sessions 
            WHERE call_sessions.id = call_transcripts.call_session_id 
            AND call_sessions.organization_id = get_user_organization_id()
            AND (call_sessions.user_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
        )
    );

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;