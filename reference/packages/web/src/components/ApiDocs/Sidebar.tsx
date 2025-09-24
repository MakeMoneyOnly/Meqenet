'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const groups = [
  {
    label: 'INTRODUCTION',
    items: [
      { label: 'What is Meqenet?', href: '/api-docs/introduction' },
      { label: 'Technical Requirements', href: '/api-docs/requirements' },
      { label: 'Quick Start', href: '/api-docs/quick-start' },
    ],
  },
  {
    label: 'AUTH & USERS',
    items: [
      { label: 'Register & Login', href: '/api-docs/auth' },
      { label: 'User Profile & KYC', href: '/api-docs/kyc' },
    ],
  },
  {
    label: 'PAYMENT PLANS',
    items: [
      { label: 'List Payment Plans', href: '/api-docs/payment-plans' },
      { label: 'Plan Details', href: '/api-docs/payment-plans/details' },
    ],
  },
  {
    label: 'TRANSACTIONS',
    items: [
      { label: 'Create Transaction', href: '/api-docs/transactions/create' },
      { label: 'Transaction Status', href: '/api-docs/transactions/status' },
      { label: 'Repayment', href: '/api-docs/transactions/repayment' },
    ],
  },
  {
    label: 'PAYMENT GATEWAYS',
    items: [
      { label: 'Overview', href: '/api-docs/gateways' },
      { label: 'Telebirr Integration', href: '/api-docs/gateways/telebirr' },
      { label: 'Chapa Integration', href: '/api-docs/gateways/chapa' },
      { label: 'HelloCash Integration', href: '/api-docs/gateways/hellocash' },
    ],
  },
  {
    label: 'WEBHOOKS',
    items: [
      { label: 'Event Types', href: '/api-docs/webhooks/events' },
      { label: 'Payload Examples', href: '/api-docs/webhooks/payloads' },
      { label: 'Security & Retries', href: '/api-docs/webhooks/security' },
    ],
  },
  {
    label: 'TESTING & SANDBOX',
    items: [
      { label: 'Sandbox Environment', href: '/api-docs/testing/sandbox' },
      { label: 'Test Credentials', href: '/api-docs/testing/credentials' },
      { label: 'Common Scenarios', href: '/api-docs/testing/scenarios' },
    ],
  },
  {
    label: 'API REFERENCE',
    items: [
      { label: 'Interactive', href: '/api-docs/api-reference' },
    ],
  },
  {
    label: 'FAQ & ERRORS',
    items: [
      { label: 'FAQ', href: '/api-docs/faq' },
      { label: 'Error Codes', href: '/api-docs/errors' },
    ],
  },
];

export default function ApiDocsSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 sticky top-0 p-6 flex flex-col gap-8">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">{group.label}</div>
          <nav className="flex flex-col gap-1">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`py-2 px-3 rounded transition text-base font-medium ${
                  pathname === item.href
                    ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-700 hover:bg-gray-100 font-normal'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ))}
    </aside>
  );
}
