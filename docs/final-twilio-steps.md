# Final Twilio Configuration Steps

## 1. Configure Proxy Service Webhooks

In your current Proxy Service page (`crm_proxy`):

1. Fill in these webhook URLs:
   - **Callback URL**: `https://contact-manager-pwa.pages.dev/api/telephony/webhook/proxy`
   - **Intercept Callback URL**: `https://contact-manager-pwa.pages.dev/api/telephony/webhook/intercept` 
   - **Out of Session Callback URL**: `https://contact-manager-pwa.pages.dev/api/telephony/webhook/out-of-session`

2. Keep the HTTP methods as "HTTP POST"

3. Click "Save" at the bottom of the page

## 2. Add Your Phone Number to Proxy Service

1. Click "Numbers" in the left sidebar (under crm_proxy)
2. Click "Add a Phone Number"
3. Select your number: `+1 978-644-5861`
4. Click "Add"

## 3. Configure Phone Number to Use Proxy

1. Go back to Phone Numbers → Manage → Active Numbers
2. Click on your number `(978) 644-5861`
3. In Voice Configuration:
   - Change "Configure with" to include "Proxy Service"
   - For "A call comes in", select "Proxy Service" from dropdown
   - Select "crm_proxy" as the service
4. Click "Save"

## 4. Verify Trial Account Settings

Since you're on a trial account ($15.50 balance):
1. Go to Phone Numbers → Manage → Verified Caller IDs
2. Add any phone numbers you want to test with
3. These numbers will receive a verification call/SMS

## 5. Deploy Your Worker

```bash
cd workers/telephony
npm install
npm run deploy
```

## 6. Update Cloudflare Secrets

```bash
./scripts/setup-cloudflare-secrets.sh
```

## Testing

Once everything is configured:
1. Open your app in development: `npm run dev`
2. Navigate to the contact queue
3. Click on a contact to call
4. The call will be routed through Twilio Proxy
5. Neither party will see each other's real number

## What Happens During a Call

1. User clicks "Call" in the app
2. App requests a Proxy session from your Worker
3. Worker creates a Twilio Proxy session
4. Twilio connects both parties using your Twilio number as intermediary
5. Call audio can be transcribed in real-time
6. After call ends, outcome is saved to database