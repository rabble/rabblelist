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

// Clean up any existing service workers and caches
// This is necessary to fix the network errors caused by stale service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister()
    })
  })
}

// Clear all caches to ensure fresh content
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name)
    })
  })
}

// Register service worker for offline functionality
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => {
        // Service worker registered successfully
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