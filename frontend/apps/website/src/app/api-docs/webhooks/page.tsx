export default function Webhooks() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-primary-700">Webhooks</h1>
      <p className="mb-6 text-base text-gray-700">
        Meqenet uses webhooks to notify your system about important events, such
        as payment status changes, installment updates, and disputes. Set up a
        publicly accessible endpoint to receive these notifications in real
        time.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary-600">
        Webhook Events
      </h2>
      <ul className="list-disc pl-8 space-y-1 mb-6 text-base text-gray-800">
        <li>
          <b>payment.completed</b> – A payment has been successfully processed
        </li>
        <li>
          <b>installment.due</b> – An installment is due soon
        </li>
        <li>
          <b>installment.paid</b> – An installment has been paid
        </li>
        <li>
          <b>dispute.created</b> – A dispute has been opened
        </li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2 text-primary-600">
        Sample Webhook Payload
      </h2>
      <pre className="bg-gray-100 p-4 rounded mb-6 text-sm overflow-x-auto">{`
{
  "event": "payment.completed",
  "data": {
    "transactionId": "txn_123456",
    "amount": 1000,
    "currency": "ETB",
    "status": "completed"
  },
  "timestamp": "2024-06-05T12:00:00Z"
}
`}</pre>
      <div className="bg-primary-50 border-l-4 border-primary-400 p-4 rounded">
        <span className="font-semibold text-primary-700">Tip:</span> See the{' '}
        <b>API Reference</b> for full details on webhook endpoints and payloads.
      </div>
    </div>
  );
}
