# Meqenet Coding Standards & Best Practices

## 📋 Overview

This document outlines the coding standards and best practices established for the Meqenet BNPL platform. These standards ensure code quality, maintainability, security, and consistency across the entire codebase.

## 🎯 Core Principles

### 1. **Zero Magic Numbers**
All numeric literals must be replaced with named constants for better readability and maintainability.

### 2. **Type Safety First**
- Use TypeScript strict mode
- Avoid `any` types except in test mocks
- Prefer `Record<string, unknown>` over `Record<string, any>`

### 3. **Security by Design**
- Validate all external inputs
- Use proper object property access validation
- Implement secure coding practices

### 4. **Test-Driven Development**
- Write tests for all business logic
- Use proper mocking in test files
- Maintain test coverage standards

---

## 📊 Constants & Magic Numbers

### Time Constants
```typescript
// Base time units
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MILLISECONDS_PER_SECOND = 1000;

// Derived time constants
const MILLISECONDS_PER_MINUTE = SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
const MILLISECONDS_PER_HOUR = MINUTES_PER_HOUR * MILLISECONDS_PER_MINUTE;
const MILLISECONDS_PER_DAY = HOURS_PER_DAY * MILLISECONDS_PER_HOUR;

// Common time intervals
const ONE_MINUTE_MS = 1 * MILLISECONDS_PER_MINUTE;
const FIVE_MINUTES_MS = 5 * MILLISECONDS_PER_MINUTE;
const FIFTEEN_MINUTES_MS = 15 * MILLISECONDS_PER_MINUTE;
const THIRTY_MINUTES_MS = 30 * MILLISECONDS_PER_MINUTE;
const ONE_HOUR_MS = 1 * MILLISECONDS_PER_HOUR;
```

### Argon2 Constants
```typescript
// Argon2 memory exponent for 64MB
const ARGON2_MEMORY_EXPONENT = 16; // 2^16 = 65536 KB = 64 MB
const ARGON2_BASE = 2;
const ARGON2_TIME_COST = 3; // 3 iterations
const ARGON2_PARALLELISM = 1; // Single thread for server

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: ARGON2_BASE ** ARGON2_MEMORY_EXPONENT,
  timeCost: ARGON2_TIME_COST,
  parallelism: ARGON2_PARALLELISM,
};
```

### Rate Limiting Constants
```typescript
// Time multipliers for calculations
const ONE_MINUTE_MULTIPLIER = 1;
const FIVE_MINUTES_MULTIPLIER = 5;
const FIFTEEN_MINUTES_MULTIPLIER = 15;
const THIRTY_MINUTES_MULTIPLIER = 30;
const ONE_HOUR_MULTIPLIER = 1;

// Request limits by role
const ADMIN_MAX_REQUESTS_PER_MINUTE = 60;
const SUPPORT_MAX_REQUESTS_PER_MINUTE = 30;
const MERCHANT_MAX_REQUESTS_PER_MINUTE = 20;
const CUSTOMER_MAX_REQUESTS_PER_MINUTE = 10;

// Block duration constants
const MERCHANT_GLOBAL_BLOCK_DURATION_HOURS = 4;
const CUSTOMER_GLOBAL_BLOCK_DURATION_HOURS = 6;

// Financial operation limits
const HIGH_VALUE_TRANSACTION_THRESHOLD = 10000;
const MEDIUM_VALUE_TRANSACTION_THRESHOLD = 1000;
const HIGH_VALUE_TRANSACTION_LIMIT_MULTIPLIER = 0.5;
const MEDIUM_VALUE_TRANSACTION_LIMIT_MULTIPLIER = 0.7;
```

### JSON & Formatting Constants
```typescript
const JSON_FORMAT_INDENTATION = 2;
const BYTES_FORMAT_DECIMAL_PLACES = 2;
const KILOBYTE_SIZE = 1024;

// Hash function constants
const HASH_SHIFT_BITS = 5;
const HASH_BASE = 36;
```

