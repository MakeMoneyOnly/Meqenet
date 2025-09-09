'use client';

import dynamic from 'next/dynamic';

const RedocStandalone = dynamic(
  () => import('redoc').then((mod) => mod.RedocStandalone),
  { ssr: false },
);

export default function ApiPlayground() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-primary-700">
        API Playground
      </h1>
      <div className="mb-6 text-base text-gray-700">
        Try out Meqenet API endpoints live. Use your API key or the sandbox
        credentials to test requests and see real responses.
      </div>
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
