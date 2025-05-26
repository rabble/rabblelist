# Database Setup

## Quick Setup

1. **Run Complete Setup**
   - Go to: https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/sql/new
   - Copy & paste entire contents of `001_complete_setup.sql`
   - Click "Run"

2. **Create Demo User**
   - Go to: https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/auth/users
   - Click "Add user" → "Create new user"
   - Email: `demo@example.com`
   - Password: `demo123`
   - ✅ CHECK "Auto Confirm Email"

3. **Load Demo Data**
   - Go back to SQL editor
   - Copy & paste `002_demo_data.sql`
   - Click "Run"

## What Each File Does

- **001_complete_setup.sql**: Creates all tables, indexes, RLS policies, and functions
- **002_demo_data.sql**: Adds demo contacts, events, groups, and interactions

## Test It

1. Go to http://localhost:5173
2. Click "Try Demo Account"
3. You're in! 🎉