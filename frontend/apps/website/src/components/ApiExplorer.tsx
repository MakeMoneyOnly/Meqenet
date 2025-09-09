'use client';

import React, { useState } from 'react';
import axios from 'axios';

interface ApiEndpoint {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  requestBody?: Record<string, unknown>;
}

const endpoints: ApiEndpoint[] = [
  {
    name: 'Create Transaction',
    method: 'POST',
    path: '/merchants/transactions',
    description: 'Create a new BNPL transaction',
    requestBody: {
      amount: 1000,
      currency: 'ETB',
      customer: {
        phoneNumber: '+251912345678',
        email: 'customer@example.com',
      },
      items: [
        {
          name: 'Product Name',
          price: 1000,
          quantity: 1,
        },
      ],
      redirectUrl: 'https://your-store.com/checkout/complete',
    },
  },
  {
    name: 'Get Transaction',
    method: 'GET',
    path: '/merchants/transactions/{id}',
    description: 'Get details of a specific transaction',
  },
  {
    name: 'List Transactions',
    method: 'GET',
    path: '/merchants/transactions',
    description: 'List all transactions for the merchant',
  },
];

export default function ApiExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(
    endpoints[0],
  );
  const [apiKey, setApiKey] = useState('');
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(selectedEndpoint.requestBody || {}, null, 2),
  );
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState('/api');

  const handleEndpointChange = (endpointName: string) => {
    const endpoint = endpoints.find((e) => e.name === endpointName);
    if (endpoint) {
      setSelectedEndpoint(endpoint);
      setRequestBody(JSON.stringify(endpoint.requestBody || {}, null, 2));
    }
  };

  const handleSendRequest = async () => {
    setLoading(true);
    setResponse('');

    try {
      let path = selectedEndpoint.path;
      // Replace path parameters with values (e.g., {id} -> 123)
      if (path.includes('{id}')) {
        path = path.replace('{id}', 'tx_123456789');
      }

      const url = `${baseUrl}${path}`;
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      };

      let result;
      switch (selectedEndpoint.method) {
        case 'GET':
          result = await axios.get(url, { headers });
          break;
        case 'POST':
          result = await axios.post(url, JSON.parse(requestBody), { headers });
          break;
        case 'PUT':
          result = await axios.put(url, JSON.parse(requestBody), { headers });
          break;
        case 'DELETE':
          result = await axios.delete(url, { headers });
          break;
      }

      setResponse(JSON.stringify(result?.data || {}, null, 2));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      const errorResponse =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: unknown } }).response?.data
          : undefined;

      setResponse(
        JSON.stringify(
          {
            error: errorMessage,
            response: errorResponse,
          },
          null,
          2,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Interactive API Explorer</h2>

      <div className="mb-6">
        <label
          htmlFor="api-base-url"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          API Base URL
        </label>
        <select
          id="api-base-url"
          className="w-full p-2 border border-gray-300 rounded-md"
          value={baseUrl}
          onBlur={(e) => setBaseUrl(e.target.value)}
        >
          <option value="/api">Local API (Mock)</option>
          <option value="https://api.flexpay.et/api/v1">Production</option>
          <option value="https://staging-api.flexpay.et/api/v1">Staging</option>
        </select>
      </div>

      <div className="mb-6">
        <label
          htmlFor="api-key"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          API Key
        </label>
        <input
          id="api-key"
          type="text"
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Enter your API key"
          value={apiKey}
          onBlur={(e) => setApiKey(e.target.value)}
          aria-label="API Key"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="endpoint-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Endpoint
        </label>
        <select
          id="endpoint-select"
          className="w-full p-2 border border-gray-300 rounded-md"
          value={selectedEndpoint.name}
          onBlur={(e) => handleEndpointChange(e.target.value)}
        >
          {endpoints.map((endpoint) => (
            <option key={endpoint.name} value={endpoint.name}>
              {endpoint.method} {endpoint.path} - {endpoint.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label
            htmlFor="request-body"
            className="block text-sm font-medium text-gray-700"
          >
            Request Body
          </label>
          <span className="text-xs text-gray-500">
            {selectedEndpoint.method === 'GET'
              ? '(Not applicable for GET requests)'
              : ''}
          </span>
        </div>
        <textarea
          id="request-body"
          className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm h-48"
          value={requestBody}
          onBlur={(e) => setRequestBody(e.target.value)}
          disabled={selectedEndpoint.method === 'GET'}
          aria-label="Request Body"
        />
      </div>

      <div className="mb-6">
        <button
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={handleSendRequest}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Request'}
        </button>
      </div>

      <div>
        <h3 className="block text-sm font-medium text-gray-700 mb-2">
          Response
        </h3>
        <pre className="bg-gray-100 p-4 rounded-md overflow-auto h-48 text-sm">
          {response || 'Response will appear here'}
        </pre>
      </div>
    </div>
  );
}
