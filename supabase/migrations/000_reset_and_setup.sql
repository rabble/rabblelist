-- Complete database reset and setup
-- WARNING: This will DROP all existing data!

-- Drop all tables in public schema (cascade will handle foreign keys)
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

-- Drop functions in public schema
DROP FUNCTION IF EXISTS public.get_user_organization_id() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Note: We cannot drop auth.users from here - use Supabase dashboard to manage auth users

-- Now run all migrations in order:
-- 1. 001_initial_schema.sql
-- 2. 002_rls_policies.sql  
-- 3. 003_seed_data.sql
-- 4. Create demo user in Auth dashboard (demo@example.com / demo123)
-- 5. 005_demo_data_only.sql