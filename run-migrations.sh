#!/bin/bash

# Run migrations using Supabase REST API

SUPABASE_URL="https://oxtjonaiubulnggytezf.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94dGpvbmFpdWJ1bG5nZ3l0ZXpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE5Mzg4OCwiZXhwIjoyMDYzNzY5ODg4fQ.qbjjDoCYG6fXPOMVXeVwy6AZYQ_b3WyTie6Bd6tVqp8"

echo "🚀 Running Contact Manager PWA Database Setup"
echo "============================================"

# Function to execute SQL
execute_sql() {
    local sql="$1"
    local description="$2"
    
    echo "📝 $description"
    
    # Use the Supabase REST API to execute raw SQL
    response=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/rpc/query" \
        -H "apikey: ${SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"${sql}\"}")
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Success"
    else
        echo "❌ Failed: $response"
    fi
}

# Drop existing tables
echo "🗑️  Dropping existing tables..."
execute_sql "DROP TABLE IF EXISTS public.call_transcripts CASCADE; DROP TABLE IF EXISTS public.call_sessions CASCADE; DROP TABLE IF EXISTS public.pathway_steps CASCADE; DROP TABLE IF EXISTS public.pathways CASCADE; DROP TABLE IF EXISTS public.group_members CASCADE; DROP TABLE IF EXISTS public.groups CASCADE; DROP TABLE IF EXISTS public.event_registrations CASCADE; DROP TABLE IF EXISTS public.events CASCADE; DROP TABLE IF EXISTS public.contact_interactions CASCADE; DROP TABLE IF EXISTS public.contacts CASCADE; DROP TABLE IF EXISTS public.users CASCADE; DROP TABLE IF EXISTS public.organizations CASCADE;" "Dropping tables"

# Create organizations table
execute_sql "CREATE TABLE organizations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, country_code TEXT NOT NULL DEFAULT 'US', settings JSONB DEFAULT '{}', features JSONB DEFAULT '{\"calling\": true, \"events\": true, \"imports\": true, \"groups\": true, \"pathways\": true}', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());" "Creating organizations table"

# Create users table
execute_sql "CREATE TABLE users (id UUID PRIMARY KEY, email TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL, organization_id UUID NOT NULL REFERENCES organizations(id), role TEXT NOT NULL CHECK (role IN ('admin', 'ringer', 'viewer')) DEFAULT 'ringer', settings JSONB DEFAULT '{}', phone TEXT, last_active TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());" "Creating users table"

# Continue with other tables...
echo ""
echo "⚠️  This approach is limited. Instead, let's use the Supabase dashboard:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/sql/new"
echo "2. Copy the contents of: supabase/migrations/001_complete_schema.sql"
echo "3. Paste and run it"
echo "4. Create demo user in Auth"
echo "5. Copy and run: supabase/migrations/002_seed_data.sql"