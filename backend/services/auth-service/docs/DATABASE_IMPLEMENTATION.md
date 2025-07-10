# Database Implementation Guide

## Meqenet.et Authentication Service - Prisma ORM Integration

This guide provides comprehensive instructions for setting up, managing, and maintaining the
Prisma-based database implementation for the Meqenet.et Authentication Service.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.19.0 or higher
- PostgreSQL 13+ with SSL support
- Ethiopian timezone support (Africa/Addis_Ababa)

### Environment Setup

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Configure your database URL with SSL:

   ```bash
   DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
   ```

3. Generate Prisma client:

   ```bash
   npm run db:generate
   ```

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

---

## 📊 Database Schema Overview

### Core Models

- **User**: Customer authentication and profile data
- **UserSession**: Session management and tracking
- **PasswordReset**: Secure password reset functionality
- **AuditLog**: Comprehensive audit trail for NBE compliance

### Data Classification

- **PUBLIC**: Non-sensitive data (preferences)
- **INTERNAL**: Business data (roles, risk scores)
- **CONFIDENTIAL**: Personal data (email, phone)
- **RESTRICTED**: Financial data (Fayda National ID)

---

## 🔐 Security Features

### Encryption

- AES-256-GCM for sensitive data
- Argon2 for password hashing
- SSL/TLS for all connections

### Audit Logging

- All user actions logged
- 7-year retention for NBE compliance
- Risk scoring and fraud detection

### Ethiopian Compliance

- Fayda National ID encryption
- Multi-language support (English/Amharic)
- Local timezone handling

---

## 🛠️ Development Commands

```bash
# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema changes (dev)
npm run db:migrate    # Run migrations (prod)
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed test data
npm run db:reset      # Reset database

# Testing
npm run test:integration  # Run database integration tests
npm run test:cov         # Run with coverage
```

---

## 📋 Environment Variables

### Required Variables

```bash
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
JWT_SECRET=your-secure-jwt-secret-32-chars-minimum
FAYDA_ID_ENCRYPTION_KEY=your-fayda-encryption-key-64-chars
```

### Optional Variables

```bash
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_LOGGING_ENABLED=true
AUDIT_LOG_ENABLED=true
NBE_COMPLIANCE=true
```

---

## 🧪 Testing

### Integration Tests

```bash
# Run all database integration tests
npm run test:integration

# Run specific test suite
npm run test:integration -- --testNamePattern="Database Connection"
```

### Test Database Setup

1. Create test database:

   ```sql
   CREATE DATABASE meqenet_auth_test;
   ```

2. Set test environment:
   ```bash
   TEST_DATABASE_URL="postgresql://test_user:test_pass@localhost:5433/meqenet_auth_test?sslmode=require"
   ```

---

## 📈 Performance Optimization

### Connection Pooling

- Min connections: 2
- Max connections: 10 (optimized for Ethiopian infrastructure)
- Connection timeout: 30 seconds
- Idle timeout: 10 minutes

### Indexing Strategy

- Primary keys on all ID fields
- Composite indexes for common queries
- Partial indexes for filtered queries

---

## 🔍 Monitoring and Health Checks

### Health Check Endpoint

```typescript
const health = await prismaService.healthCheck();
console.log(health.status); // 'healthy' | 'unhealthy'
```

### Connection Statistics

```typescript
const stats = await prismaService.getConnectionStats();
console.log(`Active: ${stats.activeConnections}/${stats.maxConnections}`);
```

---

## 📚 NBE Compliance

### Audit Requirements

- All user actions logged with IP address
- 7-year retention for audit logs
- Risk scoring for fraud detection
- Real-time suspicious activity monitoring

### Data Protection

- Fayda National ID encryption
- Secure data deletion (soft delete)
- Cross-border data transfer restrictions
- Consent management

---

## 🚨 Troubleshooting

### Common Issues

#### Connection Timeouts

```bash
# Increase connection timeout for Ethiopian networks
DB_CONNECTION_TIMEOUT=30000
```

#### SSL Certificate Issues

```bash
# For development, you might need to disable SSL verification
NODE_TLS_REJECT_UNAUTHORIZED=0
```

#### Migration Failures

```bash
# Reset database and re-run migrations
npm run db:reset
npm run db:migrate
```

### Performance Issues

1. Check connection pool settings
2. Verify database indexes
3. Monitor slow query logs
4. Review Ethiopian network latency

---

## 📞 Support

For technical issues or questions:

- **Development Team**: [dev@meqenet.et]
- **Database Admin**: [dba@meqenet.et]
- **Security Team**: [security@meqenet.et]

---

## 📝 Change Log

### v1.0.0 - Initial Implementation

- Prisma ORM integration
- User authentication schema
- Audit logging system
- NBE compliance features
- Ethiopian localization support

---

_Last updated: 2024_  
_Document maintained by: Meqenet Development Team_
