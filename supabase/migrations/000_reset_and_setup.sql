-- Complete database reset and setup
-- WARNING: This will DROP all existing data!

-- Drop all tables (cascade will handle foreign keys)
DROP TABLE IF EXISTS call_transcripts CASCADE;
DROP TABLE IF EXISTS call_sessions CASCADE;
DROP TABLE IF EXISTS pathway_steps CASCADE;
DROP TABLE IF EXISTS pathways CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS contact_interactions CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_user_organization_id() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Now run all migrations in order
-- You'll need to run these files after this:
-- 1. 001_initial_schema.sql
-- 2. 002_rls_policies.sql  
-- 3. 003_seed_data.sql
-- 4. 004_multi_org_support.sql (if needed)
-- 5. Create demo user in Auth dashboard
-- 6. 005_demo_data_only.sql