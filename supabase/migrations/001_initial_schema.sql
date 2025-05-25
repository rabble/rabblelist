-- Contact Management System Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (multi-tenant support)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country_code TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}', -- Feature flags
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
    external_id TEXT, -- For import/export
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