const BUILD_ID = Date.now();
const CACHE_NAME = `civeni-assets-v${BUILD_ID}`;
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/uploads/d2cf60ac-a7a6-4538-88d6-ab40f772400e.png'
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

  // Handle versioned images (respect ?v= parameter for cache busting)
  if (event.request.url.match(/\.(png|jpg|jpeg|webp|avif)$/)) {
    const url = new URL(event.request.url);
    if (url.searchParams.has('v')) {
      // Network-first for versioned images to respect cache busting
      event.respondWith(
        fetch(event.request, {
          cache: 'no-cache'
        }).catch(() => caches.match(event.request))
      );
      return;
    }
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
  if (event.request.url.includes('/uploads/') ||
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