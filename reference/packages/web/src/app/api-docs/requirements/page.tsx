export default function Requirements() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-primary-700">Technical Requirements</h1>
      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary-600">Status & Availability</h2>
      <p className="mb-4 text-base text-gray-700">Meqenet APIs are available 24/7 with high availability. <b>Note:</b> We do not currently provide a public status page. For incident notifications, please subscribe to our merchant communications.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary-600">Security Protocol</h2>
      <ul className="list-disc pl-8 space-y-2 mb-4 text-base text-gray-800">
        <li>All API requests must use <b>HTTPS</b> (TLS 1.2 or higher). TLS 1.3 is recommended.</li>
        <li>Industry-standard cipher suites are enforced. (Contact support for a full list if required for compliance.)</li>
        <li>All sensitive data is encrypted in transit and at rest (AES-256, TLS 1.3).</li>
        <li>Meqenet is compliant with NBE security directives and Ethiopian data protection laws.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary-600">Webhook Whitelisting</h2>
      <p className="mb-4 text-base text-gray-700">Webhook requests are sent from dynamic IPs. <b>Static IP whitelisting is not currently supported.</b> Please verify webhook signatures and use HTTPS endpoints for security.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary-600">Data Format</h2>
      <ul className="list-disc pl-8 space-y-2 mb-4 text-base text-gray-800">
        <li>All requests and responses use <b>JSON</b> format.</li>
        <li><b>Currency:</b> ETB (Ethiopian Birr), ISO 4217 code: <code>ETB</code></li>
        <li><b>Amount:</b> Amounts are in ETB, up to 2 decimals. Example: <code>{`{"amount": 1000.00}`}</code></li>
        <li><b>Phone:</b> Ethiopian phone numbers in international format: <code>+2519XXXXXXXX</code></li>
        <li><b>Dates:</b> All dates use ISO 8601 UTC format. Example: <code>2023-04-12T10:30:00Z</code></li>
        <li><b>Locale:</b> English (<code>en</code>) is supported. Amharic and other local languages coming soon.</li>
        <li><b>String Length:</b> Max 255 characters for most fields.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary-600">Rate Limits</h2>
      <ul className="list-disc pl-8 space-y-2 mb-4 text-base text-gray-800">
        <li>Public endpoints: 20 requests/minute per IP</li>
        <li>Authenticated endpoints: 100 requests/minute per user</li>
        <li>Sensitive endpoints (payments, credit checks): 10 requests/minute per user</li>
        <li>Rate limit headers: <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code></li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary-600">Authentication</h2>
      <ul className="list-disc pl-8 space-y-2 mb-4 text-base text-gray-800">
        <li>All protected endpoints require a JWT access token in the <code>Authorization: Bearer &lt;token&gt;</code> header.</li>
        <li>Tokens are obtained via the <b>/auth/login</b> endpoint. Refresh tokens are supported.</li>
        <li>API keys may be required for merchant/partner endpoints (see API Reference).</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary-600">Error Handling</h2>
      <ul className="list-disc pl-8 space-y-2 mb-4 text-base text-gray-800">
        <li>All errors use standard HTTP status codes (400, 401, 403, 404, 429, 500, etc.).</li>
        <li>Error responses include a structured error object:<br/>
          <code>{`{"error": {"code": "VALIDATION_ERROR", "message": "The request was invalid", "details": [...] }}`}</code>
        </li>
        <li>See the <b>Error Codes</b> section for a full list of error types.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary-600">Supported Browsers & Devices</h2>
      <ul className="list-disc pl-8 space-y-2 mb-4 text-base text-gray-800">
        <li>Meqenet APIs are platform-agnostic and can be integrated with any backend or mobile app.</li>
        <li>For web widgets, we support all modern browsers (Chrome, Firefox, Safari, Edge) and recent iOS/Android versions.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary-600">Regulatory Compliance</h2>
      <ul className="list-disc pl-8 space-y-2 mb-4 text-base text-gray-800">
        <li>Compliant with all relevant National Bank of Ethiopia (NBE) directives for payment systems, data security, and consumer protection.</li>
        <li>Strict adherence to Ethiopian AML/KYC laws (Proclamation No. 1176/2020).</li>
        <li>Data protection and privacy by design, in line with Ethiopian law.</li>
        <li>All payment gateway integrations (Telebirr, Chapa, HelloCash) follow provider-specific security and compliance requirements.</li>
      </ul>
    </div>
  );
}
