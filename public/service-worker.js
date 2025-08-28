const CACHE_NAME = 'civeni-static-v1.1.0';
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/lovable-uploads/d2cf60ac-a7a6-4538-88d6-ab40f772400e.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Network-first strategy for navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.match('/offline.html');
            });
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  if (event.request.url.includes('/lovable-uploads/') ||
      event.request.url.includes('/manifest.webmanifest') ||
      event.request.url.includes('favicon')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
    );
    return;
  }

  // Runtime caching for external images (Supabase Storage)
  if (event.request.url.match(/^https:\/\/.*\.supabase\.co.*\.(png|jpg|jpeg|gif|webp|svg|avif)(\?.*)?$/i) ||
      event.request.url.match(/^https:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg|avif)(\?.*)?$/i)) {
    event.respondWith(
      caches.open('images-cache-v1')
        .then(cache => {
          return cache.match(event.request)
            .then(response => {
              if (response) {
                // Cache hit - return cached version and update in background
                fetch(event.request)
                  .then(fetchResponse => {
                    if (fetchResponse.ok) {
                      cache.put(event.request, fetchResponse.clone());
                    }
                  })
                  .catch(() => {}); // Ignore background update errors
                return response;
              }
              // Cache miss - fetch and cache
              return fetch(event.request)
                .then(fetchResponse => {
                  if (fetchResponse.ok) {
                    cache.put(event.request, fetchResponse.clone());
                  }
                  return fetchResponse;
                })
                .catch(() => {
                  // Return placeholder or cached fallback
                  return new Response('', { status: 204 });
                });
            });
        })
    );
    return;
  }

  // Network-first for other requests
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});