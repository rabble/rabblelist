# 🚀 Deployment Guide for PWABuilder App Store Release

## Quick Start Deployment

### Option 1: Cloudflare Pages (Recommended)
```bash
# Build the project
npm run build

# Install Wrangler CLI
npm install -g wrangler

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name contact-manager-pwa
```

### Option 2: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Option 3: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

## Pre-Deployment Checklist

### 1. Update Legal URLs
Edit `/public/privacy-policy.html` and `/public/terms-of-service.html`:
- Replace `[Your Company Address]` with actual address
- Replace `[Your Phone Number]` with actual phone
- Update email addresses

### 2. Update Manifest URLs
Once deployed, update `/public/manifest.json`:
```json
{
  "start_url": "https://your-domain.com/",
  "scope": "https://your-domain.com/"
}
```

### 3. Environment Variables
Create production `.env`:
```
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

### 4. Fix TypeScript Errors (if any)
```bash
npm run build
# Fix any errors that appear
```

## Deployment Configuration

### Cloudflare Pages Settings
Create `wrangler.toml`:
```toml
name = "contact-manager-pwa"
compatibility_date = "2024-01-01"

[build]
command = "npm run build"
directory = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "max-age=0"
    Service-Worker-Allowed = "/"
```

### Required Headers (All Platforms)
Ensure these headers are set:
```
Cache-Control: max-age=0 (for sw.js)
Service-Worker-Allowed: / (for sw.js)
Content-Type: application/manifest+json (for manifest.json)
```

## Post-Deployment Verification

### 1. Test PWA Installation
- Visit your deployed URL
- Check for install prompt
- Install and test offline mode

### 2. Run PWABuilder Check
1. Go to [PWABuilder.com](https://www.pwabuilder.com/)
2. Enter your production URL
3. Verify all scores are 100%

### 3. SSL Certificate
Ensure HTTPS is working with valid certificate

### 4. Test Critical Paths
- [ ] Login flow works
- [ ] Contact queue loads
- [ ] Offline page appears when disconnected
- [ ] Service worker caches properly

## PWABuilder Package Generation

### Step 1: Generate Package
1. Visit [PWABuilder.com](https://www.pwabuilder.com/)
2. Enter your HTTPS URL: `https://your-domain.com`
3. Click "Start"
4. Review scores (should all be 100%)
5. Click "Package for stores"

### Step 2: iOS Package
1. Select "iOS"
2. Fill in details:
   - Bundle ID: `com.contactmanager.pwa`
   - App Name: `Contact Manager`
   - App ID: Use your Apple Developer ID
3. Download the Xcode project

### Step 3: Xcode Setup
1. Open downloaded project in Xcode
2. Select your development team
3. Update bundle identifier if needed
4. Build and test on simulator
5. Archive for App Store submission

## Troubleshooting

### Service Worker Not Registering
- Check HTTPS is enabled
- Verify `/sw.js` is accessible
- Check browser console for errors

### Install Prompt Not Showing
- Clear browser cache
- Ensure manifest is valid
- Check all icons are loading

### Offline Not Working
- Verify service worker is active
- Check cache names in DevTools
- Test in Incognito mode

### PWABuilder Low Scores
- Run Lighthouse audit
- Fix any manifest warnings
- Ensure all icons exist
- Check HTTPS redirect

## Final Steps

1. **Document your URLs**:
   - Production URL: ___________
   - Privacy Policy: ___________/privacy-policy.html
   - Terms of Service: ___________/terms-of-service.html

2. **Save credentials**:
   - Hosting login
   - Apple Developer account
   - App-specific passwords

3. **Monitor**:
   - Set up uptime monitoring
   - Track PWA install metrics
   - Monitor error logs

## Support Resources

- [PWABuilder Docs](https://docs.pwabuilder.com)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [Apple PWA Guidelines](https://developer.apple.com/documentation/webkit/adding_a_web_app_manifest)

Your PWA is now ready for deployment and App Store submission! 🎉