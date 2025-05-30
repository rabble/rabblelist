# Contact Manager PWA - Setup Scripts

This directory contains all setup and configuration scripts for the Contact Manager PWA.

## 🚀 Quick Start

```bash
# Complete setup (manual SQL + demo user)
npm run setup

# Individual setup commands
npm run setup:schema   # Instructions for schema.sql
npm run setup:seed     # Instructions for seed-data.sql  
npm run setup:demo     # Create demo user (after SQL)
```

## 📁 Script Overview

### setup-all.js
The main unified setup script that handles all database setup tasks:
- **schema**: Provides instructions for running schema.sql
- **seed**: Provides instructions for seed-data.sql
- **demo**: Creates demo user with auth (demo@example.com / demo123)
- **all**: Runs complete setup process

### setup-twilio.js
Configures Twilio for SMS and phone banking functionality:
- Creates Twilio Proxy Service
- Sets up phone number pool
- Configures webhooks

### setup-cloudflare-secrets.sh
Sets up Cloudflare Workers secrets for deployment:
- Configures Supabase URLs and keys
- Sets up Twilio credentials
- Manages environment-specific secrets

### add-demo-data.js
Additional demo data beyond the basic seed:
- Extra contacts with varied engagement
- More complex campaign scenarios
- Advanced pathway examples

## 🔧 Setup Flow

1. **Database Schema**
   ```bash
   npm run setup:schema
   ```
   Follow instructions to run `supabase/schema.sql` in Supabase Dashboard

2. **Seed Data** (optional)
   ```bash
   npm run setup:seed
   ```
   Follow instructions to run `supabase/seed-data.sql` in Supabase Dashboard

3. **Demo User**
   ```bash
   npm run setup:demo
   ```
   Creates demo@example.com user with admin access

4. **External Services** (optional)
   ```bash
   npm run setup:twilio          # For SMS/calling
   npm run setup:cloudflare-secrets  # For deployment
   ```

## 📝 Notes

- The SQL files must be run manually in Supabase Dashboard due to security restrictions
- Demo user setup requires SUPABASE_SERVICE_ROLE_KEY in .env.local
- All scripts are idempotent - safe to run multiple times
- Check individual scripts for detailed configuration options