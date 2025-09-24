# Merchant Integration Guide

This document provides detailed instructions for merchants to integrate with the Meqenet BNPL (Buy Now Pay Later) platform.

## Overview

Meqenet allows merchants to offer flexible payment options to their customers in Ethiopia. By integrating with Meqenet, merchants can:

1. Offer installment payments to customers
2. Increase conversion rates and average order value
3. Receive full payment upfront while customers pay over time
4. Access a growing customer base of Meqenet users

## Integration Options

Meqenet offers multiple integration options to suit different merchant needs:

1. **API Integration**: Direct integration with our RESTful API
2. **Payment Links**: Generate payment links for individual transactions
3. **Checkout SDK**: Embed Meqenet checkout directly in your website
4. **Plugin Integration**: Pre-built plugins for popular e-commerce platforms

## Getting Started

### 1. Create a Merchant Account

1. Sign up at [https://merchant.meqenet.et](https://merchant.meqenet.et)
2. Complete the merchant verification process
3. Set up your business profile and banking details

### 2. Obtain API Credentials

1. Log in to your merchant dashboard
2. Navigate to Settings > API Keys
3. Generate a new API key
4. Store your API key securely - it will only be shown once

## API Integration

### Authentication

All API requests must include your API key in the header:

```
x-api-key: your_api_key_here
```

### Base URL

```
https://api.meqenet.et/api/v1/merchants
```

### Create a Payment

```http
POST /payment-links
Content-Type: application/json
x-api-key: your_api_key_here

{
  "amount": 1000,
  "description": "Order #12345",
  "expiresIn": 3600,
  "callbackUrl": "https://your-website.com/webhook",
  "returnUrl": "https://your-website.com/payment/complete",
  "metadata": {
    "orderId": "12345",
    "customerId": "customer-123"
  }
}
```

Response:

```json
{
  "id": "link-uuid",
  "url": "https://meqenet.et/pay/link-uuid",
  "amount": 1000,
  "description": "Order #12345",
  "expiresAt": "2023-05-01T13:00:00Z",
  "status": "ACTIVE"
}
```

### Check Payment Status

```http
GET /payment-links/link-uuid
x-api-key: your_api_key_here
```

Response:

```json
{
  "id": "link-uuid",
  "status": "COMPLETED",
  "amount": 1000,
  "description": "Order #12345",
  "createdAt": "2023-05-01T12:00:00Z",
  "expiresAt": "2023-05-01T13:00:00Z",
  "completedAt": "2023-05-01T12:15:00Z",
  "transaction": {
    "id": "transaction-uuid",
    "status": "COMPLETED"
  }
}
```

### List Payments

```http
GET /payment-links?page=1&limit=10
x-api-key: your_api_key_here
```

Response:

```json
{
  "data": [
    {
      "id": "link-uuid-1",
      "status": "COMPLETED",
      "amount": 1000,
      "description": "Order #12345",
      "createdAt": "2023-05-01T12:00:00Z"
    },
    {
      "id": "link-uuid-2",
      "status": "PENDING",
      "amount": 2000,
      "description": "Order #12346",
      "createdAt": "2023-05-01T12:30:00Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### Cancel Payment

```http
POST /payment-links/link-uuid/cancel
x-api-key: your_api_key_here
```

Response:

```json
{
  "id": "link-uuid",
  "status": "CANCELLED",
  "amount": 1000,
  "description": "Order #12345",
  "createdAt": "2023-05-01T12:00:00Z",
  "cancelledAt": "2023-05-01T12:30:00Z"
}
```

## Webhooks

Webhooks allow you to receive real-time notifications about payment events.

### Webhook Events

| Event | Description |
|-------|-------------|
| `payment.created` | A new payment has been created |
| `payment.completed` | A payment has been completed successfully |
| `payment.failed` | A payment has failed |
| `payment.cancelled` | A payment has been cancelled |
| `payment.expired` | A payment has expired |

### Webhook Payload

```json
{
  "event": "payment.completed",
  "data": {
    "id": "transaction-uuid",
    "amount": 1000,
    "status": "COMPLETED",
    "reference": "FLEX-123456-1234567890",
    "completedAt": "2023-05-01T12:15:00Z",
    "metadata": {
      "orderId": "12345",
      "customerId": "customer-123"
    }
  },
  "timestamp": "2023-05-01T12:15:00Z"
}
```

### Webhook Signature

To verify webhook authenticity, we include a signature in the `x-meqenet-signature` header:

```
x-meqenet-signature: t=1620000000,v1=5257a869e7bdd9b77a428a8d2a9c89b1c2b3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

To verify the signature:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  // Extract timestamp and signature value
  const [timestampPart, signaturePart] = signature.split(',');
  const timestamp = timestampPart.split('=')[1];
  const signatureValue = signaturePart.split('=')[1];
  
  // Create string to sign
  const stringToSign = `${timestamp}.${JSON.stringify(payload)}`;
  
  // Compute HMAC
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(stringToSign)
    .digest('hex');
  
  // Compare signatures
  return crypto.timingSafeEqual(
    Buffer.from(signatureValue),
    Buffer.from(computedSignature)
  );
}
```

### Webhook Best Practices

1. Respond to webhooks quickly (within 5 seconds)
2. Implement idempotency to handle duplicate webhooks
3. Verify webhook signatures to ensure authenticity
4. Store webhook events for audit and troubleshooting
5. Implement retry logic for failed webhook processing

## Checkout SDK

### Installation

```bash
# npm
npm install @meqenet/checkout-sdk

# yarn
yarn add @meqenet/checkout-sdk
```

### Basic Usage

```javascript
import { MeqenetCheckout } from '@meqenet/checkout-sdk';

