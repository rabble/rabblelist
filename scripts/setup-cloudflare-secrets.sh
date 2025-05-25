#!/bin/bash

# Script to set up Cloudflare Workers secrets
# Run this after setting up your Cloudflare Worker

echo "Setting up Cloudflare Workers secrets..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler CLI is not installed"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Source the .env.local file to get credentials
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "Error: .env.local file not found"
    exit 1
fi

# Set Twilio secrets
echo "Setting Twilio secrets..."
wrangler secret put TWILIO_ACCOUNT_SID --env production <<< "$TWILIO_ACCOUNT_SID"
wrangler secret put TWILIO_AUTH_TOKEN --env production <<< "$TWILIO_AUTH_TOKEN"

# Set Supabase secrets
echo "Setting Supabase secrets..."
wrangler secret put SUPABASE_URL --env production <<< "$VITE_SUPABASE_URL"
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production <<< "$SUPABASE_SERVICE_ROLE_KEY"

echo "Secrets have been configured!"
echo ""
echo "To verify, run:"
echo "  wrangler secret list --env production"
echo ""
echo "Note: These secrets are stored securely in Cloudflare and are not visible in your code."