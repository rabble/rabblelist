-- CHECK ALL TABLE SCHEMAS TO SEE WHAT'S ACTUALLY IN THE DATABASE

-- Show all columns for each table
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('organizations', 'users', 'contacts', 'events', 'groups', 'call_logs', 'event_participants', 'group_members')
ORDER BY table_name, ordinal_position;

-- Specifically check contacts table structure
SELECT '
=== CONTACTS TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'contacts'
ORDER BY ordinal_position;

-- Check if we have full_name or first_name/last_name
SELECT '
=== CHECKING NAME COLUMNS IN CONTACTS ===' as info;
SELECT 
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'contacts'
AND column_name IN ('full_name', 'first_name', 'last_name');

-- Show sample data to see structure
SELECT '
=== SAMPLE CONTACT DATA ===' as info;
SELECT * FROM contacts LIMIT 2;

-- Check all tables
SELECT '
=== ALL TABLES IN DATABASE ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;