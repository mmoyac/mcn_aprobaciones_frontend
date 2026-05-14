// El tenant se pasa como query param al registrar el SW: /sw.js?tenant=mga
const urlParams = new URLSearchParams(self.location.search);
const tenant = urlParams.get('tenant') || 'aprobaciones';
const CACHE_NAME = `${tenant}-aprobaciones-v2`;
const urlsToCache = [
  '/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  // Activar inmediatamente sin esperar a que se cierre el SW anterior
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Eliminar caches de versiones anteriores
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Manifest e icono: siempre desde la red para reflejar el tenant correcto
  if (url.pathname === '/api/manifest' || url.pathname === '/api/icon' || url.pathname === '/api/apple-touch-icon') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Resto: cache first
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
