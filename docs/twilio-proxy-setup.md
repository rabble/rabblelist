# Setting Up Twilio Proxy Service

## Step 1: Navigate to Proxy Services

1. Go to the [Twilio Console](https://console.twilio.com)
2. In the left sidebar, expand "Develop" 
3. Click on "Proxy" → "Services"
4. Or go directly to: https://console.twilio.com/us1/develop/proxy/services

## Step 2: Create a New Proxy Service

1. Click the "Create new Service" button
2. Enter these details:
   - **Unique Name**: `contact-manager-proxy`
   - **Callback URL**: `https://contact-manager-pwa.pages.dev/api/telephony/webhook/proxy`
3. Click "Create"

## Step 3: Copy the Service SID

After creation, you'll see a Service SID that looks like: `KSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

Add this to your `.env.local`:
```
VITE_TWILIO_PROXY_SERVICE_SID=KSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 4: Add Your Phone Number to the Proxy Service

1. In the Proxy Service page, click on "Phone Numbers" tab
2. Click "Add Phone Number"
3. Select your number: `(978) 644-5861`
4. Click "Add"

## Step 5: Configure Webhooks (Optional but Recommended)

In the Proxy Service settings, you can configure these webhooks:

- **Intercept Callback URL**: `https://contact-manager-pwa.pages.dev/api/telephony/webhook/intercept`
- **Out of Session Callback URL**: `https://contact-manager-pwa.pages.dev/api/telephony/webhook/out-of-session`

## Step 6: Configure Voice Settings for Your Phone Number

From the screenshot, I can see you need to update the Voice Configuration:

1. Go back to your phone number settings
2. In "Configure with", select "Webhook, TwiML Bin, Function, Studio Flow, Proxy Service"
3. For "A call comes in":
   - Select "Proxy Service" from the dropdown
   - Select your newly created proxy service
4. Click "Save"

## How Proxy Works

- When someone calls your Twilio number, it goes through the Proxy Service
- The Proxy Service creates a temporary session between the caller and recipient
- Neither party sees the other's real phone number
- Sessions expire after a set time (default: 1 hour)

## Testing Your Setup

Once configured, you can test by:
1. Adding a verified number to your Twilio account (for trial accounts)
2. Using the app to initiate a call
3. The recipient will see your Twilio number, not the ringer's personal number