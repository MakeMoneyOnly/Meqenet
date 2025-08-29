# 🔐 Secret Management & Credential Rotation Setup

## Overview

This document provides comprehensive setup instructions for implementing secure secret management
and automated credential rotation in the Meqenet.et platform.

## 🏗️ Architecture

### Components

1. **SecretManagerService** - AWS Secrets Manager integration
2. **CredentialRotationService** - Automated credential rotation
3. **JWKSController** - JSON Web Key Set endpoint
4. **CredentialManagementController** - Management and monitoring APIs

### Security Features

- ✅ AWS Secrets Manager integration
- ✅ AWS KMS encryption/decryption
- ✅ Automated JWT key rotation
- ✅ Credential expiration tracking
- ✅ Secure credential generation
- ✅ JWKS endpoint for JWT verification

## 📋 Prerequisites

### AWS Setup

1. **AWS Account & IAM Permissions**

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "secretsmanager:GetSecretValue",
           "secretsmanager:UpdateSecret",
           "secretsmanager:CreateSecret",
           "secretsmanager:DescribeSecret",
           "secretsmanager:ListSecrets"
         ],
         "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:meqenet-*"
       },
       {
         "Effect": "Allow",
         "Action": ["kms:CreateKey", "kms:GenerateDataKey", "kms:Decrypt", "kms:Encrypt"],
         "Resource": "arn:aws:kms:us-east-1:*:key/*"
       }
     ]
   }
   ```

2. **Create KMS Key**

   ```bash
   aws kms create-key \
     --description "Meqenet encryption key" \
     --key-usage ENCRYPT_DECRYPT \
     --key-spec RSA_2048 \
     --tags Key=Meqenet,Environment=Production
   ```

3. **Create Initial Secrets**

   ```bash
   # JWT Keys Secret
   aws secretsmanager create-secret \
     --name "meqenet-jwt-keys" \
     --description "JWT signing keys for Meqenet authentication" \
     --secret-string '{"kid":"initial-key","createdAt":"2024-01-01T00:00:00Z"}'

   # Database Credentials
   aws secretsmanager create-secret \
     --name "meqenet-db-credentials" \
     --description "Database credentials for Meqenet" \
     --secret-string '{"username":"meqenet_prod","password":"secure_password_here"}'
   ```

## ⚙️ Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_SECRETS_MANAGER_ENDPOINT=https://secretsmanager.us-east-1.amazonaws.com
KMS_KEY_ID=alias/meqenet-kms-key

# JWT Configuration
JWT_KEY_ROTATION_ENABLED=true
JWT_KEY_ROTATION_DAYS=30

# Credential Rotation
DB_CREDENTIAL_ROTATION_DAYS=90
API_CREDENTIAL_ROTATION_DAYS=45
SERVICE_CREDENTIAL_ROTATION_DAYS=60
```

### Service Dependencies

The following packages have been added:

```json
{
  "@aws-sdk/client-secrets-manager": "^3.864.0",
  "@aws-sdk/client-kms": "^3.864.0",
  "@nestjs/schedule": "^4.1.0"
}
```

## 🚀 Implementation Details

### 1. Secret Manager Service

**Features:**

- AWS Secrets Manager integration
- Automatic JWT key generation and rotation
- Data encryption/decryption with KMS
- JWKS generation for JWT verification

**Key Methods:**

```typescript
// Get current JWT private key
getCurrentJwtPrivateKey(): string

// Get JWKS for JWT verification
getJWKS(): Promise<JWKSResponse>

// Encrypt data
encryptData(data: string, keyId?: string): Promise<string>

// Decrypt data
decryptData(encryptedData: string): Promise<string>
```

### 2. Credential Rotation Service

**Features:**

- Automated credential rotation scheduling
- Database and API credential management
- Rotation status tracking
- Service notification system

**Rotation Schedule:**

- Database credentials: Every 90 days
- API credentials: Every 45 days
- JWT keys: Every 30 days

### 3. JWKS Endpoint

**Endpoints:**

```
GET /jwks
GET /.well-known/jwks.json
```