### Risk Assessment Constants
```typescript
const RISK_SCORE_LOW = 25;
const RISK_SCORE_MEDIUM = 50;
const RISK_SCORE_HIGH = 75;
const RISK_SCORE_PER_FAILED_ATTEMPT = 10;
const MAX_RISK_SCORE = 100;
```

---

## 🔒 Security Standards

### Object Property Access
```typescript
// ❌ Avoid: Direct property access on dynamic keys
const config = CERTIFICATE_PINNING_CONFIG[hostname];

// ✅ Use: Proper validation before access
if (!Object.prototype.hasOwnProperty.call(CERTIFICATE_PINNING_CONFIG, hostname)) {
  throw new Error(`Hostname ${hostname} not found in certificate pinning config`);
}
// Safe: hostname validated with Object.prototype.hasOwnProperty above
const config = CERTIFICATE_PINNING_CONFIG[hostname];
```

### Input Validation
```typescript
// ✅ Validate all external inputs
export function isCertificatePinningActive(hostname: string): boolean {
  if (!Object.prototype.hasOwnProperty.call(CERTIFICATE_PINNING_CONFIG, hostname)) {
    return false;
  }
  return CERTIFICATE_PINNING_CONFIG[hostname].enforcePinning ?? false;
}
```

### Unused Variables
```typescript
// ✅ Prefix unused variables with underscore
const { execSync: _execSync } = require('child_process'); // Reserved for future command execution
const fs = require('fs');
const _path = require('path'); // Reserved for future path operations
```

---

## 📝 Error Handling Patterns

### Try-Catch Blocks
```typescript
// ✅ Prefer simple error re-throwing when no additional handling needed
async function createContract(request: CreateContractRequest) {
  const response = await bnplApiClient.post('/bnpl/contracts', request);
  return response.data;
}

// ❌ Avoid unnecessary try-catch for simple re-throwing
async function createContract(request: CreateContractRequest) {
  try {
    const response = await bnplApiClient.post('/bnpl/contracts', request);
    return response.data;
  } catch (error) {
    // Error handled by caller
    throw error;
  }
}
```

### Error Variable Usage
```typescript
// ✅ Remove unused error variables in catch blocks
} catch {
  // If anything goes wrong, deny access
  return false;
}

// ❌ Avoid unused error variables
} catch (error) {
  // If anything goes wrong, deny access
  return false;
}
```

---

## 🧪 Testing Standards

### Test File Patterns
```typescript
// ✅ Use proper typing in production code
interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'merchant';
}

// ✅ Use 'any' only in test mocks (acceptable)
const mockUser: any = {
  id: '123',
  email: 'test@example.com',
  role: 'user',
};
```

### Mock Conventions
```typescript
// ✅ Prefix mock variables clearly
const argon2HashMock = vi.mocked(argon2.hash);
const prismaMock = vi.mocked(prisma.user);
```

---

## 📦 Import/Export Patterns

### ES6 Modules (TypeScript)
```typescript
// ✅ Use named imports
import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ✅ Group imports by type
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditLoggingService } from './audit-logging.service';

// ✅ Use default exports for services
export class AuthService {
  // implementation
}
export default AuthService;
```

### CommonJS (JavaScript utilities)
```typescript
// ✅ Use destructuring for selective imports
const { execSync: _execSync, spawn: _spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
```

---

## 🎨 Code Formatting Standards

### Function Signatures
```typescript
// ✅ Use explicit return types
export function isCertificatePinningActive(hostname: string): boolean {
  // implementation
}

// ✅ Use proper generic constraints
private getRoleBasedRateLimitConfig(userRole: string): Record<string, unknown> {
  // implementation
}
```

### Object Literals
```typescript
// ✅ Use consistent formatting
const financialConfig = {
  windowMs: FINANCIAL_OPERATION_WINDOW_MINUTES * MILLISECONDS_PER_MINUTE,
  maxRequests: this.getFinancialOperationLimit(userRole, amount),
  blockDurationMs: FINANCIAL_OPERATION_BLOCK_HOURS * MILLISECONDS_PER_HOUR,
};
```

