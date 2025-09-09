'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Documentation', href: '/api-docs' },
  { label: 'API Playground', href: '/api-docs/playground' },
];

export default function DocsTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-8 border-b border-gray-200 bg-transparent px-2 pt-2 pb-0 mb-2">
      {tabs.map((tab) => {
        const isActive =
          tab.href === '/api-docs'
            ? pathname === '/api-docs' ||
              (pathname.startsWith('/api-docs/') &&
                !pathname.startsWith('/api-docs/playground'))
            : pathname.startsWith('/api-docs/playground');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-base font-semibold pb-2 transition border-b-2 ${
              isActive
                ? 'text-green-700 border-green-500'
                : 'text-gray-500 border-transparent hover:text-black'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
