// Email Configuration (Mailgun)
export const emailConfig = {
  // Mailgun API settings
  apiKey: import.meta.env.VITE_MAILGUN_API_KEY || '',
  domain: import.meta.env.VITE_MAILGUN_DOMAIN || 'mg.rise.protest.net',
  apiUrl: import.meta.env.VITE_MAILGUN_API_URL || 'https://api.mailgun.net/v3',
  
  // Default sender settings
  defaultFrom: {
    name: 'Rise Movement',
    email: 'noreply@rise.protest.net'
  },
  
  // Email templates
  templates: {
    welcome: 'welcome-volunteer',
    eventReminder: 'event-reminder', 
    campaignUpdate: 'campaign-update',
    petitionThanks: 'petition-thanks',
    donationReceipt: 'donation-receipt'
  },
  
  // Rate limits
  rateLimits: {
    perHour: 1000,
    perDay: 10000,
    burstLimit: 100
  }
}