**Response Format:**

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "meqenet-jwt-abc123",
      "n": "base64_encoded_modulus",
      "e": "AQAB",
      "alg": "RS256"
    }
  ]
}
```

### 4. Credential Management API

**Endpoints:**

```
GET    /credentials/status              # Get credential status report
GET    /credentials/due-for-rotation    # Get credentials due for rotation
POST   /credentials/:name/rotate        # Manually rotate specific credential
POST   /credentials/rotate-all-due      # Rotate all due credentials
GET    /credentials/secrets/list        # List all secrets
POST   /credentials/secrets/test-connection  # Test AWS connection
POST   /credentials/secrets/encrypt     # Encrypt data
POST   /credentials/secrets/decrypt     # Decrypt data
```

## 🔧 Setup Steps

### 1. Install Dependencies

```bash
cd backend/services/auth-service
pnpm install
```

### 2. Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1
```

### 3. Initialize Secrets

```bash
# The services will automatically create initial secrets on startup
# For manual initialization, use the AWS CLI or console
```

### 4. Start the Service

```bash
cd backend/services/auth-service
pnpm run start:dev
```

### 5. Test JWKS Endpoint

```bash
curl http://localhost:3000/jwks
```

## 🔍 Monitoring & Alerts

### Credential Status Monitoring

```bash
# Get credential status report
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/credentials/status
```

### Rotation Alerts

The service automatically logs rotation events. Configure alerts for:

- Failed rotations
- Upcoming rotations (7 days notice)
- Expired credentials
- AWS Secrets Manager errors

## 🛡️ Security Best Practices

### 1. Principle of Least Privilege

- Use specific IAM roles for each service
- Limit secret access to necessary services only
- Rotate IAM credentials regularly

### 2. Encryption at Rest

- All secrets are encrypted using AWS KMS
- Use envelope encryption for large data
- Rotate KMS keys annually

### 3. Network Security

- Use VPC endpoints for Secrets Manager
- Enable TLS for all communications
- Implement proper firewall rules

### 4. Audit & Compliance

- Enable CloudTrail for all AWS API calls
- Log all secret access and rotation events
- Regular security audits and penetration testing

## 📊 Monitoring Dashboard

### Key Metrics to Monitor

1. **Secret Rotation Status**
   - Credentials due for rotation
   - Failed rotation attempts
   - Rotation success rate

2. **AWS Secrets Manager**
   - API call rates
   - Error rates
   - Secret access patterns

3. **JWT Operations**
   - JWKS endpoint response times
   - Key rotation events
   - Token validation failures

### Sample Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Meqenet Secret Management",
    "panels": [
      {
        "title": "Credentials Due for Rotation",
        "type": "stat",
        "targets": [
          {
            "expr": "meqenet_credentials_due_for_rotation",
            "legendFormat": "Due"
          }
        ]
      },
      {
        "title": "Secret Access Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(aws_secretsmanager_get_secret_value[5m])",
            "legendFormat": "Access Rate"
          }
        ]
      }
    ]
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **AWS Credentials Error**

   ```
   Error: Unable to locate credentials
   ```

   Solution: Configure AWS credentials properly

2. **KMS Key Not Found**

   ```
   Error: Invalid key ID
   ```

   Solution: Verify KMS key ID and permissions

3. **Secret Not Found**

   ```
   Error: Secrets Manager can't find the specified secret
   ```

   Solution: Create the secret or check permissions

4. **Rotation Failed**
   ```
   Error: Credential rotation failed
   ```
   Solution: Check service logs and AWS permissions

### Debug Commands

```bash
# Test AWS connection
curl -X POST http://localhost:3000/credentials/secrets/test-connection

# List all secrets
curl http://localhost:3000/credentials/secrets/list

# Check credential status
curl http://localhost:3000/credentials/status
```

## 📚 API Documentation

### JWKS Endpoint

Returns the JSON Web Key Set for JWT token verification.

**Request:**

```http
GET /jwks HTTP/1.1
Host: your-api.com
Cache-Control: no-cache
```

**Response:**

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "meqenet-jwt-abc123",
      "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtmVGmNcA0UA2GJDB4PiMQb6J8vx9GGW2GjPzm4wWv...",
      "e": "AQAB",
      "alg": "RS256"
    }
  ]
}
```

## 🎯 Next Steps

1. **Configure AWS Infrastructure** - Set up proper IAM roles and KMS keys
2. **Implement Monitoring** - Add alerting and dashboards
3. **Security Review** - Conduct security assessment
4. **Documentation** - Update API documentation
5. **Testing** - Comprehensive testing of rotation scenarios

---

## 📞 Support

For issues related to secret management:

1. Check service logs in `/logs/auth-service/`
2. Verify AWS permissions and credentials
3. Review CloudTrail logs for AWS API calls
4. Contact the DevSecOps team for AWS-related issues

---

_This implementation follows Ethiopian FinTech regulatory requirements and AWS security best
practices._
