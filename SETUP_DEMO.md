# Setting Up Demo User - Complete Guide

## Quick Setup (Reset Everything)

Since the app hasn't been used live yet, here's how to completely reset and set up everything including the demo user:

### Step 1: Reset Database
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/sql)
2. Run `000_reset_and_setup.sql` to drop all existing tables

### Step 2: Run Migrations in Order
Run each of these SQL files in the SQL Editor:

1. **`001_initial_schema.sql`** - Creates all tables
2. **`002_rls_policies.sql`** - Sets up Row Level Security
3. **`003_seed_data.sql`** - Creates triggers and initial data

### Step 3: Create Demo User in Auth
1. Go to [Authentication > Users](https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/auth/users)
2. Click "Add user" → "Create new user"
3. Enter:
   - Email: `demo@example.com`
   - Password: `demo123`
   - Auto Confirm Email: ✓ (check this box)
4. Click "Create user"

### Step 4: Run Demo Data Migration
1. Go back to [SQL Editor](https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/sql)
2. Run `005_demo_data_only.sql` to add demo organization and sample data

### Step 5: Test
1. Go to http://localhost:5173/login
2. Click "Try Demo Account"
3. You should be logged in with pre-populated data!

## Alternative: Just Add Demo User (Keep Existing Data)

If you want to keep your existing data and just add the demo user:

1. Create the demo user in [Authentication](https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/auth/users)
2. Run only `005_demo_data_only.sql`

## Troubleshooting

- If login fails, check the browser console for errors
- Make sure the demo user was created with the exact email `demo@example.com`
- Ensure "Auto Confirm Email" was checked when creating the user
- Check that all migrations ran successfully without errors