const STATIC_CACHE = 'static-v1';
const PRODUCTS_CACHE = 'products-v1';
const IMAGES_CACHE = 'images-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      cache.addAll([
        '/',
        '/logo.png',
        '/manifest.webmanifest',
        '/icon-192.png',
        '/icon-512.png'
      ])
    )
  );
});

self.addEventListener('activate', event => {
  const allowed = [STATIC_CACHE, PRODUCTS_CACHE, IMAGES_CACHE];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => !allowed.includes(key) && caches.delete(key)))
    )
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/public/products')) {
    event.respondWith(staleWhileRevalidate(event.request, PRODUCTS_CACHE));
    return;
  }

  if (url.pathname.match(/\/uploads\/.*\.(png|jpg|jpeg|gif|webp)$/)) {
    event.respondWith(cacheFirst(event.request, IMAGES_CACHE, 50));
    return;
  }
});

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then(async cache => {
    const cached = await cache.match(request);
    const network = fetch(request)
      .then(response => {
        cache.put(request, response.clone());
        return response;
      })
      .catch(() => cached);
    return cached || network;
  });
}

function cacheFirst(request, cacheName, maxItems) {
  return caches.open(cacheName).then(async cache => {
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    cache.put(request, response.clone());
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      cache.delete(keys[0]);
    }
    return response;
  });
}
