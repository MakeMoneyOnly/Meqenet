/// <reference lib="webworker" />
/// <reference lib="dom" />
import { precacheAndRoute, createHandlerBoundToURL } from '@serwist/precaching';
import { registerRoute, NavigationRoute } from '@serwist/routing';
import { CacheFirst, NetworkFirst } from '@serwist/strategies';
import { ExpirationPlugin } from '@serwist/expiration';

declare const self: unknown & {
  __SW_MANIFEST: (string | Request)[] | undefined;
};

// Global declarations for service worker environment
declare const caches: unknown;
declare const Response: unknown;

// This is injected by Serwist during build
precacheAndRoute(self.__SW_MANIFEST);

// Cache static assets with Cache First strategy
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  }),
);

// Cache API responses with Network First strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 5, // 5 minutes
      }),
    ],
  }),
);

// Cache images with Cache First strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  }),
);

// Handle navigation requests with Network First strategy
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/'), {
    allowlist: [/^(?!\/_).*/], // Exclude Next.js internal routes
  }),
);

// Handle offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        // Return cached offline page
        const cachedResponse =
          (await caches.match('/~offline')) ||
          (await caches.match('/')) ||
          (await fetch('/'));
        return cachedResponse || new Response('Offline', { status: 503 });
      }),
    );
  }
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== 'static-assets' &&
            cacheName !== 'api-cache' &&
            cacheName !== 'images'
          ) {
            return caches.delete(cacheName);
          }
          return Promise.resolve(); // Return resolved promise for caches we want to keep
        }),
      );

      // Take control of all clients
      await self.clients.claim();
    })(),
  );
});

// Handle push notifications (for BNPL payment reminders)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  // eslint-disable-next-line no-console
  console.log('[ServiceWorker] Notification click received.');

  event.notification.close();

  event.waitUntil(self.clients.openWindow('/'));
});

// Handle install event

self.addEventListener('install', () => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});
