# Meqenet API JavaScript Examples

This directory contains JavaScript/TypeScript examples for integrating with the Meqenet API.

## Prerequisites

```bash
# Install required packages
npm install axios
# or
yarn add axios

# For TypeScript support
npm install --save-dev @types/node
```

## Quick Start

```javascript
const MeqenetAPI = require('./meqenet-client');

// Initialize client
const client = new MeqenetAPI({
  baseURL: 'https://api.meqenet.et/v1',
  language: 'en' // or 'am' for Amharic
});

// Authenticate
await client.login('user@example.com', 'password');

// Make API calls
const profile = await client.getCurrentUser();
```

## Examples

1. **authentication.js** - User registration, login, and token management
2. **payments.js** - Payment processing and transaction management  
3. **bnpl.js** - BNPL loan application and management
4. **merchants.js** - Merchant onboarding and API key management
5. **meqenet-client.js** - Complete API client implementation

## Running Examples

```bash
# Run specific example
node authentication.js

# With environment variables
API_BASE_URL=http://localhost:3000/api/v1 node authentication.js
```

## Environment Variables

Create a `.env` file:

```env
API_BASE_URL=https://api.meqenet.et/v1
API_LANGUAGE=en
TEST_EMAIL=test@example.com
TEST_PASSWORD=SecurePassword123!
```

## Error Handling

All examples include proper error handling for:
- Network errors
- Authentication failures
- Validation errors
- Rate limiting
- NBE compliance errors

## Support

For more information, see the main API documentation or contact the development team.