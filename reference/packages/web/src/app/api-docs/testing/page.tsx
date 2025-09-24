export default function Testing() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-primary-700">Testing & Sandbox</h1>
      <p className="mb-6 text-base text-gray-700">Use our sandbox environment to test your integration before going live. The sandbox simulates real-world payment flows and webhooks without moving real money.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary-600">Sandbox Base URL</h2>
      <div className="bg-gray-100 p-4 rounded mb-6">
        <code>https://sandbox.api.meqenet.et/api/v1</code>
      </div>
      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary-600">Testing Credentials</h2>
      <ul className="list-disc pl-8 space-y-1 mb-6 text-base text-gray-800">
        <li>API Key: <code>test_xxxxxxxxxxxxx</code></li>
        <li>Merchant ID: <code>test_merchant_123</code></li>
      </ul>
      <div className="bg-primary-50 border-l-4 border-primary-400 p-4 rounded">
        <span className="font-semibold text-primary-700">Tip:</span> See the <b>API Reference</b> for details on using the sandbox and simulating different scenarios.
      </div>
    </div>
  );
}
