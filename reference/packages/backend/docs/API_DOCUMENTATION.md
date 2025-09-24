# Meqenet API Documentation

This document provides detailed information about the Meqenet API endpoints, request/response formats, and authentication mechanisms.

## Base URL

All API endpoints are relative to the base URL:

```
https://api.meqenet.et/api/v1
```

For local development:

```
http://localhost:3000/api/v1
```

## Authentication

### JWT Authentication

Most API endpoints require authentication using JSON Web Tokens (JWT). To authenticate, include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### API Key Authentication

Merchant integration endpoints require API key authentication. Include the API key in the request header:

```
x-api-key: <api-key>
```

## Error Handling

All errors follow a standard format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Error type"
}
```

Common HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication failed
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

## Endpoints

### Authentication

#### Register a new user

```
POST /auth/register
```

Request body:

```json
{
  "email": "user@example.com",
  "phoneNumber": "+251911234567",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

Response:

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "phoneNumber": "+251911234567",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2023-05-01T12:00:00Z"
}
```

#### Login

```
POST /auth/login
```

Request body:

```json
{
  "username": "user@example.com",
  "password": "securePassword123"
}
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user_id": "user-uuid"
}
```

#### Refresh Token

```
POST /auth/refresh
```

Request header:

```
Authorization: Bearer <refresh_token>
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

#### Logout

```
POST /auth/logout
```

Request header:

```
Authorization: Bearer <access_token>
```

Response: `204 No Content`

### Verification

#### Send Email Verification Code

```
POST /auth/verification/email/send
```

Request header:

```
Authorization: Bearer <access_token>
```

Response:

```json
{
  "success": true,
  "message": "Verification code sent to user@example.com",
  "isVerified": false
}
```

#### Verify Email

```
POST /auth/verification/email/verify
```

Request header:

```
Authorization: Bearer <access_token>
```

Request body:

```json
{
  "code": "123456"
}
```

Response:

```json
{
  "success": true,
  "message": "Verification successful"
}
```

#### Send Phone Verification Code

```
POST /auth/verification/phone/send
```

Request header:

```
Authorization: Bearer <access_token>
```

Response:

```json
{
  "success": true,
  "message": "Verification code sent to +251911234567",
  "isVerified": false
}
```

#### Verify Phone

```
POST /auth/verification/phone/verify
```

Request header:

```
Authorization: Bearer <access_token>
```

Request body:

```json
{
  "code": "123456"
}
```

Response:

```json
{
  "success": true,
  "message": "Verification successful"
}
```

### Credit

#### Get Credit Limit

```
GET /credit/limit
```

Request header:

```
Authorization: Bearer <access_token>
```

Response:

```json
{
  "creditLimit": 10000,
  "availableCredit": 8000,
  "usedCredit": 2000
}
```

#### Get Credit Limit History

```
GET /credit/limit/history
```

Request header:

```
Authorization: Bearer <access_token>
```

Response:

```json
[
  {
    "id": "history-uuid",
    "previousLimit": 5000,
    "newLimit": 10000,
    "reason": "Initial assessment",
    "createdAt": "2023-05-01T12:00:00Z"
  }
]
```

#### Submit Credit Assessment

```
POST /credit/assessment/submit
```

Request header:

```
Authorization: Bearer <access_token>
```

Request body:

```json
{
  "monthlyIncome": 15000,
  "monthlyExpenses": 5000,
  "employmentStatus": "FULL_TIME",
  "incomeFrequency": "MONTHLY",
  "existingLoanPayments": 2000,
  "housingStatus": "OWNED",
  "yearsAtCurrentEmployer": 3,
  "additionalIncomeSources": [
    {
      "source": "Freelancing",
      "amount": 2000,
      "frequency": "MONTHLY"
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "creditLimit": 15000,
  "message": "Your credit limit has been set to 15000 ETB"
}
```

### Payment Gateways

#### Initiate Payment

```
POST /payment-gateways/initiate
```

Request header:

```
Authorization: Bearer <access_token>
```

Request body:

```json
{
  "amount": 1000,
  "provider": "TELEBIRR",
  "description": "Payment for order #12345",
  "returnUrl": "https://meqenet.et/payment/complete"
}
```

Response:

