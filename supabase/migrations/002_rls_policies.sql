-- Row Level Security Policies
-- Run this after creating the tables

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