### Array Methods
```typescript
// ✅ Use descriptive variable names
const activeKeys = keyMetadata.filter(key => key.isActive);
const expiredKeys = activeKeys.filter(key =>
  (now.getTime() - key.createdAt.getTime()) / MILLISECONDS_PER_DAY >= rotationIntervalDays
);
```

---

## 🔧 Configuration Standards

### Environment Variables
```typescript
// ✅ Use descriptive default values
const BACKUP_SCHEDULE_DEFAULT = '0 2 * * *'; // Daily at 2 AM
const BACKUP_RETENTION_DEFAULT_DAYS = 30;

// ✅ Parse with proper fallbacks
const rotationIntervalDays = parseInt(
  this.configService.get('KEY_ROTATION_INTERVAL_DAYS', '90')
);
```

### Feature Flags
```typescript
// ✅ Use clear boolean checks
const isCompressionEnabled = this.configService.get('BACKUP_COMPRESSION_ENABLED', 'true') === 'true';
const isEncryptionEnabled = this.configService.get('BACKUP_ENCRYPTION_ENABLED', 'true') === 'true';
```

---

## 📊 Performance Standards

### Memory Management
```typescript
// ✅ Use efficient data structures
const activeKeysMap = new Map<string, KeyMetadata>();
const expiredKeys = activeKeys.filter(key => {
  const daysSinceCreation = (now.getTime() - key.createdAt.getTime()) / MILLISECONDS_PER_DAY;
  return daysSinceCreation >= this.config.rotationIntervalDays;
});
```

### Algorithm Optimization
```typescript
// ✅ Use appropriate data types
const fileSize = fs.statSync(filePath).size; // Returns number
const formattedSize = this.formatBytes(fileSize); // Proper formatting

// ✅ Cache expensive operations
private formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = KILOBYTE_SIZE;
  // Implementation
}
```

---

## 🔍 Validation Rules

### ESLint Configuration

#### Enterprise-Grade ESLint Setup

**Current Status (2025-01-25)**: Due to ESLint 9.x compatibility issues with `eslint-config-next`, the project uses a custom, enterprise-grade ESLint configuration that prioritizes security, auditability, and compliance for the Ethiopian fintech BNPL application.

**Why This Approach**: Official `eslint-config-next` still depends on `@rushstack/eslint-patch@^1.10.3`, which is incompatible with ESLint 9.x. Community configs lack enterprise-grade security guarantees and auditability required for financial applications.

**Configuration Strategy**:
- ✅ Uses only official, well-maintained ESLint plugins
- ✅ Prioritizes financial security and PCI DSS compliance
- ✅ Enables full auditability and customization
- ✅ Avoids unknown dependencies from community packages

#### Frontend ESLint Configuration (Next.js/React)
```javascript
// frontend/apps/website/eslint.config.mjs
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import securityPlugin from 'eslint-plugin-security';

export default [
  js.configs.recommended,
  // Temporarily disabled due to ESLint 9.x compatibility:
  // eslint-config-next (depends on incompatible @rushstack/eslint-patch)
  {
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'security': securityPlugin,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // Allow with review
      '@typescript-eslint/no-non-null-assertion': 'off',

      // React rules
      'react/react-in-jsx-scope': 'off', // React 17+ JSX transform
      'react/prop-types': 'off', // TypeScript handles this
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Accessibility rules
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',

      // Security rules (critical for BNPL fintech)
      'security/detect-object-injection': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-child-process': 'error',
      'security/detect-unsafe-regex': 'error',

      // General code quality
      'no-console': 'warn', // Allow in development
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];
```

#### Backend ESLint Configuration (NestJS/Node.js)
```javascript
// backend/eslint.config.mjs
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import securityPlugin from 'eslint-plugin-security';

export default [
  js.configs.recommended,
  {
    plugins: {
      '@typescript-eslint': tsPlugin,
      'security': securityPlugin,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Security rules (enhanced for financial services)
      'security/detect-object-injection': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-child-process': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-possible-timing-attacks': 'error',

      // General rules
      'no-magic-numbers': 'error',
      'prefer-const': 'error',
    },
  },
];
```

