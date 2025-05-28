#!/bin/bash

# Load enhanced demo data into Supabase
echo "🚀 Loading enhanced demo data for Contact Manager PWA"
echo "===================================================="
echo ""
echo "This will create a very active campaign with:"
echo "- 500+ diverse contacts"
echo "- Multiple active campaigns"
echo "- Upcoming and past events"
echo "- Active groups and pathways"
echo "- Thousands of interactions"
echo ""
echo "Prerequisites:"
echo "1. You must have already run schema.sql"
echo "2. You must have created demo@example.com user in Supabase Auth"
echo ""
echo "To run this:"
echo "1. Go to your Supabase SQL Editor"
echo "2. Copy and paste the contents of: supabase/seed-data-enhanced.sql"
echo "3. Click 'Run'"
echo ""
echo "Or use the Supabase CLI:"
echo "supabase db push --include supabase/seed-data-enhanced.sql"
echo ""
read -p "Press enter to open the enhanced seed data file..."

# Try to open in default editor
if command -v code &> /dev/null; then
    code supabase/seed-data-enhanced.sql
elif command -v open &> /dev/null; then
    open supabase/seed-data-enhanced.sql
else
    cat supabase/seed-data-enhanced.sql
fi