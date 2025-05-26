-- Enable permissions to create triggers on auth.users
-- Run this FIRST before any other migrations

-- Grant necessary permissions to create triggers on auth schema
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres;

-- Alternative: If you're running as the postgres/service_role user, you might need:
-- This grants the authenticated role permissions to use auth functions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO service_role;

-- Note: If this still doesn't work, you need to:
-- 1. Go to Supabase Dashboard > Settings > Database
-- 2. Find "Connection string" and use the connection string with the postgres role
-- 3. Connect using a PostgreSQL client (like pgAdmin or psql) with that connection string
-- 4. Run the migrations as the postgres superuser