// Initialize the SDK
const checkout = new MeqenetCheckout({
  apiKey: 'your_api_key_here',
  environment: 'production', // or 'sandbox' for testing
});

// Create a payment
const payment = await checkout.createPayment({
  amount: 1000,
  description: 'Order #12345',
  metadata: {
    orderId: '12345',
    customerId: 'customer-123',
  },
});

// Open the checkout modal
checkout.open({
  paymentId: payment.id,
  onSuccess: (result) => {
    console.log('Payment successful:', result);
    // Redirect to success page or update UI
  },
  onCancel: () => {
    console.log('Payment cancelled');
    // Handle cancellation
  },
  onError: (error) => {
    console.error('Payment error:', error);
    // Handle error
  },
});
```

### Customization

```javascript
checkout.open({
  paymentId: payment.id,
  theme: {
    colors: {
      primary: '#4CAF50',
      secondary: '#FFC107',
      text: '#333333',
      background: '#FFFFFF',
    },
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
  },
  locale: 'am', // Amharic language
  // Other options...
});
```

## Plugin Integration

### WooCommerce Plugin

1. Download the Meqenet WooCommerce plugin from [https://merchant.meqenet.et/plugins](https://merchant.meqenet.et/plugins)
2. Install the plugin in your WordPress admin panel
3. Navigate to WooCommerce > Settings > Payments
4. Enable Meqenet and enter your API key
5. Configure payment options and appearance

### Shopify App

1. Visit the Shopify App Store and search for "Meqenet BNPL"
2. Add the app to your Shopify store
3. Follow the setup wizard to connect your Meqenet merchant account
4. Configure payment options in the app settings

## Testing

### Sandbox Environment

For testing, use our sandbox environment:

```
https://sandbox-api.meqenet.et/api/v1/merchants
```

### Test API Key

You can generate a test API key in your merchant dashboard under Settings > API Keys > Test Keys.

### Test Cards

| Card Number | Expiry | CVV | Result |
|-------------|--------|-----|--------|
| 4111 1111 1111 1111 | Any future date | Any 3 digits | Success |
| 4242 4242 4242 4242 | Any future date | Any 3 digits | Success |
| 4000 0000 0000 0002 | Any future date | Any 3 digits | Declined |

### Test Mobile Money

| Phone Number | Result |
|--------------|--------|
| +251911234567 | Success |
| +251911234568 | Insufficient funds |
| +251911234569 | Technical error |

## Going Live

### Checklist

1. Complete merchant verification
2. Set up banking details for settlements
3. Test integration in sandbox environment
4. Generate production API key
5. Update API endpoint to production
6. Perform end-to-end testing in production

### Production API Key

Generate your production API key in your merchant dashboard under Settings > API Keys > Production Keys.

### Production Endpoint

```
https://api.meqenet.et/api/v1/merchants
```

## Settlements

### Settlement Schedule

Settlements are processed according to the following schedule:

- **Daily Settlement**: Funds are settled every business day
- **Weekly Settlement**: Funds are settled every Monday
- **Monthly Settlement**: Funds are settled on the 1st of each month

### Settlement Reports

Settlement reports are available in your merchant dashboard under Finance > Settlements.

### Settlement Fees

| Transaction Volume (Monthly) | Fee |
|------------------------------|-----|
| < 100,000 ETB | 3.5% |
| 100,000 - 500,000 ETB | 3.0% |
| > 500,000 ETB | 2.5% |

## Security

### Data Protection

1. All API requests must use HTTPS
2. API keys should be kept secure and not exposed in client-side code
3. Implement IP whitelisting for API access
4. Rotate API keys periodically

### PCI Compliance

Meqenet handles all payment card data in a PCI-compliant manner. Merchants should never handle or store card details.

### Fraud Prevention

1. Monitor transactions for suspicious activity
2. Implement address verification for high-value orders
3. Use 3D Secure for card payments where available
4. Set transaction limits for new customers

## Support

### Documentation

Comprehensive API documentation is available at [https://docs.meqenet.et](https://docs.meqenet.et)

### Developer Support

For technical assistance, contact our developer support team:

- **Email**: developers@meqenet.et
- **Phone**: +251 11 123 4567
- **Support Hours**: Monday-Friday, 9:00-17:00 EAT

### Status Page

Check our system status at [https://status.meqenet.et](https://status.meqenet.et)

## FAQs

### General

**Q: What is the minimum transaction amount?**
A: The minimum transaction amount is 500 ETB.

**Q: What is the maximum transaction amount?**
A: The maximum transaction amount is 50,000 ETB.

**Q: How long does settlement take?**
A: Settlements are typically processed within 1-2 business days.

### Technical

**Q: Do you support recurring payments?**
A: Yes, recurring payments are supported through our API.

**Q: Can I test the integration without creating real transactions?**
A: Yes, you can use our sandbox environment for testing.

**Q: How do I handle failed webhooks?**
A: We retry failed webhooks up to 5 times over a 24-hour period.

## Appendix

### Error Codes

| Code | Description |
|------|-------------|
| `authentication_error` | Invalid API key |
| `validation_error` | Invalid request parameters |
| `rate_limit_exceeded` | Too many requests |
| `insufficient_funds` | Customer has insufficient funds |
| `payment_expired` | Payment link has expired |
| `payment_cancelled` | Payment was cancelled |
| `technical_error` | Internal server error |

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2023-01-01 | Initial release |
| 1.1.0 | 2023-03-15 | Added support for recurring payments |
| 1.2.0 | 2023-05-01 | Added support for Amharic language |
| 1.3.0 | 2023-07-15 | Added support for mobile money payments |
