// Twilio SendGrid Configuration
export const sendgridConfig = {
  // SendGrid API settings
  apiKey: import.meta.env.VITE_SENDGRID_API_KEY || '',
  apiUrl: 'https://api.sendgrid.com/v3',
  
  // Default sender settings
  defaultFrom: {
    name: 'Rise Movement',
    email: import.meta.env.VITE_SENDGRID_FROM_EMAIL || 'noreply@rise.protest.net'
  },
  
  // Verified sender domain
  verifiedDomain: import.meta.env.VITE_SENDGRID_DOMAIN || 'rise.protest.net',
  
  // Email templates (SendGrid Dynamic Template IDs)
  templates: {
    welcome: import.meta.env.VITE_SENDGRID_TEMPLATE_WELCOME || '',
    eventReminder: import.meta.env.VITE_SENDGRID_TEMPLATE_EVENT || '', 
    campaignUpdate: import.meta.env.VITE_SENDGRID_TEMPLATE_CAMPAIGN || '',
    petitionThanks: import.meta.env.VITE_SENDGRID_TEMPLATE_PETITION || '',
    donationReceipt: import.meta.env.VITE_SENDGRID_TEMPLATE_DONATION || '',
    passwordReset: import.meta.env.VITE_SENDGRID_TEMPLATE_PASSWORD_RESET || ''
  },
  
  // Rate limits (SendGrid free tier)
  rateLimits: {
    perDay: 100, // Free tier limit
    perMonth: 40000 // Pro tier limit
  },
  
  // Tracking settings
  tracking: {
    opens: true,
    clicks: true,
    unsubscribes: true,
    bounces: true
  }
}