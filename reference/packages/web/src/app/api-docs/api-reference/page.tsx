"use client";

import dynamic from 'next/dynamic';

const RedocStandalone = dynamic(
  () => import('redoc').then(mod => mod.RedocStandalone),
  { ssr: false }
);

export default function ApiReference() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-primary-700">API Reference</h1>
      <div className="mb-6 text-base text-gray-700">Browse all available endpoints, schemas, and request/response examples. Use the interactive explorer below to try out the API.</div>
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow">
        <RedocStandalone
          specUrl="https://api.meqenet.et/docs-json"
          options={{
            theme: {
              colors: {
                primary: { main: '#0ea5e9' },
              },
              sidebar: { backgroundColor: '#f8fafc' },
            },
            hideDownloadButton: false,
            nativeScrollbars: true,
            expandResponses: 'all',
          }}
        />
      </div>
    </div>
  );
}
