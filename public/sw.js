const CACHE_NAME = 'contact-manager-v2';
const RUNTIME_CACHE = 'contact-manager-runtime-v2';
const API_CACHE = 'contact-manager-api-v1';

// Core assets to cache on install
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// API routes to handle specially
const API_ROUTES = [
  '/api/',
  'supabase',
  '/auth/',
  '/rest/'
];

// Assets that should be cached after fetch
const CACHE_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.otf$/,
  /\.(png|jpg|jpeg|svg|gif|webp)$/
];

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement proper caching strategies
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  const { url } = event.request;
  const isAPI = API_ROUTES.some(route => url.includes(route));
  const isAsset = CACHE_PATTERNS.some(pattern => pattern.test(url));

  // Network-first strategy for API calls
  if (isAPI) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful API responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(API_CACHE).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache for API calls when offline
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for assets
  if (isAsset || url.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            // Return cached version
            return response;
          }
          
          // Fetch and cache new assets
          return fetch(event.request).then(response => {
            if (!response || response.status !== 200) {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            
            return response;
          });
        })
    );
    return;
  }

  // Network-first for everything else (HTML pages)
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // For navigation requests, return offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        // Try cache for other requests
        return caches.match(event.request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-contacts') {
    event.waitUntil(syncContacts());
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Handle messages from the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notifications
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there's already a window/tab open
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

async function syncContacts() {
  // This will be called when connectivity is restored
  console.log('Syncing contacts...');
  // The actual sync is handled by EnhancedSyncService in the app
}

async function syncMessages() {
  console.log('Syncing messages...');
  // Handle message sync when back online
}