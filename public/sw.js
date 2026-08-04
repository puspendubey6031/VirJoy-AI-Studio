// VirJoy AI - Progressive Web App Service Worker
const CACHE_NAME = 'virjoy-ai-v1.0.0';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png'
];

// Explicitly exclude sensitive API calls and auth endpoints from caching
const EXCLUDED_API_PATTERNS = [
  '/api/auth',
  '/api/user-stats',
  '/api/config',
  '/api/video',
  '/api/design',
  '/api/providers',
  '/api/subtitles',
  '/api/product'
];

// Install Event - Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching core app assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing legacy cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first for dynamic content, cache fallback for offline static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or requests to excluded API endpoints
  if (event.request.method !== 'GET') return;
  if (EXCLUDED_API_PATTERNS.some(pattern => url.pathname.startsWith(pattern))) {
    return; // Pass through directly to network, no caching
  }

  // Handle HTML navigation or SPA route requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with fresh index.html
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', responseClone));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedIndex = await cache.match('/index.html') || await cache.match('/');
          if (cachedIndex) return cachedIndex;
          const cachedOffline = await cache.match('/offline.html');
          if (cachedOffline) return cachedOffline;
          return new Response('<h1>VirJoy AI is Offline</h1><p>Please check your internet connection.</p>', {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // Handle static assets (JS, CSS, Images, Fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache asynchronously (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return networkResponse;
        })
        .catch(async () => {
          // Fallback if asset is missing and network fails
          if (event.request.headers.get('accept')?.includes('text/html')) {
            const cache = await caches.open(CACHE_NAME);
            return (await cache.match('/offline.html')) || (await cache.match('/'));
          }
          return new Response('', { status: 503, statusText: 'Service Unavailable (Offline)' });
        });
    })
  );
});

// Update Listener - Skip waiting when client requests
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push Notification Event Listener Infrastructure
self.addEventListener('push', (event) => {
  let data = { title: 'VirJoy AI Notice', body: 'New AI video or design generation ready!' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
