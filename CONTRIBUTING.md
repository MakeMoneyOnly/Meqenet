# Contributing to Meqenet.et

Welcome to the Meqenet.et development team! This guide outlines our development process,
architectural principles, and coding standards for Ethiopia's leading BNPL financial super-app. All
team members, contractors, and consultants must follow these guidelines.

## 🚀 Quick Start

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** (LTS version)
- **Docker** and **Docker Compose**
- **Git** with proper configuration
- **AWS CLI** configured (for infrastructure work)
- **Understanding** of TypeScript, React Native, and NestJS

### Setting Up Your Development Environment

1. **Clone Repository**

   ```bash
   git clone https://github.com/meqenet/meqenet.git
   cd meqenet
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

4. **Start Development Stack**
   ```bash
   docker-compose up -d
   pnpm run dev
   ```

## 🏗️ Architecture Guidelines

### Microservice Architecture Principles

Meqenet.et follows a **Microservice Architecture** with strict governance principles:

- **Single Responsibility**: Each service handles one business capability
- **Bounded Context**: Services are designed around specific business domains
- **Explicit APIs**: All communication through well-defined, versioned APIs
- **Database Per Service**: No shared databases between services
- **Independent Deployability**: Services can be deployed independently

### Feature-Sliced Architecture (FSA)

All code MUST follow **Feature-Sliced Architecture** patterns:

```
src/
├── app/           # Application initialization, providers, router
├── pages/         # Route components, page layouts
├── widgets/       # Composite UI components
├── features/      # Business features (auth, bnpl, marketplace, rewards)
├── entities/      # Business entities and their logic
└── shared/        # Reusable utilities, UI kit, API clients
```

#### FSA Rules (MANDATORY)

- **Dependency Direction**: `app` → `pages` → `widgets` → `features` → `entities` → `shared`
- **Feature Isolation**: Features can only import from `shared`, `entities`, or their own modules
- **Public API**: Each feature must expose a clean API via `index.ts`
- **No Cross-Feature Imports**: Features cannot directly import from other features

#### Core Features

- `auth` - Authentication and identity management (Fayda integration)
- `bnpl` - Buy Now, Pay Later payment logic
- `marketplace` - Product catalog and merchant management
- `rewards` - Cashback and loyalty system
- `analytics` - Business intelligence and reporting
- `kyc` - Know Your Customer verification
- `payments` - Payment processing and gateway integration
- `credit` - Credit scoring and risk assessment
- `premium` - Meqenet Plus subscription features

### Backend Code Structure (DDD-Lite)

All backend microservices **MUST** adopt a simplified Domain-Driven Design (DDD-lite) structure. This organizes code by its technical and business purpose, improving maintainability and separation of concerns.

- **`domain`**: Contains the core business logic, entities, and services. This layer is pure and has no knowledge of the infrastructure.
- **`application`**: Orchestrates use cases by interacting with the domain layer.
- **`infrastructure`**: Contains adapters for external systems like databases (Prisma), message queues, and third-party APIs.
- **`presentation`**: The entry point to the service, containing controllers (for REST/gRPC) and DTOs. This is the only layer that interacts with the network.

## 🔒 Security Requirements

### Zero Trust Security Model

All contributions MUST adhere to our **Zero Trust Security** framework:

#### Input Validation & Sanitization

- **Validate ALL inputs** using Zod/Joi schemas
- **Sanitize** user-provided data before processing
- **Encode outputs** to prevent XSS attacks

#### Authentication & Authorization

- **Multi-Factor Authentication** for all sensitive operations
- **Role-Based Access Control (RBAC)** implementation
- **Secure session management** with JWT tokens

#### Data Protection

- **Encrypt sensitive data** at rest (AES-256-GCM) and in transit (TLS 1.3)
- **Fayda National ID data** requires highest security classification
- **No secrets in code** - use AWS Secrets Manager

#### Microservice Communication

- **Mutual TLS (mTLS)** mandatory for service-to-service communication
- **Network policies** with default-deny approach
- **Service mesh** for advanced traffic management

## 💻 Development Standards

### Code Quality

#### TypeScript Standards

```typescript
// ✅ Good: Strict typing with interfaces
interface PaymentRequest {
  amount: number;
  currency: 'ETB';
  paymentMethod: PaymentMethod;
  merchantId: string;
}

