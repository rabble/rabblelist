# Twilio Setup Guide

## Step 1: Get a Twilio Phone Number

### Option A: Using Twilio Console (Web)
1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Phone Numbers** → **Manage** → **Buy a number**
3. Select your country (e.g., United States)
4. Choose a number with **Voice** capabilities
5. Click "Buy" ($1/month, but free with trial credit)

### Option B: Using Twilio CLI
```bash
# Install Twilio CLI
brew tap twilio/brew && brew install twilio

# Login
twilio login

# List available numbers (US example)
twilio phone-numbers:list:available --country-code US --voice-enabled

# Buy a specific number
twilio phone-numbers:create +1234567890
```

## Step 2: Create a Proxy Service

### Using Twilio Console:
1. Go to [Twilio Proxy Console](https://console.twilio.com/us1/develop/proxy/services)
2. Click "Create new Service"
3. Name it: "Contact Manager Proxy"
4. Click "Create"
5. Copy the Service SID (starts with KS...)

### Using Twilio CLI:
```bash
twilio api:proxy:v1:services:create --unique-name "contact-manager-proxy"
```

## Step 3: Add Phone Number to Proxy Service

1. In the Proxy Service page, go to "Phone Numbers"
2. Click "Add Phone Number"
3. Select the number you just purchased
4. Click "Add"

## Step 4: Configure Webhooks

1. In your Proxy Service settings, add these webhook URLs:
   - **Callback URL**: `https://contact-manager-pwa.pages.dev/api/telephony/webhook/voice`
   - **Intercept Callback URL**: `https://contact-manager-pwa.pages.dev/api/telephony/webhook/intercept`
   - **Out of Session Callback URL**: `https://contact-manager-pwa.pages.dev/api/telephony/webhook/out-of-session`

## Step 5: Update Environment Variables

Add these to your `.env.local`:
```
VITE_TWILIO_PHONE_US=+1234567890  # Your purchased number
VITE_TWILIO_PROXY_SERVICE_SID=KSxxxxxxxxxxxxxxxxx  # Your Proxy Service SID
```

## Important Notes

- **Trial Limitations**: 
  - Can only call verified numbers (add them in Console → Phone Numbers → Verified Caller IDs)
  - Calls include a trial message at the beginning
  - $15 credit included

- **Proxy Sessions**:
  - Each call creates a temporary session
  - Sessions expire after 1 hour by default
  - Participants can't see each other's real numbers

- **Costs**:
  - Phone number: $1/month
  - Incoming calls: $0.0085/min
  - Outgoing calls: $0.022/min (US)
  - Proxy session: $0.01/session