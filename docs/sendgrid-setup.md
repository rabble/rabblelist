# Twilio SendGrid Setup Guide

## Overview
Since we already have Twilio set up for SMS and voice, we can use Twilio SendGrid for email services. SendGrid is Twilio's email platform that provides reliable email delivery with great analytics.

## Step 1: Access SendGrid through Twilio

1. Log into your [Twilio Console](https://console.twilio.com)
2. In the left sidebar, look for **Email** → **SendGrid**
3. Click "Get Started with SendGrid"
4. This will create a SendGrid account linked to your Twilio account

## Step 2: Create SendGrid API Key

1. Once in SendGrid, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Give it a name: "Contact Manager Email"
4. Select **Full Access** (or **Restricted Access** with Mail Send permissions)
5. Copy the API key immediately (you won't see it again!)

## Step 3: Verify Sender Domain

1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Choose your DNS host (e.g., Cloudflare)
4. Enter your domain: `rise.protest.net`
5. Follow the DNS record instructions
6. Once verified, you can send from any email address on that domain

## Step 4: Create Email Templates (Optional)

1. Go to **Email API** → **Dynamic Templates**
2. Click **Create a Dynamic Template**
3. Create templates for:
   - Welcome emails
   - Event reminders
   - Campaign updates
   - Password reset
4. Note the Template IDs for each

## Step 5: Update Environment Variables

Add these to your `.env.local`:

```bash
# SendGrid Configuration
VITE_SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxx
VITE_SENDGRID_FROM_EMAIL=noreply@rise.protest.net
VITE_SENDGRID_DOMAIN=rise.protest.net

# Optional: Template IDs
VITE_SENDGRID_TEMPLATE_WELCOME=d-xxxxxxxxxxxxxxxxxx
VITE_SENDGRID_TEMPLATE_EVENT=d-xxxxxxxxxxxxxxxxxx
VITE_SENDGRID_TEMPLATE_CAMPAIGN=d-xxxxxxxxxxxxxxxxxx
VITE_SENDGRID_TEMPLATE_PETITION=d-xxxxxxxxxxxxxxxxxx
VITE_SENDGRID_TEMPLATE_DONATION=d-xxxxxxxxxxxxxxxxxx
VITE_SENDGRID_TEMPLATE_PASSWORD_RESET=d-xxxxxxxxxxxxxxxxxx
```

## Step 6: Configure Webhooks (Optional)

For tracking email events:

1. Go to **Settings** → **Mail Settings** → **Event Webhook**
2. Set HTTP Post URL: `https://contact-manager-pwa.pages.dev/api/email/webhook`
3. Select events to track:
   - Delivered
   - Opened
   - Clicked
   - Bounced
   - Unsubscribed
   - Spam Reports
4. Click **Save**

## Pricing

### Free Tier (Great for starting)
- 100 emails/day forever
- Basic analytics
- 7-day email activity history

### Essentials Plan ($19.95/month)
- 50,000 emails/month
- Advanced analytics
- 30-day email activity history
- Dedicated IP available

### Pro Plan (Usage-based)
- Pay as you go
- $0.00085 per email
- All features included
- Ideal for campaigns

## Integration with Existing Twilio Setup

Since you already have Twilio for voice/SMS:
- Single billing through Twilio
- Unified support
- Consistent API patterns
- Combined usage reports

## Testing

1. Send a test email:
```javascript
await EmailService.sendTestEmail('your-email@example.com')
```

2. Check SendGrid Activity Feed for delivery status

3. Monitor webhook events in your database

## Best Practices

1. **Warm up your IP**: Start with small volumes and gradually increase
2. **Monitor your sender reputation**: Check SendGrid's dashboard regularly
3. **Handle bounces**: Remove hard bounces from your lists
4. **Honor unsubscribes**: Always include unsubscribe links
5. **Use templates**: Better deliverability and easier maintenance

## Troubleshooting

### Emails going to spam?
- Verify your domain authentication
- Check your sender reputation
- Ensure proper unsubscribe links
- Avoid spam trigger words

### Rate limits?
- Free tier: 100/day
- Use batch sending for campaigns
- Implement retry logic with backoff

### Tracking not working?
- Ensure webhook URL is accessible
- Check webhook signature validation
- Verify event types are selected