```json
{
  "success": true,
  "paymentUrl": "https://telebirr.com/pay?token=abc123",
  "reference": "FLEX-123456-1234567890",
  "expiresAt": "2023-05-01T12:30:00Z"
}
```

#### Check Payment Status

```
GET /payment-gateways/status/:reference
```

Request header:

```
Authorization: Bearer <access_token>
```

Response:

```json
{
  "status": "COMPLETED",
  "amount": 1000,
  "provider": "TELEBIRR",
  "reference": "FLEX-123456-1234567890",
  "completedAt": "2023-05-01T12:15:00Z"
}
```

### Transactions

#### Get User Transactions

```
GET /transactions
```

Request header:

```
Authorization: Bearer <access_token>
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (optional)
- `startDate`: Filter by start date (optional)
- `endDate`: Filter by end date (optional)

Response:

```json
{
  "data": [
    {
      "id": "transaction-uuid",
      "amount": 1000,
      "status": "COMPLETED",
      "type": "PAYMENT",
      "description": "Payment for order #12345",
      "createdAt": "2023-05-01T12:00:00Z",
      "completedAt": "2023-05-01T12:15:00Z"
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

#### Get Transaction Details

```
GET /transactions/:id
```

Request header:

```
Authorization: Bearer <access_token>
```

Response:

```json
{
  "id": "transaction-uuid",
  "amount": 1000,
  "status": "COMPLETED",
  "type": "PAYMENT",
  "description": "Payment for order #12345",
  "paymentMethod": "TELEBIRR",
  "reference": "FLEX-123456-1234567890",
  "createdAt": "2023-05-01T12:00:00Z",
  "completedAt": "2023-05-01T12:15:00Z",
  "metadata": {
    "orderId": "12345",
    "merchantId": "merchant-uuid"
  }
}
```

### Merchant Integration

#### Create Payment Link

```
POST /merchants/payment-links
```

Request header:

```
x-api-key: <api-key>
```

Request body:

```json
{
  "amount": 1000,
  "description": "Payment for order #12345",
  "expiresIn": 3600,
  "callbackUrl": "https://merchant.com/webhook",
  "returnUrl": "https://merchant.com/payment/complete",
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
  "description": "Payment for order #12345",
  "expiresAt": "2023-05-01T13:00:00Z",
  "status": "ACTIVE"
}
```

#### Check Payment Link Status

```
GET /merchants/payment-links/:id
```

Request header:

```
x-api-key: <api-key>
```

Response:

```json
{
  "id": "link-uuid",
  "status": "COMPLETED",
  "amount": 1000,
  "description": "Payment for order #12345",
  "createdAt": "2023-05-01T12:00:00Z",
  "expiresAt": "2023-05-01T13:00:00Z",
  "completedAt": "2023-05-01T12:15:00Z",
  "transaction": {
    "id": "transaction-uuid",
    "status": "COMPLETED"
  }
}
```

## Webhooks

### Payment Webhook

When a payment is completed, a webhook notification is sent to the merchant's callback URL:

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

The webhook includes a signature in the `x-meqenet-signature` header for verification:

```
x-meqenet-signature: t=1620000000,v1=5257a869e7bdd9b77a428a8d2a9c89b1c2b3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

To verify the signature:
1. Split the header value by comma to get the timestamp and signature
2. Concatenate the timestamp, a dot, and the request body
3. Compute the HMAC-SHA256 of the concatenated string using your webhook secret
4. Compare the computed signature with the signature in the header

## Rate Limiting

The API implements rate limiting to prevent abuse. The limits are:

- 60 requests per minute for authenticated endpoints
- 10 requests per minute for unauthenticated endpoints

Rate limit headers are included in the response:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1620000060
```

## Pagination

List endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

Pagination metadata is included in the response:

```json
{
  "data": [...],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

## Filtering and Sorting

List endpoints support filtering and sorting with the following query parameters:

- `sort`: Field to sort by (e.g., `createdAt:desc`)
- `filter`: Field to filter by (e.g., `status:COMPLETED`)

Multiple filters can be combined:

```
/transactions?sort=createdAt:desc&filter=status:COMPLETED&filter=amount:gt:1000
```

## Versioning

The API is versioned in the URL path:

```
/api/v1/...
```

When breaking changes are introduced, a new version will be released:

```
/api/v2/...
```
