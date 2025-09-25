import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import InnerLayout from '@/components/common/InnerLayout';
import CursorFollower from '@/components/common/ui/CursorFollower';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PWAProvider } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Meqenet | BNPL in Ethiopia',
  description:
    'Meqenet is a "Buy Now, Pay Later" service in Ethiopia that allows customers to make purchases and pay for them in installments.',
  manifest: '/manifest.json',
  themeColor: '#1f2937',
  viewport:
    'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Meqenet',
  },
  other: {
    'apple-touch-icon': '/icon-192x192.png',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Meqenet',
    'application-name': 'Meqenet',
    'msapplication-TileColor': '#1f2937',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA meta tags for better detection */}
        <meta name="application-name" content="Meqenet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Meqenet" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.png" />
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className + ' bg-[#f7fdfc]'}>
        <PWAProvider />
        <CursorFollower />
        <InnerLayout>{children}</InnerLayout>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