#### Pre-commit ESLint Configuration
```javascript
// eslint.config.staged.js - Optimized for pre-commit hooks
import security from 'eslint-plugin-security';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
// Additional plugins for comprehensive staged linting

export default [
  // Performance-optimized configuration for pre-commit
  security.configs.recommended,
  {
    rules: {
      // Critical security rules for BNPL application
      'security/detect-object-injection': 'error',
      'security/detect-eval-with-expression': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      // ... additional fintech-specific rules
    },
  },
];
```

### ESLint Compatibility Notes

#### Known Issue: eslint-config-next & ESLint 9.x
- **Issue**: Official `eslint-config-next` depends on `@rushstack/eslint-patch@^1.10.3`
- **Problem**: `@rushstack/eslint-patch@1.12.0` doesn't support ESLint 9.36.0+
- **Impact**: Prevents using official Next.js ESLint configuration
- **Status**: Vercel team is aware but no timeline for resolution
- **Workaround**: Custom configuration using official plugins directly

#### Enterprise Security Requirements
- **PCI DSS Compliance**: All ESLint rules must support payment processing security
- **NBE Compliance**: Ethiopian banking regulations for financial applications
- **Auditability**: All linting rules must be traceable and documented
- **Zero Unknown Dependencies**: Only official, vetted packages allowed

### Recommended ESLint Rules for Fintech Applications
```json
{
  "rules": {
    // Security (Critical for BNPL)
    "security/detect-object-injection": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-child-process": "error",
    "security/detect-unsafe-regex": "error",
    "security/detect-possible-timing-attacks": "error",

    // TypeScript (Financial Data Integrity)
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",

    // Code Quality (Maintainability)
    "no-magic-numbers": "error",
    "prefer-const": "error",
    "no-var": "error",
    "no-console": "warn"
  }
}
```

### Commit Message Format
```bash
# Required format: type(scope): description (TICKET-123)
feat(auth): add JWT token rotation (MEQ-123)
fix(api): resolve memory leak in rate limiter (MEQ-456)
docs(standards): add coding standards documentation (MEQ-789)
```

---

## 🎯 Implementation Checklist

### ✅ Code Quality
- [x] No magic numbers (replaced with named constants)
- [x] Proper TypeScript typing
- [x] Security best practices
- [x] Error handling patterns
- [x] Clean import/export structure

### ✅ Testing
- [x] Test coverage maintained
- [x] Proper mocking conventions
- [x] Test file organization

### ✅ Documentation
- [x] Inline code comments
- [x] Function documentation
- [x] Security considerations
- [x] Performance notes

### ✅ CI/CD
- [x] ESLint passing (0 errors)
- [x] TypeScript compilation
- [x] Test execution
- [x] Security scanning

---

## 📈 Benefits Achieved

### **Developer Experience**
- **Consistent Code**: Uniform patterns across the codebase
- **Better Readability**: Named constants replace magic numbers
- **Easier Maintenance**: Clear structure and documentation
- **Reduced Bugs**: Type safety and validation

### **Code Quality**
- **Zero Lint Errors**: Clean, professional codebase
- **Security First**: Input validation and secure practices
- **Performance**: Optimized algorithms and data structures
- **Scalability**: Modular, maintainable architecture

### **Team Productivity**
- **Faster Onboarding**: Clear standards and documentation
- **Consistent Reviews**: Established patterns reduce review time
- **Fewer Bugs**: Proactive error prevention
- **Better Collaboration**: Shared understanding of best practices

---

## 🔄 Continuous Improvement

### **Regular Reviews**
- Monthly code quality audits
- Update standards based on new learnings
- Incorporate team feedback
- Track compliance metrics

### **Tool Updates**
- Keep ESLint rules current
- Update TypeScript configurations
- Monitor security scanning tools
- Evaluate new code quality tools

### **Training**
- Onboarding documentation for new developers
- Regular code quality workshops
- Best practices sharing sessions
- Tool usage training

---

*This document represents the coding standards established during the comprehensive lint error cleanup of the Meqenet BNPL platform. These standards ensure production-ready code quality and maintainability.*
