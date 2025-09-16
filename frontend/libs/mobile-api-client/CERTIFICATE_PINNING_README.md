# Mobile Certificate Pinning Configuration

## Overview

This document explains how certificate pinning is implemented in the Meqenet mobile application to enhance security against man-in-the-middle (MITM) attacks.

## Security Benefits

Certificate pinning ensures that the mobile app only accepts connections to servers with certificates that match the expected certificate hashes. This prevents:

- MITM attacks using fraudulent certificates
- Certificate authority compromises
- SSL stripping attacks
- DNS spoofing attacks

## Implementation

The mobile app uses `react-native-ssl-pinning` library to implement certificate pinning with the following features:

- **SHA-256 certificate hash validation**
- **Subdomain support** (configurable)
- **Enforced pinning** in production
- **Graceful fallback** in development

## Configuration

Certificate hashes are configured in `src/lib/api-client.ts` in the `CERTIFICATE_PINNING_CONFIG` object:

```typescript
const CERTIFICATE_PINNING_CONFIG: CertificatePinningConfig = {
  'api.meqenet.et': {
    certificateHashes: [
      'sha256/YOUR_CERTIFICATE_HASH_HERE',
      'sha256/YOUR_BACKUP_CERTIFICATE_HASH_HERE'
    ],
    includeSubdomains: true,
    enforcePinning: true
  }
};
```

## Certificate Hash Generation

### Method 1: Using OpenSSL (Recommended)

```bash
# Get certificate from server
echo | openssl s_client -servername api.meqenet.et -connect api.meqenet.et:443 | openssl x509 -pubkey -noout | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -binary | openssl enc -base64
```

### Method 2: Using Browser Developer Tools

1. Navigate to `https://api.meqenet.et` in Chrome
2. Open Developer Tools → Security tab
3. Click "View certificate"
4. Go to "Details" tab
5. Export certificate as PEM
6. Use OpenSSL to generate hash:

```bash
openssl x509 -in certificate.pem -pubkey -noout | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -binary | openssl enc -base64
```

### Method 3: Using Online Tools

Use online certificate hash generators (not recommended for production due to security concerns).

## Certificate Rotation Process

### When certificates are renewed:

1. **Generate new certificate hashes** using the methods above
2. **Update the configuration** in `CERTIFICATE_PINNING_CONFIG`
3. **Test in staging environment** first
4. **Deploy updated app** to app stores
5. **Monitor for pinning errors** after deployment

### Grace Period Strategy

For smooth certificate rotation:

1. **Keep old certificate active** on servers during transition
2. **Include both old and new hashes** in app configuration
3. **Deploy updated app** with dual hashes
4. **Remove old certificate** from servers
5. **Deploy app update** with only new hash
6. **Monitor logs** for pinning failures

## Environment-Specific Configuration

### Production
- Certificate pinning is **enforced**
- All certificate hashes must be valid
- App will reject connections with invalid certificates

### Staging
- Certificate pinning is **enforced**
- Uses staging-specific certificate hashes
- Helps catch configuration issues before production

### Development
- Certificate pinning is **optional**
- Falls back to standard SSL validation if pinning fails
- Allows development with self-signed certificates

## Error Handling

When certificate pinning fails, the app will:

1. **Log the error** for monitoring
2. **Return a specific error code** (`CERTIFICATE_PINNING_FAILED`)
3. **Display user-friendly message** ("Security validation failed. Please update the app.")
4. **Trigger security monitoring** alerts

## Monitoring and Alerting

### Key Metrics to Monitor

- **Certificate pinning failure rate**
- **SSL handshake failures**
- **MITM attack attempts** (detected via pinning failures)

### Alert Conditions

- Certificate pinning failures > 1% of requests
- Sudden spike in pinning failures (potential attack)
- Certificate expiry warnings (30 days before expiry)

## Testing

### Manual Testing

```typescript
// Test certificate pinning in development
import { disableCertificatePinning, isCertificatePinningActive } from './api-client';

// Temporarily disable pinning for testing
await disableCertificatePinning('api.meqenet.et');

// Check if pinning is active
console.log(isCertificatePinningActive('api.meqenet.et'));
```

### Automated Testing

Add tests for:
- Certificate hash validation
- Pinning failure scenarios
- Certificate rotation workflows
- Error handling

## Security Considerations

### Certificate Management

- **Store certificate hashes** securely (not in version control)
- **Use multiple certificate hashes** for redundancy
- **Implement certificate monitoring** for expiry dates
- **Have incident response plan** for certificate compromise

### Key Rotation

- **Rotate certificates regularly** (every 90-180 days)
- **Use automated certificate management** (Let's Encrypt, AWS ACM)
- **Test rotation process** in staging before production
- **Have rollback plan** for failed rotations

### Backup Certificates

- **Maintain backup certificates** for emergency scenarios
- **Test backup certificate activation** regularly
- **Document backup certificate procedures**

## Troubleshooting

### Common Issues

1. **Certificate expired**: Update with new certificate hash
2. **Certificate renewed**: Add new hash alongside old hash during transition
3. **Wrong certificate hash**: Verify hash generation process
4. **Development issues**: Use `disableCertificatePinning()` in development

### Debug Mode

In development, you can disable pinning temporarily:

```typescript
if (__DEV__) {
  await disableCertificatePinning('api.meqenet.et');
}
```

## Compliance

This implementation helps meet:
- **OWASP MASVS** requirements
- **PCI DSS** network security requirements
- **PSD2** secure communication requirements
- **NBE Ethiopia** financial security standards

## Maintenance Checklist

- [ ] Review certificate expiry dates monthly
- [ ] Test certificate rotation process quarterly
- [ ] Monitor pinning failure logs weekly
- [ ] Update certificate hashes after renewals
- [ ] Test backup certificate procedures annually
- [ ] Review and update security policies annually
