# Contact Manager PWA - Supabase Setup

## Database Setup Instructions

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/oxtjonaiubulnggytezf

2. **Run the SQL migrations in order:**
   
   Go to the SQL Editor (left sidebar) and run these files in order:
   
   a. **Initial Schema** (`001_initial_schema.sql`)
      - Creates all the tables
      - Sets up indexes and triggers
   
   b. **RLS Policies** (`002_rls_policies.sql`)
      - Sets up Row Level Security
      - Creates helper functions
   
   c. **Seed Data** (`003_seed_data.sql`)
      - Adds test organization and contacts
      - Sets up user creation trigger

3. **Enable Email Authentication**
   - Go to Authentication → Providers
   - Enable Email provider
   - Configure email templates if needed

4. **Create your first user**
   - Go to Authentication → Users
   - Click "Invite user" or "Create user"
   - Use an email like: admin@example.com
   - The trigger will automatically create a user record

5. **Update the user role to admin** (optional)
   - Go to SQL Editor and run:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'admin@example.com';
   ```

## Environment Variables

The app is already configured with your Supabase credentials in `.env.local`:
```
VITE_SUPABASE_URL=https://oxtjonaiubulnggytezf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Running the App

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173

3. Sign in with the user you created in Supabase

## Features Available

- ✅ User authentication
- ✅ Contact queue for calling
- ✅ Call outcome logging  
- ✅ Offline support with sync
- ✅ PWA installation
- ✅ Mobile-optimized interface

## Next Steps

- Add more contacts through the SQL editor
- Create call assignments for ringers
- Test offline functionality
- Deploy to production

## Troubleshooting

If you get authentication errors:
- Check that email auth is enabled in Supabase
- Verify the user exists in both auth.users and public.users tables
- Check that RLS policies are enabled

If you can't see contacts:
- Verify the user's organization_id matches the contacts
- Check RLS policies are working correctly
- Try running queries in SQL editor with RLS off to debug