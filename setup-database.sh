#!/bin/bash

# Contact Manager PWA Database Setup Script
# This script provides instructions for setting up the database with combined SQL files

echo "🚀 Contact Manager PWA Database Setup"
echo "======================================"
echo ""

# Check if combined files exist, if not create them
if [[ ! -f "supabase/complete_setup.sql" ]]; then
    echo "❌ Missing complete_setup.sql file. Please ensure it exists."
    exit 1
fi

if [[ ! -f "supabase/seed.sql" ]]; then
    echo "❌ Missing seed.sql file. Please ensure it exists."
    exit 1
fi

echo "✅ Database setup files found:"
echo "   - supabase/complete_setup.sql (schema and structure)"
echo "   - supabase/seed.sql (demo data)"
echo ""

echo "📋 Setup Instructions:"
echo "======================"
echo ""
echo "STEP 1: Database Schema Setup"
echo "-----------------------------"
echo "1. Go to your Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/oxtjonaiubulnggytezf"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the ENTIRE contents of:"
echo "   📄 supabase/complete_setup.sql"
echo "4. Click 'Run' to execute the schema setup"
echo ""

echo "STEP 2: Demo Data (Optional)"
echo "----------------------------"
echo "1. In the same SQL Editor"
echo "2. Copy and paste the ENTIRE contents of:"
echo "   📄 supabase/seed.sql"
echo "3. Click 'Run' to add demo data"
echo ""

echo "STEP 3: Authentication Setup"
echo "----------------------------"
echo "1. Go to Authentication → Settings → Auth Providers"
echo "2. Enable 'Email' provider"
echo "3. Optionally create test users in Authentication → Users"
echo "   (Demo user 'demo@example.com' will be created automatically)"
echo ""

echo "STEP 4: Start the Application"
echo "----------------------------"
echo "npm run dev"
echo ""

echo "📝 File Sizes:"
echo "   complete_setup.sql: $(wc -l < supabase/complete_setup.sql) lines"
echo "   seed.sql: $(wc -l < supabase/seed.sql) lines"
echo ""

echo "🎯 What each file does:"
echo "   complete_setup.sql: Creates all tables, indexes, RLS policies, functions"
echo "   seed.sql: Adds demo contacts, events, campaigns, groups, and pathways"
echo ""

echo "✨ Setup complete! Follow the steps above to configure your database."