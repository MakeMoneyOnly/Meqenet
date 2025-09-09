export default function QuickStart() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-primary-700">Quick Start</h1>
      <ol className="list-decimal pl-8 space-y-3 mb-6 text-base text-gray-800">
        <li>Sign up for a Meqenet merchant account and obtain your API key.</li>
        <li>
          Read the <b>Technical Requirements</b> section to ensure your system
          is ready.
        </li>
        <li>
          Authenticate using the <b>Register & Login</b> endpoints to obtain a
          JWT token.
        </li>
        <li>
          Integrate KYC flows for Ethiopian users (see <b>User Profile & KYC</b>
          ).
        </li>
        <li>
          Choose and configure a <b>Payment Gateway</b> (Telebirr, Chapa,
          HelloCash).
        </li>
        <li>
          Use the <b>Payment Plans</b> endpoints to display available
          installment options.
        </li>
        <li>
          Create transactions and handle repayments using the{' '}
          <b>Transactions</b> endpoints.
        </li>
        <li>
          Set up your <b>Webhook</b> endpoint to receive real-time updates.
        </li>
        <li>
          Test your integration in the <b>Sandbox Environment</b> before going
          live.
        </li>
      </ol>
      <div className="bg-primary-50 border-l-4 border-primary-400 p-4 rounded">
        <span className="font-semibold text-primary-700">Need help?</span>{' '}
        Contact our support team for integration assistance or see the API
        Reference for detailed endpoint documentation.
      </div>
    </div>
  );
}
