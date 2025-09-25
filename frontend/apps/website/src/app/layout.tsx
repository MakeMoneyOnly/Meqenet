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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
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
