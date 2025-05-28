const CACHE_NAME = 'contact-manager-v1';
const RUNTIME_CACHE = 'contact-manager-runtime-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/vite.svg',
  '/privacy-policy.html',
  '/terms-of-service.html',
  '/dashboard.png',
  '/contacts.png',
  '/campaigns.png',
  '/pathways.png'
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
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Determine which cache to use
          const isAPI = event.request.url.includes('/api/') || 
                       event.request.url.includes('supabase');
          const cacheName = isAPI ? RUNTIME_CACHE : CACHE_NAME;

          // Cache dynamic content for offline use
          caches.open(cacheName)
            .then(cache => {
              // Cache API responses with expiration
              if (isAPI) {
                // Add timestamp to API responses
                const headers = new Headers(responseToCache.headers);
                headers.append('sw-fetched-on', new Date().getTime().toString());
                
                return responseToCache.blob().then(body => {
                  return cache.put(event.request, new Response(body, {
                    status: responseToCache.status,
                    statusText: responseToCache.statusText,
                    headers: headers
                  }));
                });
              } else if (event.request.url.includes('.js') || 
                        event.request.url.includes('.css') ||
                        event.request.url.includes('.json') ||
                        event.request.url.includes('.png') ||
                        event.request.url.includes('.jpg') ||
                        event.request.url.includes('.jpeg') ||
                        event.request.url.includes('.webp')) {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        });
      })
      .catch(() => {
        // Offline fallback for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-contacts') {
    event.waitUntil(syncContacts());
  }
});

async function syncContacts() {
  // This will be called when connectivity is restored
  console.log('Syncing contacts...');
  // Implementation will depend on your sync strategy
}