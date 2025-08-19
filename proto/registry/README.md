# Proto Registry

This directory contains the shared Protocol Buffer definitions for all Meqenet microservices.

## Structure

```
proto/
├── registry/           # Shared proto definitions
│   ├── auth/          # Authentication service contracts
│   ├── payments/      # Payment service contracts
│   ├── marketplace/   # Marketplace service contracts
│   ├── common/        # Shared types and utilities
│   └── generated/     # Generated client/server stubs
├── buf.yaml           # Buf configuration
├── buf.gen.yaml       # Code generation config
└── .gitignore
```

## Versioning Strategy

- Each service has its own versioned package (e.g., `auth.v1`, `payments.v1`)
- Breaking changes require a new major version
- Generated stubs are published to internal npm registry

## CI/CD Integration

The proto registry includes automated CI that:

1. Validates proto definitions using `buf lint`
2. Checks for breaking changes with `buf breaking`
3. Generates TypeScript client/server stubs
4. Publishes generated packages to internal registry

## Usage

### For Service Development

```bash
# Generate stubs for a specific service
pnpm proto:generate:auth

# Generate all stubs
pnpm proto:generate:all

# Lint proto files
pnpm proto:lint

# Check for breaking changes
pnpm proto:breaking
```

### In NestJS Services

```typescript
import { AuthServiceClient } from '@meqenet/proto-auth-v1';

// Use generated client
const client = new AuthServiceClient('localhost:5000');
```

## Security & Compliance

- All proto definitions must include proper field validation
- Sensitive data fields must be marked with security annotations
- NBE compliance metadata is included in Ethiopian-specific services
