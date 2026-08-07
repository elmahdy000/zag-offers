const CACHE_NAME = 'zag-offers-vendor-v2';
const urlsToCache = [
  '/login',
  '/manifest.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('Vendor App SW installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Vendor App cache opened');
        return Promise.all(urlsToCache.map((url) => cache.add(url).catch(() => undefined)));
      })
      .then(() => {
        console.log('Vendor App SW installed successfully');
      })
      .catch((error) => {
        console.error('Vendor App SW installation failed:', error);
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('Vendor App SW activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Vendor App deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Vendor App SW activated successfully');
    })
  );
});

// جلب الطلبات
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => (await caches.match('/login')) || new Response('Offline', { status: 503 }))
    );
    return;
  }

  const isStaticAsset = requestUrl.pathname.startsWith('/_next/static/')
    || requestUrl.pathname.startsWith('/brand/')
    || /\.(?:png|svg|ico|woff2?)$/i.test(requestUrl.pathname)
    || requestUrl.pathname === '/manifest.webmanifest';
  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});

// تحديث الـ cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
