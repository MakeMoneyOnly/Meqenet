'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SDK {
  name: string;
  language: string;
  description: string;
  version: string;
  installCommand: string;
  githubUrl: string;
  docsUrl: string;
  icon: string;
}

const sdks: SDK[] = [
  {
    name: 'FlexPay JavaScript SDK',
    language: 'JavaScript',
    description: 'Official JavaScript SDK for web and Node.js applications',
    version: '1.0.0',
    installCommand: 'npm install flexpay-js',
    githubUrl: 'https://github.com/flexpay/flexpay-js',
    docsUrl: '/api-docs/sdk/javascript',
    icon: 'javascript',
  },
  {
    name: 'FlexPay PHP SDK',
    language: 'PHP',
    description: 'Official PHP SDK for server-side integration',
    version: '1.0.0',
    installCommand: 'composer require flexpay/flexpay-php',
    githubUrl: 'https://github.com/flexpay/flexpay-php',
    docsUrl: '/api-docs/sdk/php',
    icon: 'php',
  },
  {
    name: 'FlexPay Python SDK',
    language: 'Python',
    description: 'Official Python SDK for server-side integration',
    version: '1.0.0',
    installCommand: 'pip install flexpay',
    githubUrl: 'https://github.com/flexpay/flexpay-python',
    docsUrl: '/api-docs/sdk/python',
    icon: 'python',
  },
  {
    name: 'FlexPay Android SDK',
    language: 'Java/Kotlin',
    description: 'Official Android SDK for mobile applications',
    version: '1.0.0',
    installCommand: 'implementation "et.flexpay:flexpay-android:1.0.0"',
    githubUrl: 'https://github.com/flexpay/flexpay-android',
    docsUrl: '/api-docs/sdk/android',
    icon: 'android',
  },
  {
    name: 'FlexPay iOS SDK',
    language: 'Swift',
    description: 'Official iOS SDK for mobile applications',
    version: '1.0.0',
    installCommand: 'pod "FlexPay"',
    githubUrl: 'https://github.com/flexpay/flexpay-ios',
    docsUrl: '/api-docs/sdk/ios',
    icon: 'apple',
  },
];

export default function SdkDownloadCenter() {
  const [filter, setFilter] = useState('all');

  const filteredSdks = filter === 'all' 
    ? sdks 
    : sdks.filter(sdk => sdk.language.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">SDK Download Center</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Language</label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Languages</option>
          <option value="javascript">JavaScript</option>
          <option value="php">PHP</option>
          <option value="python">Python</option>
          <option value="java">Java/Kotlin</option>
          <option value="swift">Swift</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSdks.map((sdk) => (
          <div key={sdk.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full mr-3">
                {sdk.icon === 'javascript' && <span className="text-yellow-500 font-bold">JS</span>}
                {sdk.icon === 'php' && <span className="text-indigo-500 font-bold">PHP</span>}
                {sdk.icon === 'python' && <span className="text-blue-500 font-bold">PY</span>}
                {sdk.icon === 'android' && <span className="text-green-500 font-bold">A</span>}
                {sdk.icon === 'apple' && <span className="text-gray-800 font-bold">iOS</span>}
              </div>
              <div>
                <h3 className="font-semibold">{sdk.name}</h3>
                <p className="text-xs text-gray-500">v{sdk.version}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{sdk.description}</p>
            
            <div className="bg-gray-100 p-2 rounded-md mb-4 overflow-x-auto">
              <code className="text-sm">{sdk.installCommand}</code>
            </div>
            
            <div className="flex justify-between">
              <Link href={sdk.docsUrl} className="text-primary-600 hover:text-primary-800 text-sm">
                Documentation
              </Link>
              <Link href={sdk.githubUrl} className="text-primary-600 hover:text-primary-800 text-sm">
                GitHub
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
