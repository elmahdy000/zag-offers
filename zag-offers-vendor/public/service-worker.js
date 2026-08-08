const VERSION = 'zag-vendor-v4';
const STATIC_CACHE = `${VERSION}-static`;
const IMAGE_CACHE = `${VERSION}-images`;
const CORE = ['/offline', '/manifest.webmanifest', '/icon-192x192.png', '/icon-512x512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('zag-vendor-') && !key.startsWith(VERSION)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match('/offline')) || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request).then((response) => {
    if (response.ok) void cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || refresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Authentication and business API responses must never be cached.
  if (url.hostname === 'api.zagoffers.online' || url.pathname.startsWith('/api/')) return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || /\.(?:css|js|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  if (/\.(?:png|webp|avif|svg|ico)$/i.test(url.pathname) || url.pathname.startsWith('/_next/image')) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});
