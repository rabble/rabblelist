// Twilio Configuration
// Note: All sensitive credentials should be in environment variables

export const twilioConfig = {
  // These will be set via environment variables in production
  accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
  authToken: '', // Never expose this in frontend code
  apiKey: import.meta.env.VITE_TWILIO_API_KEY || '',
  apiSecret: '', // Never expose this in frontend code
  
  // Twilio Proxy Service settings
  proxyServiceSid: import.meta.env.VITE_TWILIO_PROXY_SERVICE_SID || '',
  
  // Phone numbers for different regions (will be purchased after account setup)
  phoneNumbers: {
    US: import.meta.env.VITE_TWILIO_PHONE_US || '',
    UK: import.meta.env.VITE_TWILIO_PHONE_UK || '',
    CA: import.meta.env.VITE_TWILIO_PHONE_CA || '',
    AU: import.meta.env.VITE_TWILIO_PHONE_AU || '',
  },
  
  // Webhook endpoints (Cloudflare Workers)
  webhooks: {
    voice: import.meta.env.VITE_TELEPHONY_WEBHOOK_URL || '',
    status: import.meta.env.VITE_TELEPHONY_STATUS_URL || '',
    transcription: import.meta.env.VITE_TELEPHONY_TRANSCRIPTION_URL || '',
  },
  
  // Free trial limits
  freeTrialCredits: 15.00, // USD
  costPerMinute: {
    US: 0.022,
    UK: 0.035,
    CA: 0.022,
    AU: 0.048,
  }
};

// Twilio Client configuration for browser SDK
export const twilioClientConfig = {
  // Token endpoint (Cloudflare Worker)
  tokenEndpoint: '/api/telephony/token',
  
  // Client options
  options: {
    edge: 'sydney', // Closest edge location
    sounds: {
      incoming: '/sounds/incoming.mp3',
      outgoing: '/sounds/outgoing.mp3',
      disconnect: '/sounds/disconnect.mp3',
    },
    codecPreferences: ['opus', 'pcmu'],
    enableRingingState: true,
  }
};