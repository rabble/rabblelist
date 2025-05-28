# Setting Up Demo User - Complete Guide

## Complete Database Setup (2 Files Only!)

We've simplified everything into just 2 migration files:

### Step 1: Run Schema Setup
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/sql)
2. Copy and paste the contents of `supabase/schema.sql`
3. Run it - this will:
   - Drop all existing tables
   - Create all tables with proper structure
   - Set up RLS policies
   - Create triggers and functions

### Step 2: Create Demo User in Auth
1. Go to [Authentication > Users](https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/auth/users)
2. Click "Add user" → "Create new user"
3. Enter:
   - Email: `demo@example.com`
   - Password: `demo123`
   - Auto Confirm Email: ✓ (check this box - IMPORTANT!)
4. Click "Create user"

### Step 3: Run Seed Data
1. Go back to [SQL Editor](https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/sql)
2. Copy and paste the contents of `supabase/seed-data.sql`
3. Run it - this will:
   - Create demo organization "Rise Community Action"
   - Update demo user to admin role
   - Add 500+ diverse contacts with realistic engagement scores and tags
   - Add 8 active campaigns across different types (petition, email, SMS, phone bank, event)
   - Add 10+ events (past and upcoming rallies, town halls, trainings, fundraisers)
   - Add 7 active groups (Core Volunteers, Phone Bank Team, Canvassing Crew, etc.)
   - Add thousands of interactions, activities, and registrations
   - Create multiple engagement pathways
   - Populate communication logs, petition signatures, and more

### Step 4: Test
1. Go to http://localhost:5173/login
2. Click "Try Demo Account"
3. You should be logged in with all the demo data!

## What's Included in Enhanced Demo Data
- **500+ Contacts** with realistic engagement scores and diverse tags (supporter, volunteer, organizer, leader, donor, etc.)
- **8 Active Campaigns** including petitions, email campaigns, SMS campaigns, phone banks, and events
- **10+ Events** including past rallies, town halls, trainings, canvassing, and upcoming fundraisers
- **7 Active Groups** with realistic memberships:
  - Core Volunteers - most active volunteers
  - Phone Bank Team - dedicated callers
  - Canvassing Crew - field organizers
  - Major Donors - financial supporters
  - Student Alliance - campus organizers
  - Digital Warriors - social media team
  - Policy Research Team - issue experts
- **Thousands of Interactions** including event registrations, petition signatures, communication logs
- **Multiple Pathways** for volunteer onboarding and engagement
- **Rich Activity History** showing a very active grassroots campaign

## Troubleshooting
- If you see "permission denied for schema auth", that's normal - we handle auth users through the dashboard
- Make sure to check "Auto Confirm Email" when creating the demo user
- The seed data will show a notice at the end reminding you to create the demo user