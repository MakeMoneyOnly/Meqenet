/// <reference lib="webworker" />
import { precacheAndRoute } from '@serwist/precaching';

// eslint-disable-next-line no-undef
declare const self: ServiceWorkerGlobalScope & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __SW_MANIFEST: any[];
};

// This is injected by Serwist during build
precacheAndRoute(self.__SW_MANIFEST);

// Handle push notifications (for future BNPL payment reminders)
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
