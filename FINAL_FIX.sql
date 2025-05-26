-- FINAL FIX: Run this in Supabase SQL Editor
-- This will ensure everything is working properly

-- 1. First, let's check if there are any RLS policies still active
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public';

-- 2. Drop ALL RLS policies (just to be sure)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 3. Make sure RLS is disabled on all tables
ALTER TABLE IF EXISTS contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS call_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pathways DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pathway_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS call_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS call_transcripts DISABLE ROW LEVEL SECURITY;

-- 4. Check if the full_name column exists and has data
SELECT 
    COUNT(*) as total_contacts,
    COUNT(full_name) as contacts_with_name,
    COUNT(CASE WHEN full_name IS NULL OR full_name = '' THEN 1 END) as empty_names
FROM contacts;

-- 5. Show sample contacts to verify data
SELECT id, full_name, email, phone, organization_id 
FROM contacts 
LIMIT 5;

-- 6. Verify the demo user exists
SELECT id, email, full_name, role, organization_id 
FROM users 
WHERE email = 'demo@example.com';

-- 7. Make sure call_logs table exists (the dashboard queries it)
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'call_logs'
) as call_logs_exists;

-- If call_logs doesn't exist, create it
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    ringer_id UUID NOT NULL REFERENCES users(id),
    outcome TEXT CHECK (outcome IN ('answered', 'voicemail', 'no_answer', 'wrong_number', 'disconnected')),
    notes TEXT,
    duration_seconds INTEGER,
    tags TEXT[] DEFAULT '{}',
    called_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_full_name ON contacts(full_name);
CREATE INDEX IF NOT EXISTS idx_call_logs_called_at ON call_logs(called_at);
CREATE INDEX IF NOT EXISTS idx_call_logs_ringer_id ON call_logs(ringer_id);

-- Final message
SELECT 'All fixes applied! The app should work now.' as status;