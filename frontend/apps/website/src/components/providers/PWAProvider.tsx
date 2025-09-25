'use client';

import { useEffect } from 'react';
import { ApiConfig } from '@meqenet/shared/config';

// Type definitions for PWA events
declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;

    appinstalled: Event;

    'pwa-install-available': CustomEvent<{ prompt: () => Promise<void> }>;

    'pwa-installed': CustomEvent;
  }
}

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

    // Handle PWA install prompt
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-undef
      let deferredPrompt: BeforeInstallPromptEvent | null = null;

      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;

        // Show custom install button or dispatch event for UI to handle

        window.dispatchEvent(
          new CustomEvent('pwa-install-available', {
            detail: {
              prompt: async () => {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  await deferredPrompt.userChoice;
                  deferredPrompt = null;
                }
              },
            },
          }),
        );
      });

      window.addEventListener('appinstalled', () => {
        // App was installed
        deferredPrompt = null;

        window.dispatchEvent(new CustomEvent('pwa-installed'));
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
