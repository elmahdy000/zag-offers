const CACHE_NAME = 'zag-offers-vendor-v1';
const urlsToCache = [
  '/dashboard',
  '/dashboard/offers',
  '/dashboard/coupons',
  '/dashboard/profile',
  '/dashboard/scan',
  '/login',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('Vendor App SW installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Vendor App cache opened');
        return cache.addAll(urlsToCache);
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
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          console.log('Vendor App cache hit:', event.request.url);
          return response;
        }

        // Cache miss - fetch from network
        console.log('Vendor App cache miss:', event.request.url);
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest);
      })
      .catch((error) => {
        console.error('Vendor App SW fetch error:', error);
        return new Response('Network error', { status: 500 });
      })
  );
});

// تحديث الـ cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
