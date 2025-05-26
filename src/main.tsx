import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

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