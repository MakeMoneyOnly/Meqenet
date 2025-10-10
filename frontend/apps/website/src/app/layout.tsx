import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata, Viewport } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Meqenet | BNPL in Ethiopia',
  description:
    'Meqenet is a "Buy Now, Pay Later" service in Ethiopia that allows customers to make purchases and pay for them in installments.',
  manifest: '/manifest.json',
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
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'msapplication-tap-highlight': 'no',
  },
  icons: {
    apple: [
      { url: '/icon-192x192.png' },
      { url: '/icon-192x192.png', sizes: '192x192' },
      { url: '/icon-512x512.png', sizes: '512x512' },
    ],
  },
  alternates: {
    canonical: '/',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1f2937',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className + ' bg-[#f7fdfc]'}>{children}</body>
    </html>
  );
}
