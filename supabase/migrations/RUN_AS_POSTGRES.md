# How to Run Migrations with Postgres Permissions

The Supabase SQL Editor runs with limited permissions. To create triggers on auth.users, you need to connect as the postgres superuser.

## Option 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref oxtjonaiubulnggytezf
   ```

3. Run migrations:
   ```bash
   supabase db push
   ```

## Option 2: Direct PostgreSQL Connection

1. Go to Supabase Dashboard > Settings > Database
2. Find "Connection string" section
3. Copy the "URI" connection string (starts with `postgres://postgres:...`)
4. Use a PostgreSQL client:

   **Using psql:**
   ```bash
   psql "postgres://postgres:[YOUR-PASSWORD]@db.oxtjonaiubulnggytezf.supabase.co:5432/postgres"
   ```

   **Using TablePlus/pgAdmin/DBeaver:**
   - Create new connection
   - Use the connection details from the URI

5. Run the migrations in order:
   - First: 001_complete_schema.sql
   - Create demo user in Auth dashboard
   - Then: 002_seed_data.sql

## Option 3: Service Role in SQL Editor

Sometimes you can escalate permissions temporarily:

```sql
-- Try this at the top of your migration
SET ROLE postgres;

-- Your migration SQL here...

-- Reset role at the end
RESET ROLE;
```

## Why This Happens

Supabase SQL Editor runs as the `postgres` role but with restricted permissions for security. Creating triggers on system schemas like `auth` requires superuser privileges.