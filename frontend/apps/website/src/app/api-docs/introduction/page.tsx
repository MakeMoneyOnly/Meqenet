export default function Introduction() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-6 text-primary-700">
        What is Meqenet?
      </h1>
      <p className="mb-6 text-lg text-gray-700">
        <b>Meqenet</b> is Ethiopia’s leading Buy Now Pay Later (BNPL) platform,
        enabling merchants and partners to offer flexible, Sharia-compliant
        installment payments to their customers. Our APIs are designed for
        seamless integration with e-commerce, fintech, and retail platforms,
        supporting local payment methods and full compliance with NBE
        regulations.
      </p>
      <ul className="list-disc pl-8 space-y-2 mb-6 text-base text-gray-800">
        <li>RESTful API with predictable, versioned endpoints</li>
        <li>Supports Telebirr, Chapa, HelloCash, and more</li>
        <li>Flexible, interest-free installment plans (3, 6, 12 months)</li>
        <li>Real-time KYC and credit assessment for Ethiopian users</li>
        <li>Comprehensive webhooks and reporting</li>
        <li>Secure authentication and role-based access</li>
        <li>Built for NBE compliance and local market needs</li>
      </ul>
      <div className="bg-primary-50 border-l-4 border-primary-400 p-4 rounded mb-6">
        <span className="font-semibold text-primary-700">Tip:</span> Use the
        sidebar to explore integration guides, API reference, payment gateway
        details, and more.
      </div>
    </div>
  );
}
