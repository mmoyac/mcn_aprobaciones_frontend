// El tenant se pasa como query param al registrar el SW: /sw.js?tenant=mga
const urlParams = new URLSearchParams(self.location.search);
const tenant = urlParams.get('tenant') || 'aprobaciones';
const CACHE_NAME = `${tenant}-aprobaciones-v1`;
const urlsToCache = [
  '/',
  '/api/manifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});