# Meqenet API Postman Collections

This directory contains Postman collections and environments for testing the Meqenet 2.0 BNPL Platform API.

## Files

- `Meqenet-API-Collection.postman_collection.json` - Complete API collection with all endpoints
- `Meqenet-Local.postman_environment.json` - Environment variables for local development
- `Meqenet-Staging.postman_environment.json` - Environment variables for staging environment

## Getting Started

### 1. Import Collections and Environments

1. Open Postman
2. Click "Import" button
3. Select all three JSON files from this directory
4. Click "Import"

### 2. Select Environment

1. In Postman, select the appropriate environment from the dropdown:
   - **Meqenet Local** - For local development (http://localhost:3000)
   - **Meqenet Staging** - For staging environment (https://api.staging.meqenet.et)

### 3. Configure Environment Variables

#### For Local Environment:
- Default test credentials are pre-configured
- Update `test_email` and `test_password` if needed

#### For Staging Environment:
1. Click the environment quick look (eye icon)
2. Set the following sensitive values:
   - `test_password` - Your staging test account password
   - `api_key` - Your merchant API key (if testing merchant endpoints)
   - `webhook_secret` - Your webhook signing secret

### 4. Authentication Flow

The collection automatically handles authentication:

1. **Register New User**: Creates a new test user account
2. **Login**: Authenticates and saves tokens automatically
3. **Subsequent Requests**: Use saved `access_token` automatically

## Collection Features

### Pre-request Scripts

- Automatically generates unique request IDs for NBE compliance tracking
- Sets timestamp for each request
- Configures language headers (English/Amharic)

### Test Scripts

- Validates response times (< 2000ms)
- Checks for required compliance fields (requestId)
- Automatically saves tokens and IDs for chaining requests
- Validates response structure and status codes

### Global Variables

The collection uses the following dynamic variables:

- `{{$guid}}` - Generates unique IDs
- `{{$timestamp}}` - Current timestamp
- `{{$randomInt}}` - Random integer for test data

## Testing Workflows

### 1. User Registration and Authentication

```
1. Register User -> Saves access_token
2. Login -> Updates access_token
3. Get Current User -> Uses saved token
```

### 2. Payment Flow

```
1. Login -> Get token
2. Initiate Payment -> Get payment_id
3. Check Payment Status -> Uses payment_id
4. List Transactions -> View history
```

### 3. BNPL Loan Application

```
1. Login -> Get token
2. Apply for Loan -> Get loan_id
3. Get Payment Schedule -> Uses loan_id
4. Make Installment Payment -> Process payment
```

### 4. Merchant Onboarding

```
1. Apply as Merchant -> Submit application
2. Get Merchant Profile -> Check status
3. Generate API Key -> For integration
```

## Language Support

The API supports bilingual responses (English and Amharic). Set the `language` environment variable:

- `en` - English (default)
- `am` - Amharic (አማርኛ)

The collection automatically adds the `Accept-Language` header based on this setting.

## Security Best Practices

1. **Never commit sensitive data**: The environment files use placeholder values for secrets
2. **Use environment variables**: All sensitive data should be stored as environment variables
3. **Rotate API keys regularly**: Especially in staging/production
4. **Clear variables after testing**: Use "Reset" in environment settings

## NBE Compliance Features

The collection includes features required for Ethiopian National Bank compliance:

1. **Request ID Tracking**: Every request includes a unique `X-Request-ID` header
2. **Timestamp Logging**: All requests include timestamp for audit trails
3. **Bilingual Support**: Supports both English and Amharic responses
4. **Idempotency Keys**: Payment requests include idempotency keys

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Run the Login request to refresh your access token
   - Check that the environment has `access_token` set

2. **Connection Refused (Local)**
   - Ensure services are running: `npm run dev`
   - Check service ports match environment configuration

3. **Invalid Request ID**
   - The collection auto-generates request IDs
   - Ensure pre-request scripts are enabled

4. **Language Not Changing**
   - Update `language` in environment variables
   - Valid values: `en` or `am`

### Debug Mode

To enable detailed logging:

1. Open Postman Console (View > Show Postman Console)
2. Run requests to see detailed logs
3. Check pre-request and test script outputs

## Integration with CI/CD

### Newman CLI

Run collections from command line:

```bash
# Install Newman
npm install -g newman

# Run collection with local environment
newman run Meqenet-API-Collection.postman_collection.json \
  -e Meqenet-Local.postman_environment.json

# Run with custom variables
newman run Meqenet-API-Collection.postman_collection.json \
  -e Meqenet-Staging.postman_environment.json \
  --env-var "test_password=YourPassword"
```

### Docker

```bash
# Run with Newman Docker image
docker run -v $(pwd):/etc/newman \
  postman/newman:alpine \
  run Meqenet-API-Collection.postman_collection.json \
  -e Meqenet-Local.postman_environment.json
```

## Support

For issues or questions:

1. Check the API documentation at `/api/docs`
2. Review error messages in response body
3. Contact the development team

## Version History

- v1.0.0 - Initial collection with core endpoints
- Latest - Check Git history for updates

---

Last Updated: January 2024
Maintained by: Meqenet Development Team