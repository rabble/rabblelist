import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './index.css'
import { EnhancedSyncService } from './lib/enhancedSyncService'

// Initialize Sentry (only in production or if explicitly enabled)
if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SENTRY === 'true') {
  Sentry.init({
    dsn: "https://2091c692480dc07e7b8acffa8898d45e@o4507434412736512.ingest.de.sentry.io/4507434435149904",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in development
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    // Setting this option to true will send default PII data to Sentry.
    sendDefaultPii: true,
    environment: import.meta.env.MODE,
  })
} else {
}

// Only clean up service workers in development to avoid cache issues
if ('serviceWorker' in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister()
    })
  })
  
  // Clear caches in development
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name)
      })
    })
  }
}

// Register service worker for offline functionality
// Enable in both development and production for testing
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registered with scope:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, prompt user to refresh
                if (confirm('New version available! Refresh to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(err => {
        console.error('ServiceWorker registration failed:', err);
      });
  });
}

// Initialize enhanced sync service
window.addEventListener('load', () => {
  EnhancedSyncService.start({
    conflictResolution: { strategy: 'merge' },
    syncInterval: 30000, // 30 seconds
    batchSize: 10
  })
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)