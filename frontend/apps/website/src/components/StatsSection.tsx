import React from 'react';

// Simple, modular stats section for the landing page
// Each stat is displayed in a card for clarity and visual separation
// You can easily add/remove stats as needed
const stats = [
  { label: 'Active Users', value: '12,500+' },
  { label: 'Transactions', value: '1.2M+' },
  { label: 'Merchants', value: '320+' },
  { label: 'Countries', value: '5' },
];

export default function StatsSection() {
  return (
    <section className="py-12 bg-white dark:bg-zinc-900">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border bg-zinc-50 dark:bg-zinc-800 p-6 text-center shadow-sm"
            >
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</div>
              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
