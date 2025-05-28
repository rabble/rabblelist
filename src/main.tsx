import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './index.css'

// Initialize Sentry
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
  tracesSampleRate: 1.0, // Capture 100% of the transactions in development
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  // Setting this option to true will send default PII data to Sentry.
  sendDefaultPii: true,
  environment: import.meta.env.MODE,
})

// Clean up any existing service workers and caches
// This is necessary to fix the network errors caused by stale service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister()
      console.log('Unregistered service worker:', registration.scope)
    })
  })
}

// Clear all caches to ensure fresh content
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name)
      console.log('Deleted cache:', name)
    })
  })
}

// Register service worker (currently disabled until properly configured)
// TODO: Re-enable service worker after fixing implementation
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then(registration => {
//         console.log('ServiceWorker registration successful:', registration.scope);
//       })
//       .catch(err => {
//         console.log('ServiceWorker registration failed:', err);
//       });
//   });
// }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)