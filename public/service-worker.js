const CACHE_NAME = 'civeni-static-v2.0.0-no-images';
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

  // NEVER cache Supabase images (speakers photos)
  if (event.request.url.includes('supabase.co') && 
      event.request.url.includes('/storage/v1/object/')) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    );
    return;
  }

  // Cache-first strategy ONLY for known static assets
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

  // Network-first for all other requests (including external images)
  event.respondWith(
    fetch(event.request, {
      cache: event.request.url.includes('unsplash.com') ? 'default' : 'no-cache'
    })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});