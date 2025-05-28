# Setting up Deployment Secrets

## GitHub Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

1. **SENTRY_AUTH_TOKEN**
   - Value: Your Sentry auth token
   - Used for: Uploading source maps during build

2. **CLOUDFLARE_API_TOKEN**
   - Value: Create at https://dash.cloudflare.com/profile/api-tokens
   - Permissions needed: Cloudflare Pages:Edit
   - Used for: Deploying to Cloudflare Pages

3. **CLOUDFLARE_ACCOUNT_ID**
   - Value: Found in Cloudflare dashboard > Account ID
   - Used for: Identifying your Cloudflare account

## Cloudflare Pages Environment Variables

Add these in Cloudflare Pages dashboard (Settings > Environment variables):

### Production variables:
```
SENTRY_AUTH_TOKEN=your_sentry_auth_token
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
VITE_SENDGRID_API_KEY=your_sendgrid_api_key
VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
```

### Preview variables (optional, for PR previews):
Same as production but with development/staging values

## Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in all values including:
   ```
   SENTRY_AUTH_TOKEN=your_sentry_auth_token
   ```

## Security Notes

- Never commit `.env.local` or any file containing real tokens
- Rotate tokens immediately if exposed
- Use different tokens for development and production when possible
- Cloudflare Pages automatically redacts sensitive values in build logs

## Verifying Sentry Setup

1. Build locally: `npm run build`
   - You should see "Successfully uploaded source maps to Sentry"
   
2. Check Sentry dashboard:
   - Go to https://protestnet.sentry.io/issues/
   - Errors should appear with proper source mapping
   
3. Test error reporting:
   - Add a test error in your app
   - Check that it appears in Sentry with correct stack traces