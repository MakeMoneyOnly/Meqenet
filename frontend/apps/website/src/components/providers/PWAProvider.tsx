'use client';

import { useEffect } from 'react';
import { ApiConfig } from '@meqenet/shared/config';

export default function PWAProvider() {
  useEffect(() => {
    // Register service worker only in production and when supported
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      ApiConfig.isProduction
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          // Service Worker registered successfully
        })
        .catch(() => {
          // Service Worker registration failed - silently handle in production
        });
    }
  }, []);

  return null; // This component doesn't render anything
}
