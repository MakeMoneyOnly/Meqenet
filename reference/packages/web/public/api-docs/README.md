# Meqenet API Documentation

Welcome to the Meqenet API documentation. This guide will help you integrate Meqenet's Buy Now Pay Later (BNPL) service into your e-commerce platform.

## Getting Started

### 1. Register as a Merchant

To use the Meqenet API, you need to register as a merchant. Visit the [Merchant Portal](https://flexpay.et/merchant) to create an account.

### 2. Generate API Keys

After registration, you can generate API keys from the Merchant Portal. These keys will be used to authenticate your API requests.

### 3. Integrate the API

You can integrate the Meqenet API using our SDKs or directly via REST API calls.

## Authentication

All API requests must include your API key in the `x-api-key` header:

```
x-api-key: your_api_key
```

## Creating a Transaction

To create a new BNPL transaction, send a POST request to `/merchants/transactions`:

```bash
curl -X POST https://api.flexpay.et/api/v1/merchants/transactions \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "ETB",
    "customer": {
      "phoneNumber": "+251912345678",
      "email": "customer@example.com"
    },
    "items": [
      {
        "name": "Product Name",
        "price": 1000,
        "quantity": 1
      }
    ],
    "redirectUrl": "https://your-store.com/checkout/complete"
  }'
```

### Response

```json
{
  "id": "tx_123456789",
  "amount": 1000,
  "currency": "ETB",
  "status": "PENDING",
  "paymentUrl": "https://pay.flexpay.et/checkout/tx_123456789",
  "createdAt": "2024-08-15T12:00:00Z",
  "updatedAt": "2024-08-15T12:00:00Z"
}
```

## Webhooks

Meqenet can send webhook notifications to your server when transaction statuses change. Configure your webhook URL in the Merchant Portal.

### Webhook Events

- `transaction.created`: A new transaction has been created
- `transaction.approved`: A transaction has been approved
- `transaction.rejected`: A transaction has been rejected
- `transaction.completed`: A transaction has been completed
- `transaction.cancelled`: A transaction has been cancelled

### Webhook Payload

```json
{
  "event": "transaction.completed",
  "data": {
    "id": "tx_123456789",
    "amount": 1000,
    "currency": "ETB",
    "status": "COMPLETED",
    "merchantReference": "order_123",
    "createdAt": "2024-08-15T12:00:00Z",
    "updatedAt": "2024-08-15T12:30:00Z"
  }
}
```

## SDKs

We provide SDKs for popular programming languages:

- [JavaScript SDK](https://github.com/flexpay/flexpay-js)
- [PHP SDK](https://github.com/flexpay/flexpay-php)
- [Python SDK](https://github.com/flexpay/flexpay-python)

## Support

If you need help with the API, please contact our support team at [support@flexpay.et](mailto:support@flexpay.et) or visit our [support portal](https://flexpay.et/support).
