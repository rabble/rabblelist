-- CONTACT MANAGER PWA - COMPLETE DATABASE SETUP
-- Run this ENTIRE file in Supabase SQL Editor
-- It will drop everything and recreate from scratch

-- STEP 1: CLEAN SLATE - DROP EVERYTHING
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

-- STEP 2: CREATE SCHEMA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'US',
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{"calling": true, "events": true, "imports": true, "groups": true, "pathways": true}',
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

-- Contacts
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
    duration INTEGER,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
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

-- Groups
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

-- Pathways
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

-- Call sessions
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

-- Call transcripts
CREATE TABLE call_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_session_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    transcript TEXT,
    summary TEXT,
    sentiment TEXT,
    keywords TEXT[],
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: CREATE INDEXES
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

-- STEP 4: CREATE HELPER FUNCTION
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: ENABLE ROW LEVEL SECURITY
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

-- STEP 6: CREATE RLS POLICIES
-- Organizations
CREATE POLICY "view_own_org" ON organizations FOR SELECT USING (id = get_user_organization_id());
CREATE POLICY "admin_update_org" ON organizations FOR UPDATE USING (id = get_user_organization_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Users
CREATE POLICY "view_org_users" ON users FOR SELECT USING (organization_id = get_user_organization_id());
CREATE POLICY "update_own_profile" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "admin_manage_users" ON users FOR ALL USING (organization_id = get_user_organization_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Contacts
CREATE POLICY "view_org_contacts" ON contacts FOR SELECT USING (organization_id = get_user_organization_id());
CREATE POLICY "ringers_manage_contacts" ON contacts FOR ALL USING (organization_id = get_user_organization_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'ringer')));

-- Events
CREATE POLICY "view_published_events" ON events FOR SELECT USING (organization_id = get_user_organization_id() AND (is_published = true OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')));
CREATE POLICY "admin_manage_events" ON events FOR ALL USING (organization_id = get_user_organization_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Groups
CREATE POLICY "view_org_groups" ON groups FOR SELECT USING (organization_id = get_user_organization_id());
CREATE POLICY "admin_manage_groups" ON groups FOR ALL USING (organization_id = get_user_organization_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Other policies (simplified)
CREATE POLICY "view_interactions" ON contact_interactions FOR SELECT USING (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_interactions.contact_id AND contacts.organization_id = get_user_organization_id()));
CREATE POLICY "create_own_interactions" ON contact_interactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "view_registrations" ON event_registrations FOR SELECT USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_registrations.event_id AND events.organization_id = get_user_organization_id()));
CREATE POLICY "view_group_members" ON group_members FOR SELECT USING (EXISTS (SELECT 1 FROM groups WHERE groups.id = group_members.group_id AND groups.organization_id = get_user_organization_id()));
CREATE POLICY "view_pathways" ON pathways FOR SELECT USING (organization_id = get_user_organization_id());
CREATE POLICY "view_pathway_steps" ON pathway_steps FOR SELECT USING (EXISTS (SELECT 1 FROM pathways WHERE pathways.id = pathway_steps.pathway_id AND pathways.organization_id = get_user_organization_id()));
CREATE POLICY "view_own_calls" ON call_sessions FOR SELECT USING (organization_id = get_user_organization_id() AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')));
CREATE POLICY "create_own_calls" ON call_sessions FOR INSERT WITH CHECK (organization_id = get_user_organization_id() AND user_id = auth.uid());
CREATE POLICY "view_call_transcripts" ON call_transcripts FOR SELECT USING (EXISTS (SELECT 1 FROM call_sessions WHERE call_sessions.id = call_transcripts.call_session_id AND call_sessions.organization_id = get_user_organization_id()));

-- STEP 7: GRANT PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- STEP 8: CREATE DEMO ORGANIZATION
INSERT INTO organizations (id, name, country_code, settings, features)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'Demo Organization',
  'US',
  '{"demo": true}'::jsonb,
  '{"calling": true, "events": true, "imports": true, "groups": true, "pathways": true}'::jsonb
);

-- DONE!
DO $$
BEGIN
  RAISE NOTICE '
✅ DATABASE SETUP COMPLETE!

Next steps:
1. Go to Authentication > Users
2. Create user: demo@example.com / demo123
3. CHECK "Auto Confirm Email" ✓
4. Run DEMO_DATA.sql to populate sample data
';
END $$;