/// <reference lib="webworker" />
/// <reference lib="dom" />
import { Serwist, type PrecacheEntry } from 'serwist';

// Declare self for service worker context
declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: unknown[];
};

// This is injected by Serwist during build
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST as (string | PrecacheEntry)[],
});

serwist.addEventListeners();

// Handle push notifications (for BNPL payment reminders)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener('push', (event: any) => {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener('notificationclick', (event: any) => {
  // eslint-disable-next-line no-console
  console.log('[ServiceWorker] Notification click received.');

  event.notification.close();

  event.waitUntil(self.clients.openWindow('/'));
});
