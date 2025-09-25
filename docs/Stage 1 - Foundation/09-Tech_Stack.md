# 3. Technology Stack

## 1. Introduction & Core Principles

This document details the technologies, frameworks, and services selected for the Meqenet.et
ecosystem. It serves as a "paved road" guide, defining a recommended and supported set of tools to
ensure consistency, security, and velocity.

Our core principles for technology selection in a **Microservice Architecture** are:

- **Paved Road, Not a Mandate**: We provide a default, blessed stack that is supported by our CI/CD
  pipelines, security tooling, and infrastructure. This is the fastest path for most services.
- **Empowered Teams, Deliberate Choices**: Teams are empowered to deviate from the paved road if a
  different technology is demonstrably better for their specific microservice's needs. This requires
  a formal review.
- **Polyglot Philosophy**: We embrace using multiple programming languages and persistence layers
  where it makes sense. A service requiring high-performance computation might use Go, while an
  ML-heavy service would use Python.

## 2. Technology Governance

Teams may propose alternative technologies. The process is:

1.  **Proposal**: The team documents the proposed technology, the rationale for deviating from the
    paved road, and an analysis of its pros and cons (including security, cost, and operational
    overhead).
2.  **Architecture Review**: The proposal is reviewed by the architecture governance body.
3.  **Decision**: If approved, the technology is added to a list of "approved alternatives," and the
    team is responsible for integrating it with our standard tooling.

## 3. Recommended "Paved Road" Stack

### 3.1 Backend Services

- **Default Language & Framework**: **TypeScript** with **Node.js (LTS)** and the **NestJS**
  framework.
  - _Rationale_: Our primary choice for general-purpose microservices (e.g., REST APIs, business
    logic).
- **Approved Alternatives**:
  - **Go**: For high-performance, CPU-bound services.
  - **Python**: For data science, machine learning, and data engineering pipelines.
- **Communication**:
  - **gRPC & Protocol Buffers**: For high-performance synchronous internal communication.
  - **REST & OpenAPI 3.0**: For external APIs.
  - **Event Bus (e.g., AWS SNS/SQS)**: For asynchronous, event-driven communication.

### 3.2 Database & Storage (Polyglot Persistence)

The choice of database is specific to the needs of each microservice.

- **Default Relational Database**: **PostgreSQL (Managed, e.g., AWS RDS)**.
  - _Use Cases_: Services requiring ACID compliance (e.g., Payments, User Accounts).
  - _Recommended ORM_: **Prisma**.
- **Default Key-Value / Cache**: **Redis (Managed, e.g., AWS ElastiCache)**.
  - _Use Cases_: Session storage, caching, background job message broker.
- **Default Search Engine**: **OpenSearch / Elasticsearch (Managed)**.
  - _Use Cases_: Services requiring complex full-text search (e.g., Marketplace).
- **Object Storage**: **AWS S3** for user-generated content, documents, and backups.

### 3.3 Frontend Applications

- **Mobile App**: **React Native** with **TypeScript**.
  - _State Management_: Zustand or Redux Toolkit.
  - _Styling_: A Tailwind CSS-compatible library (e.g., `twrnc`).
- **Web Apps (Merchant & Admin Portals)**: **Next.js** with **TypeScript**.
  - _Styling_: Tailwind CSS.

### 3.4 DevOps & Infrastructure

- **Cloud Provider**: **Amazon Web Services (AWS)**.
- **Infrastructure as Code (IaC)**: **Terraform**.
- **Containerization**: **Docker**.
- **Container Orchestration**: **Amazon ECS** or **EKS (Kubernetes)**.
- **CI/CD**: **GitHub Actions**.
- **Observability**: **Prometheus** (metrics), **Grafana** (dashboards), **OpenTelemetry**
  (tracing), and a centralized logging solution (e.g., **OpenSearch**).
- **Secrets Management**: **AWS Secrets Manager**.

### 3.5 Development Tools & Code Quality

#### ESLint Configuration (Enterprise-Grade)
**Status (2025-01-25)**: Custom ESLint setup using official plugins only due to `eslint-config-next` compatibility issues with ESLint 9.x.

**Configuration Approach**:
- **Format**: ESLint 9.x flat config (`eslint.config.mjs`)
- **Plugins**: Official, audited ESLint plugins only
- **Security Focus**: PCI DSS and NBE compliance for BNPL applications
- **Architecture**: Separate configs for frontend, backend, and pre-commit hooks

**Frontend Configuration (Next.js/React)**:
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
  // Temporarily disabled: eslint-config-next (incompatible with ESLint 9.x)
  {
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'security': securityPlugin,
    },
    rules: {
      // Enhanced security for financial applications
      'security/detect-object-injection': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-possible-timing-attacks': 'error',
      // Additional fintech-specific rules...
    },
  },
];
```

**Backend Configuration (NestJS/Node.js)**:
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
      // Financial data integrity rules
      'security/detect-object-injection': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Enhanced security for payment processing...
    },
  },
];
```

#### ESLint Compatibility Issue
**Known Issue**: `eslint-config-next` depends on `@rushstack/eslint-patch@^1.10.3`, which is incompatible with ESLint 9.36.0+.

**Enterprise Benefits of Current Approach**:
- ✅ **Full Auditability**: All linting rules are traceable and documented
- ✅ **Zero Unknown Dependencies**: Only official, vetted packages
- ✅ **Enhanced Security**: Custom rules for PCI DSS and NBE compliance
- ✅ **Complete Control**: Full customization for financial application needs

#### Additional Development Tools
- **TypeScript Compiler**: Strict configuration for financial data integrity
- **Prettier**: Code formatting with financial code conventions
- **Husky**: Git hooks for pre-commit validation
- **Lint-staged**: Performance-optimized file-specific linting
- **Commitlint**: Conventional commit message enforcement

## 4. Review & Updates

This technology stack will be reviewed quarterly. Significant changes will be documented via
Architecture Decision Records (ADRs).
