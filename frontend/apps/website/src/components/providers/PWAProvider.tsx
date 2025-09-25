'use client';

import { useEffect } from 'react';
import { ApiConfig } from '@meqenet/shared/config';

export default function PWAProvider() {
  useEffect(() => {
    // Register service worker in production and development (for Lighthouse testing)
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (ApiConfig.isProduction || ApiConfig.isDevelopment)
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Service Worker registered successfully
          if (ApiConfig.isDevelopment) {
            // eslint-disable-next-line no-console
            console.log('Service Worker registered:', registration.scope);
          }
        })
        .catch((error) => {
          // Service Worker registration failed - log in development, silently handle in production
          if (ApiConfig.isDevelopment) {
            // eslint-disable-next-line no-console
            console.error('Service Worker registration failed:', error);
          }
        });
    }
  }, []);

  return null; // This component doesn't render anything
}
