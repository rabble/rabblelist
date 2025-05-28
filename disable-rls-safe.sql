-- DISABLE RLS ON EXISTING TABLES ONLY
-- This safely disables RLS only on tables that exist

DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    -- Loop through all tables that have RLS enabled
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'organizations',
            'users',
            'user_organizations',
            'contacts',
            'contact_interactions',
            'groups',
            'group_members',
            'campaigns',
            'campaign_activities',
            'events',
            'event_registrations',
            'pathways',
            'pathway_steps',
            'pathway_members',
            'contact_pathways',
            'communication_logs',
            'petition_signatures',
            'phonebank_sessions',
            'campaign_stats'
        )
    LOOP
        -- Disable RLS on each table
        EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', 
                      table_record.schemaname, 
                      table_record.tablename);
        RAISE NOTICE 'Disabled RLS on %.%', table_record.schemaname, table_record.tablename;
    END LOOP;
END $$;

-- Show which tables exist and their RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;