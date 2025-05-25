#!/bin/bash

# Supabase Database Setup Script
# This script helps you set up the database by combining all SQL files

echo "Creating combined SQL file for easy execution..."

cat > supabase/migrations/000_complete_setup.sql << 'EOF'
-- Contact Management System Complete Setup
-- Run this entire file in Supabase SQL Editor

-- =============================================
-- 1. INITIAL SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (multi-tenant support)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country_code TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'ringer', 'viewer')) DEFAULT 'ringer',
    phone TEXT,
    settings JSONB DEFAULT '{}',
    last_active TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    external_id TEXT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    last_contact_date TIMESTAMPTZ,
    total_events_attended INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, external_id)
);

-- Call Logs
CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    ringer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    outcome TEXT CHECK (outcome IN ('answered', 'voicemail', 'no_answer', 'wrong_number', 'disconnected')) NOT NULL,
    notes TEXT,
    duration_seconds INTEGER,
    tags TEXT[] DEFAULT '{}',
    called_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    capacity INTEGER,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Participants
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('registered', 'attended', 'no_show', 'cancelled')) DEFAULT 'registered',
    checked_in_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, contact_id)
);

-- Call Assignments
CREATE TABLE call_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    ringer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    priority INTEGER DEFAULT 0,
    UNIQUE(ringer_id, contact_id)
);

-- Indexes for performance
CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_contacts_phone ON contacts(organization_id, phone);
CREATE INDEX idx_call_logs_ringer ON call_logs(ringer_id, called_at DESC);
CREATE INDEX idx_call_logs_contact ON call_logs(contact_id, called_at DESC);
CREATE INDEX idx_assignments_ringer ON call_assignments(ringer_id, completed_at NULLS FIRST);
CREATE INDEX idx_events_org ON events(organization_id);
CREATE INDEX idx_event_participants_event ON event_participants(event_id);
CREATE INDEX idx_event_participants_contact ON event_participants(contact_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update contact's last contact date after call log
CREATE OR REPLACE FUNCTION update_contact_last_contact_date()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE contacts
    SET last_contact_date = NEW.called_at
    WHERE id = NEW.contact_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_call_log_insert
AFTER INSERT ON call_logs
FOR EACH ROW EXECUTE FUNCTION update_contact_last_contact_date();

-- =============================================
-- 2. ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_assignments ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization_id
CREATE OR REPLACE FUNCTION auth.organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM public.users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin'
        FROM public.users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations Policies
CREATE POLICY "Users can view their organization"
    ON organizations FOR SELECT
    USING (id = auth.organization_id());

CREATE POLICY "Only admins can update organization"
    ON organizations FOR UPDATE
    USING (id = auth.organization_id() AND auth.is_admin());

-- Users Policies
CREATE POLICY "Users can view users in their organization"
    ON users FOR SELECT
    USING (organization_id = auth.organization_id());

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Admins can manage users in their organization"
    ON users FOR ALL
    USING (organization_id = auth.organization_id() AND auth.is_admin());

-- Contacts Policies
CREATE POLICY "Users can view contacts in their organization"
    ON contacts FOR SELECT
    USING (organization_id = auth.organization_id());

CREATE POLICY "Ringers and admins can create contacts"
    ON contacts FOR INSERT
    WITH CHECK (organization_id = auth.organization_id());

CREATE POLICY "Ringers and admins can update contacts"
    ON contacts FOR UPDATE
    USING (organization_id = auth.organization_id());

CREATE POLICY "Only admins can delete contacts"
    ON contacts FOR DELETE
    USING (organization_id = auth.organization_id() AND auth.is_admin());

-- Call Logs Policies
CREATE POLICY "Users can view call logs in their organization"
    ON call_logs FOR SELECT
    USING (organization_id = auth.organization_id());

CREATE POLICY "Ringers can create their own call logs"
    ON call_logs FOR INSERT
    WITH CHECK (
        organization_id = auth.organization_id() AND 
        ringer_id = auth.uid()
    );

CREATE POLICY "Users can update their own call logs"
    ON call_logs FOR UPDATE
    USING (
        organization_id = auth.organization_id() AND 
        ringer_id = auth.uid()
    );

-- Events Policies
CREATE POLICY "Users can view events in their organization"
    ON events FOR SELECT
    USING (organization_id = auth.organization_id());

CREATE POLICY "Only admins can manage events"
    ON events FOR ALL
    USING (organization_id = auth.organization_id() AND auth.is_admin());

-- Event Participants Policies
CREATE POLICY "Users can view participants for events in their organization"
    ON event_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_participants.event_id 
            AND events.organization_id = auth.organization_id()
        )
    );