// ❌ Bad: Any types or loose typing
function processPayment(data: any): any {
  // Implementation
}
```

#### Feature-Sliced Organization

```typescript
// ✅ Good: Clean feature public API
// features/bnpl/index.ts
export { BNPLProvider } from './providers';
export { useBNPLCalculation } from './hooks';
export type { PaymentPlan, InstallmentSchedule } from './types';

// ✅ Good: Proper imports
// features/marketplace/components/ProductCard.tsx
import { Button } from 'shared/ui';
import { Product } from 'entities/product';
import { useBNPLCalculation } from 'features/bnpl';

// ❌ Bad: Cross-feature imports
import { RewardsCalculator } from 'features/rewards/utils'; // ❌ Not allowed
```

### API Design Standards

#### OpenAPI 3.0 Specification

All external APIs MUST be defined using OpenAPI 3.0:

```yaml
# openapi.yaml (mandatory for each service)
openapi: 3.0.0
info:
  title: Payment Service API
  version: v1
  description: BNPL payment processing service

paths:
  /v1/payments:
    post:
      summary: Process BNPL payment
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PaymentRequest'
```

#### gRPC for Internal Communication

```protobuf
// payment.proto
syntax = "proto3";

package meqenet.payment.v1;

service PaymentService {
  rpc ProcessPayment(PaymentRequest) returns (PaymentResponse);
  rpc GetPaymentStatus(PaymentStatusRequest) returns (PaymentStatusResponse);
}

