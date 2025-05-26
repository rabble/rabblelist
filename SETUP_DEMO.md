# Setting Up Demo User - Complete Guide

## Complete Database Setup (2 Files Only!)

We've simplified everything into just 2 migration files:

### Step 1: Run Schema Setup
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/sql)
2. Copy and paste the contents of `001_complete_schema.sql`
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
2. Copy and paste the contents of `002_seed_data.sql`
3. Run it - this will:
   - Create demo organization
   - Update demo user to admin role
   - Add 10 sample contacts
   - Add 5 events (webinar, workshop, conference, etc.)
   - Add 5 groups with members
   - Add sample interactions and registrations
   - Create a customer onboarding pathway

### Step 4: Test
1. Go to http://localhost:5173/login
2. Click "Try Demo Account"
3. You should be logged in with all the demo data!

## What's Included in Demo Data
- **10 Contacts** with various tags (prospect, customer, lead, etc.)
- **5 Events** including webinars, workshops, and conferences
- **5 Groups** (VIP Customers, Beta Testers, Newsletter Subscribers, etc.)
- **Event Registrations** linking contacts to events
- **Contact Interactions** (calls, emails, meetings, notes)
- **1 Pathway** for customer onboarding with 5 steps

## Troubleshooting
- If you see "permission denied for schema auth", that's normal - we handle auth users through the dashboard
- Make sure to check "Auto Confirm Email" when creating the demo user
- The seed data will show a notice at the end reminding you to create the demo user