CREATE POLICY "Admins can manage event participants"
    ON event_participants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_participants.event_id 
            AND events.organization_id = auth.organization_id()
            AND auth.is_admin()
        )
    );

-- Call Assignments Policies
CREATE POLICY "Ringers can view their own assignments"
    ON call_assignments FOR SELECT
    USING (ringer_id = auth.uid());

CREATE POLICY "Admins can view all assignments in their organization"
    ON call_assignments FOR SELECT
    USING (organization_id = auth.organization_id() AND auth.is_admin());

CREATE POLICY "Admins can manage assignments"
    ON call_assignments FOR ALL
    USING (organization_id = auth.organization_id() AND auth.is_admin());

CREATE POLICY "Ringers can update their own assignments (mark complete)"
    ON call_assignments FOR UPDATE
    USING (ringer_id = auth.uid());

-- =============================================
-- 3. SEED DATA
-- =============================================

-- Create a test organization
INSERT INTO organizations (id, name, country_code, features)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Test Organization',
    'US',
    '{"calling": true, "events": true, "imports": true}'::jsonb
);

-- Insert test contacts
INSERT INTO contacts (organization_id, full_name, phone, email, tags, total_events_attended, last_contact_date)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'John Smith', '+1 (555) 123-4567', 'john.smith@example.com', ARRAY['volunteer', 'donor'], 3, NOW() - INTERVAL '7 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sarah Johnson', '+1 (555) 234-5678', 'sarah.j@example.com', ARRAY['volunteer'], 1, NOW() - INTERVAL '14 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Michael Brown', '+1 (555) 345-6789', null, ARRAY['donor', 'member'], 0, null),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Emily Davis', '+1 (555) 456-7890', 'emily.davis@example.com', ARRAY['volunteer', 'member'], 5, NOW() - INTERVAL '30 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Robert Wilson', '+1 (555) 567-8901', null, ARRAY['prospect'], 0, null),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Maria Garcia', '+1 (555) 678-9012', 'maria.g@example.com', ARRAY['volunteer', 'donor'], 8, NOW() - INTERVAL '3 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'David Lee', '+1 (555) 789-0123', 'david.lee@example.com', ARRAY['member'], 2, NOW() - INTERVAL '45 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Jennifer Martinez', '+1 (555) 890-1234', null, ARRAY['volunteer'], 4, NOW() - INTERVAL '10 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'William Anderson', '+1 (555) 901-2345', 'w.anderson@example.com', ARRAY['donor'], 1, NOW() - INTERVAL '60 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lisa Thompson', '+1 (555) 012-3456', 'lisa.t@example.com', ARRAY['volunteer', 'member'], 6, NOW() - INTERVAL '5 days');

-- Insert test events
INSERT INTO events (organization_id, name, description, location, start_time, end_time)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Community Outreach Event', 'Monthly community gathering', '123 Main St, Anytown USA', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Volunteer Training', 'New volunteer orientation', 'Community Center', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '2 hours'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fundraising Gala', 'Annual fundraising event', 'Grand Hotel Ballroom', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days' + INTERVAL '4 hours');

-- Function to create user record after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, organization_id, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Default to test organization
        'ringer' -- Default role
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EOF

echo "✅ Combined SQL file created at: supabase/migrations/000_complete_setup.sql"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/oxtjonaiubulnggytezf"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the entire contents of supabase/migrations/000_complete_setup.sql"
echo "4. Click 'Run' to execute"
echo ""
echo "Then:"
echo "1. Go to Authentication → Settings → Auth Providers"
echo "2. Enable 'Email' provider"
echo "3. Create a new user in Authentication → Users"
echo ""
echo "Your app is configured and ready to run with:"
echo "npm run dev"