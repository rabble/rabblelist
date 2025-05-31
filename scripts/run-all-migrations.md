# Complete Database Setup Instructions

Follow these steps to set up your database:

## Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/sql/new

## Step 2: Run Complete Schema (includes all migrations)
1. Copy the ENTIRE contents of `supabase/schema.sql`
2. Paste into the SQL editor
3. Click "Run"
4. Wait for completion (should show success)

**Note**: The schema.sql file now includes ALL migrations:
- Recurring events support
- Email tracking tables
- A/B testing functionality
- All indexes, functions, and triggers

## Step 3: Run Seed Data (Optional)
1. Copy the ENTIRE contents of `supabase/seed-data.sql`
2. Paste into the SQL editor
3. Click "Run"
4. This will add demo data to your database

## Step 4: Create Demo User
After running all SQL files, come back to terminal and run:
```bash
npm run setup:demo
```

## Step 5: Verify Setup
1. Start the app: `npm run dev`
2. Login with: demo@example.com / demo123

## Troubleshooting

### If you get errors about existing tables:
- The schema.sql file includes DROP statements, so it should clean up first
- If issues persist, you may need to manually drop tables

### If demo user creation fails:
- Make sure the organizations table has the demo organization
- Check that auth is enabled in Supabase

### If login fails:
- Verify the user exists in Authentication → Users in Supabase
- Check that the users table has a matching profile