message PaymentRequest {
  string user_id = 1;
  int64 amount_cents = 2;
  string merchant_id = 3;
  PaymentMethod payment_method = 4;
}
```

### Testing Requirements

#### Test Pyramid

- **Unit Tests**: 70% coverage minimum
- **Integration Tests**: Critical API endpoints
- **End-to-End Tests**: User journeys

#### Security Testing

```typescript
// Security test example
describe('Payment API Security', () => {
  it('should reject requests without authentication', async () => {
    const response = await request(app).post('/v1/payments').send(validPaymentData);

    expect(response.status).toBe(401);
  });

  it('should validate input data', async () => {
    const response = await request(app)
      .post('/v1/payments')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ amount: -100 }); // Invalid negative amount

    expect(response.status).toBe(400);
  });
});
```

## 🌍 Ethiopian Compliance

### Fayda National ID Integration

```typescript
// ✅ Good: Exclusive Fayda ID verification
interface KYCVerification {
  faydaIdNumber: string;
  biometricData: EncryptedBiometric;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

// ❌ Bad: Supporting other ID types
interface KYCVerification {
  idType: 'fayda' | 'passport' | 'other'; // ❌ Not allowed
}
```

### NBE Compliance

- **Regulatory reporting** functionality must be included
- **Audit trails** for all financial transactions
- **Data residency** requirements for Ethiopian citizen data

### Localization Requirements

- **Amharic language** support in all user-facing features
- **Ethiopian calendar** integration
- **Cultural adaptation** in UI/UX design

## 📝 Contribution Process

### 1. Planning & Design

#### Feature Proposals

Use our Feature Proposal template for new features:

```markdown
## Feature: [Feature Name]

### Business Value

- Problem statement
- Target users
- Success metrics

### Technical Design

- Architecture impact
- API changes
- Database changes
- Security considerations

### Implementation Plan

- Development stages
- Testing strategy
- Deployment plan
```

#### Architecture Decision Records (ADRs)

Document significant architectural decisions:

```markdown
# ADR-001: Payment Gateway Selection

## Status

Accepted

## Context

Need to select primary payment gateway for Ethiopian market

## Decision

Use Telebirr as primary gateway with HelloCash and CBE Birr as alternatives

## Consequences

- Positive: Market leader, government backing
- Negative: Single point of failure risk
```

### 2. Development Workflow

#### Git Workflow

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/bnpl-payment-plans

# 2. Make changes following FSA principles
# 3. Run linting and tests
   pnpm run lint
   pnpm run test
   pnpm run type-check

# 4. Commit with conventional format
git commit -m "feat(bnpl): add 4-installment payment plan calculation"

# 5. Push and create PR for internal review
git push origin feature/bnpl-payment-plans
```

#### Pull Request Requirements

- **Descriptive title** using conventional commits
- **Detailed description** of changes
- **Security review** for sensitive changes
- **Performance impact** assessment
- **Testing coverage** report

### 5. Commit Message and Signing Rules

#### Conventional Commits

This project follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
specification. All commit messages **MUST** adhere to this format. This ensures a meaningful and
machine-readable commit history, which enables automated changelog generation and semantic
versioning.

- **Format**: `<type>(<scope>): <subject>`
- **Allowed `type` values**: `feat`, `fix`, `build`, `chore`, `ci`, `docs`, `perf`, `refactor`,
  `revert`, `style`, `test`.
- **Example**: `feat(auth): add password reset flow`

#### Commit Signing

To ensure the integrity and provenance of our codebase, all commits made to the `main` and `develop`
branches **MUST** be cryptographically signed with a developer's GPG key. This is a non-negotiable
security requirement.

### 3. Code Review Process

#### Review Checklist

- [ ] Follows Feature-Sliced Architecture principles
- [ ] Security requirements met (input validation, authentication)
- [ ] Ethiopian compliance considerations addressed
- [ ] API design follows OpenAPI 3.0 standards
- [ ] Tests provide adequate coverage
- [ ] Documentation updated
- [ ] Performance impact assessed

#### Security Review (Required for sensitive changes)

- [ ] Input validation and sanitization
- [ ] Authentication and authorization checks
- [ ] Data encryption requirements
- [ ] Audit logging implementation
- [ ] Compliance with NBE regulations

### 4. Deployment

#### Staging Deployment

- Automatic deployment to staging on PR merge to `develop`
- Comprehensive testing in staging environment
- Security scanning and compliance validation

#### Production Deployment

- Manual approval required for production deployment
- Blue-green deployment strategy
- Rollback plan documented and tested

## 🛠️ Tools & Technologies

### Required Tools

- **ESLint**: Code linting with security rules
- **Prettier**: Code formatting
- **Jest**: Unit testing framework
- **Cypress**: End-to-end testing
- **Docker**: Containerization
- **Terraform**: Infrastructure as Code

### Recommended IDEs

- **VS Code** with recommended extensions
- **Cursor** (AI-powered development)

### Extensions & Plugins

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-typescript.typescript",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-eslint",
    "prisma.prisma"
  ]
}
```

## 📋 Issue Templates

### Bug Report

```markdown
## Bug Description

Clear description of the bug

## Steps to Reproduce

1. Step one
2. Step two
3. Step three

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- Platform: [Web/Mobile/Both]
- Browser/Device: [Details]
- Version: [App version]

## Security Impact

- [ ] This bug affects security
- [ ] This bug affects financial data
- [ ] This bug affects user privacy
```

### Security Issue

```markdown
## Security Issue Report

⚠️ **CONFIDENTIAL** - Do not discuss in public

## Vulnerability Type

- [ ] Authentication bypass
- [ ] Data exposure
- [ ] Input validation
- [ ] Authorization flaw
- [ ] Other: \***\*\_\_\_\*\***

## Impact Assessment

- Severity: [Critical/High/Medium/Low]
- Affected components: [List]
- Potential data exposure: [Description]

## Steps to Reproduce

[Detailed steps - keep confidential]

## Suggested Fix

