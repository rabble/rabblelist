#!/bin/bash

# Toggle between demo mode and Supabase mode

if [ -f ".env.local" ]; then
    echo "Switching to DEMO mode..."
    mv .env.local .env.local.backup
    echo "✅ Demo mode enabled!"
    echo "You can now login with any email/password"
else
    if [ -f ".env.local.backup" ]; then
        echo "Switching to SUPABASE mode..."
        mv .env.local.backup .env.local
        echo "✅ Supabase mode enabled!"
        echo "You need to use real Supabase credentials"
    else
        echo "No .env.local.backup found. Creating .env.local for Supabase mode..."
        echo 'VITE_SUPABASE_URL=https://oxtjonaiubulnggytezf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94dGpvbmFpdWJ1bG5nZ3l0ZXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxOTM4ODgsImV4cCI6MjA2Mzc2OTg4OH0.9EsXc65D-5qgXLtu48d1E1Bll_AjaCt-a2-oPhZzUQU' > .env.local
        echo "✅ Created .env.local with Supabase credentials"
    fi
fi

echo ""
echo "Restart the dev server for changes to take effect:"
echo "npm run dev"