import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import InnerLayout from '@/widgets/layout/InnerLayout';
import CursorFollower from '@/shared/ui/CursorFollower';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Meqenet | BNPL in Ethiopia',
  description:
    'Meqenet is a "Buy Now, Pay Later" service in Ethiopia that allows customers to make purchases and pay for them in installments.',
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
        <CursorFollower />
        <InnerLayout>{children}</InnerLayout>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