[If known]
```

## 🎯 Performance Standards

### Frontend Performance

- **First Contentful Paint**: < 2 seconds
- **Largest Contentful Paint**: < 3 seconds
- **Bundle size**: Monitor and optimize
- **Memory usage**: Profile and optimize

### Backend Performance

- **API response time**: < 500ms for 95th percentile
- **Database query time**: < 100ms average
- **Service availability**: 99.9% uptime target

### Mobile Performance

- **App startup time**: < 3 seconds
- **Screen transition**: < 300ms
- **Battery optimization**: Minimal drain
- **Offline capability**: Core features work offline

## 🚨 Security Incident Response

### Reporting Security Issues

1. **DO NOT** create public issues for security vulnerabilities
2. Email: security@meqenet.et immediately
3. Include detailed reproduction steps
4. Follow internal security incident response protocol
5. Maintain confidentiality until issue is resolved

### Emergency Response

For critical security issues:

1. Immediate escalation to security team and management
2. Emergency patch deployment through designated channels
3. Internal incident communication following established protocols
4. Post-incident review and documentation for compliance
5. NBE notification if required by regulations

## 📚 Documentation Requirements

### Code Documentation

```typescript
/**
 * Calculates BNPL installment schedule for Ethiopian customers
 *
 * @param amount - Purchase amount in Ethiopian Birr (ETB)
 * @param plan - Payment plan type (4-installments, 30-days, financing)
 * @param customerProfile - Customer credit profile from Fayda verification
 * @returns Promise<InstallmentSchedule> - Complete payment schedule
 *
 * @security
 * - Validates amount within NBE-approved limits
 * - Encrypts sensitive customer data
 * - Logs all calculations for audit purposes
 *
 * @compliance
 * - Follows NBE directive on consumer lending
 * - Implements transparent fee disclosure
 */
async function calculateInstallmentSchedule(
  amount: number,
  plan: PaymentPlan,
  customerProfile: CustomerProfile
): Promise<InstallmentSchedule> {
  // Implementation
}
```

### API Documentation

- OpenAPI 3.0 specifications for all endpoints
- Code examples in multiple languages
- Authentication and authorization details
- Error handling documentation

### Architecture Documentation

- Mermaid.js diagrams for all architectural decisions
- Service interaction documentation
- Data flow diagrams
- Security architecture documentation

## 🤝 Team Guidelines

### Professional Standards

- **Respectful communication** in all team interactions
- **Inclusive environment** for all team members
- **Professional behavior** in code reviews and discussions
- **Ethiopian cultural sensitivity** in all communications
- **Confidentiality** regarding proprietary financial algorithms and business logic

### Communication Channels

- **Internal Issues**: Bug reports and feature requests via project management tools
- **Pull Requests**: Code review and technical discussions
- **Internal Email**: Security issues and sensitive matters
- **Slack/Teams**: Daily communication and quick questions

## 📞 Getting Help

### Internal Support

- **Architecture questions**: Contact the Architecture Team or architecture@meqenet.et
- **Security concerns**: Contact the Security Team or security@meqenet.et
- **Development issues**: Create internal ticket or contact team leads
- **DevOps support**: Contact the DevOps Team for infrastructure issues

### Documentation

- **Architecture**: [docs/Stage 1 - Foundation/](docs/Stage%201%20-%20Foundation/)
- **Security**:
  [docs/Stage 1 - Foundation/07-Security.md](docs/Stage%201%20-%20Foundation/07-Security.md)
- **Tech Stack**:
  [docs/Stage 1 - Foundation/09-Tech_Stack.md](docs/Stage%201%20-%20Foundation/09-Tech_Stack.md)

## 📈 Team Contributions & Recognition

### Types of Work

- **Feature Development**: New functionality, enhancements, and improvements
- **Bug Fixes**: Issue resolution and system stability improvements
- **Documentation**: Technical writing, API documentation, and internal guides
- **Security**: Vulnerability assessment, security improvements, and compliance
- **Testing**: Test coverage improvements, automation, and quality assurance
- **Localization**: Amharic translations and Ethiopian cultural adaptations
- **DevOps**: Infrastructure improvements, deployment optimization, and monitoring

### Performance Recognition

- **Code quality metrics** tracked and reviewed in performance evaluations
- **Security contributions** recognized in team reviews
- **Innovation and improvement suggestions** encouraged and rewarded
- **Mentoring and knowledge sharing** valued and acknowledged

---

Thank you for being part of the Meqenet.et development team! Together, we're building Ethiopia's
financial future. 🇪🇹

For questions about this guide, contact your team lead or: development-team@meqenet.et
