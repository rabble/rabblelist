# Creating Your First User in Supabase

## Quick Setup Steps:

1. **Go to Supabase Dashboard**
   https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/auth/users

2. **Enable Email Authentication**
   - Go to Authentication → Providers
   - Make sure "Email" is enabled

3. **Create a User**
   - Click "Add user" → "Create new user"
   - Email: admin@example.com (or any email you prefer)
   - Password: Choose a secure password
   - Click "Create user"

4. **The database trigger will automatically:**
   - Create a user record in the `users` table
   - Assign them to the test organization
   - Give them the "ringer" role by default

5. **To make the user an admin** (optional):
   - Go to SQL Editor
   - Run this query:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'admin@example.com';
   ```

## Alternative: Use Demo Mode

To use the app without Supabase setup:

1. Rename `.env.local` to `.env.local.backup`
2. Restart the dev server
3. Login with any email/password

## Testing the App

Once you've created a user:
1. Go to http://localhost:5173
2. Login with your created credentials
3. You'll see the contact queue
4. If you made yourself an admin, you'll see the Admin link in the header

## Troubleshooting

If you get "Invalid login credentials":
- Make sure the user was created in Supabase
- Check that email authentication is enabled
- Verify the password is correct

If you can't see any contacts:
- The seed data should have added test contacts
- Check the SQL Editor to verify the data exists
- Make sure the user's organization_id matches the contacts