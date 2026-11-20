// AgroBarú Service Worker - Offline First Caching Strategy
const CACHE_NAME = 'agrobaru-v1.7.3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(STATIC_ASSETS);
      // Los assets de Vite llevan hash, por lo que se descubren leyendo el
      // index.html generado y se precargan para permitir la recarga offline.
      try {
        const response = await fetch('/index.html', { cache: 'no-store' });
        const html = await response.text();
        const urls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(
          (match) => match[1],
        );
        await Promise.all(
          [...new Set(urls)].map((url) => cache.add(url).catch(() => undefined)),
        );
      } catch {
        // Sin red durante la instalación: el runtime cache los guardará luego.
      }
    })(),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo se cachean GET del mismo origen. Peticiones a Firebase/APIs y
  // cualquier POST/PUT/DELETE pasan directo a la red.
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Navegación: red primero, con respaldo en caché cuando no hay conexión.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return networkResponse;
        })
        .catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  // Recursos estáticos: caché primero (los assets llevan hash de Vite).
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          return networkResponse;
        })
        .catch(() => {
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});

// Firebase Cloud Messaging & Web Push Background Handlers
self.addEventListener('push', (event) => {
  let data = {
    title: 'AgroBarú // Alerta',
    body: 'Tienes una actualización importante de tu finca o pedidos.',
  };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'AgroBarú', body: event.data.text() };
    }
  }

  const isSigatoka =
    (data.title || '').toLowerCase().includes('sigatoka') || data.type === 'sigatoka_alert';
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.id || (isSigatoka ? 'sigatoka_alert' : 'buyer_order'),
    vibrate: isSigatoka ? [300, 200, 300, 200, 500] : [250, 150, 250],
    data: data,
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = event.notification.data?.route || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICKED', route: route });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
