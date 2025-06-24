# Deployment Strategy & Infrastructure Setup (Meqenet BNPL Platform)

## Overview

This document describes the deployment process and infrastructure configuration for the Meqenet
comprehensive BNPL financial ecosystem, designed for modern FinTech operations. It focuses on AWS as
the primary cloud provider and implements modern DevOps practices for **reliable, scalable, secure,
and accelerated deployments** of each microservice, adhering to enterprise FinTech standards, **NBE
guidelines**, and our **Microservice Architecture**.

The deployment strategy covers all ecosystem components, which are deployed as independent services:

- **Core Services**: Payments, Authentication, Users, KYC
- **Business Services**: Marketplace, Rewards, Premium Features
- **Supporting Services**: Virtual Cards, QR Payments, Analytics & AI

> **Related Documentation:**
>
> - [Infrastructure](./24-Infrastructure.md): Detailed infrastructure components and architecture
> - [Monitoring and Logging](./25-Monitoring_And_Logging.md): Observability setup and NBE compliance
> - [Security](../Stage%201%20-%20Foundation/07-Security.md): Security requirements and NBE
>   compliance
> - [Business Model](../Stage%201%20-%20Foundation/03-Business_Model.md): Comprehensive business
>   model with all payment options
> - [Architecture](../Stage%201%20-%20Foundation/08-Architecture.md): Microservice Architecture
>   implementation
> - `.cursorrules`: Core security and quality coding standards for the project

## 1. Deployment Environments

| Environment | Purpose                                     | Access Level                            | Infrastructure                                                                                 | Data Location       | NBE Compliance Focus                       | Automated Deployments                 | Ecosystem Features               |
| ----------- | ------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------ | ------------------------------------- | -------------------------------- |
| Development | Local development, feature work             | Developers only                         | Local or dev AWS account                                                                       | N/A                 | N/A                                        | Manual or on push to feature branches | All features enabled for testing |
| Staging     | Testing, QA, UAT, NBE compliance validation | Internal team, potentially NBE auditors | Staging AWS account (potentially in region supporting Ethiopia if data localization needed)    | Staging/Test Data   | Simulates Prod controls                    | On merge to `develop` branch          | Full ecosystem simulation        |
| Production  | Live service for Ethiopian customers        | End users                               | Production AWS account (potentially in region supporting Ethiopia if data localization needed) | Ethiopian User Data | Full NBE, Proc. 1176/2020, Data Protection | On merge to `main` with approval      | Complete ecosystem live          |

**Note:** The choice of AWS region for Staging/Production must consider NBE data localization
requirements, if any. Our Microservice Architecture ensures services can be deployed and scaled
independently.

## 2. CI/CD Pipeline (GitHub Actions) - Microservice Architecture

### Pipeline Overview

Each microservice has its own CI/CD pipeline, triggered by changes within its specific directory in
the monorepo.

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│  Source   │───►│   Build   │───►│   Test    │───►│ Security  │───►│  Deploy   │
│ (Service) │   │ (Service) │   │ (Service) │   │  Scans    │   │ (Service) │
└───────────┘   └───────────┘   └───────────┘   └───────────┘   └───────────┘
```

### Workflow Configuration (`.github/workflows/service-ci-cd.yml`)

```yaml
name: Microservice CI/CD Pipeline

on:
  push:
    branches: [main, develop]
    paths:
      - 'services/**' # Trigger on changes within any service directory
  pull_request:
    paths:
      - 'services/**'

env:
  ECR_REPOSITORY_PREFIX: meqenet-et
  AWS_REGION: ${{ secrets.AWS_REGION }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        # This will run a job for each service that has changed
        service: ${{ fromJson(needs.detect-changes.outputs.services) }}
    steps:
      # ... (Lint, Test, Security Scan steps for the specific service)

      - name: Build and push Docker image
        id: build-image
        # ... (Build and push logic for matrix.service)
        run: |
          docker build -t ${{ env.ECR_REPOSITORY_PREFIX }}/${{ matrix.service }}:${{ github.sha }} ./services/${{ matrix.service }}
          # ... push command

      - name: Deploy to Staging or Production
        # ... (Deployment logic using kubectl or Helm for the specific service)
```

## 3. Containerization Strategy - Microservices

### Example Service Dockerfile (`services/payments-service/Dockerfile`)

```dockerfile
# Multi-stage build for a single microservice
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies for a single service
COPY services/payments-service/package.json services/payments-service/package-lock.json ./
RUN npm ci --omit=dev

# Copy service-specific source code
COPY services/payments-service/src/ ./src/
COPY services/payments-service/tsconfig.json ./

# Build the service
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set environment variables
ENV NODE_ENV=production
ENV SERVICE_NAME=payments-service

# Health check for the specific service
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "./dist/healthcheck.js"]

CMD ["node", "./dist/main.js"]
```

## 4. AWS Infrastructure Setup (Ethiopian Considerations) - Comprehensive Ecosystem

### Enhanced Architecture for Complete Ecosystem

```
┌───────────────────────────────────────────────────────────────────────┐
│                     AWS Cloud - Meqenet.et Ecosystem                   │
│                                                                        │
│  ┌────────────┐   ┌─────────────────────────────────────────────────┐ │
│  │ CloudFront │   │                  VPC                             │ │
│  │ CDN + WAF  │   │                                                  │ │
│  │ (Ecosystem)│◄──┼──┤  ALB    ├────►   EKS   ├────►  ECR    │      │ │
│  └────────────┘   │  │ (Multi) │    │ Cluster │    │ Registry│      │ │
│                   │  └─────────┘    │(FSA-org)│    │(Features)│     │ │
│  ┌────────────┐   │                 └────┬────┘    └─────────┘      │ │
│  │ Route 53   │   │  ┌─────────┐    ┌────▼────┐    ┌─────────┐      │ │
│  │ DNS (ET)   │◄──┼──┤ WAF Pro │    │ Secrets │    │   IAM   │      │ │
│  │            │   │  │Enhanced │    │ Manager │    │Enhanced │      │ │
│  └────────────┘   │  └─────────┘    │(Features)│   │Policies │      │ │
│                   │                 └─────────┘    └─────────┘      │ │
│  ┌────────────┐   │  ┌─────────┐    ┌─────────┐    ┌─────────┐      │ │
│  │Certificate │   │  │   RDS   │    │ Elastic │    │   S3    │      │ │
│  │ Manager    │   │  │PostgreSQL│   │  Cache  │    │Ecosystem│      │ │
│  │            │   │  │Enhanced │    │ Enhanced│    │ Buckets │      │ │
│  └────────────┘   │  └─────────┘    └─────────┘    └─────────┘      │ │
│                   │                                                  │ │
│  ┌────────────┐   │  ┌─────────┐    ┌─────────┐    ┌─────────┐      │ │
│  │ GuardDuty  │   │  │Security │    │CloudTrail│   │ Config  │      │ │
│  │Enhanced    │   │  │Hub Pro  │    │Enhanced │    │Enhanced │      │ │
│  │            │   │  │         │    │Auditing │    │Rules    │      │ │
│  └────────────┘   │  └─────────┘    └─────────┘    └─────────┘      │ │
│                   └─────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

### Key AWS Services for Comprehensive Ecosystem

- **AWS EKS (Elastic Kubernetes Service) - Enhanced:**
  - Managed Kubernetes with Feature-Sliced Architecture organization
  - Separate node groups for different ecosystem components
  - Enhanced autoscaling for marketplace, rewards, analytics workloads
  - Advanced security policies for financial and premium features

- **AWS ECR (Elastic Container Registry) - Multi-Feature:**
  - Separate repositories for each ecosystem component
  - Enhanced image scanning for comprehensive security
  - Feature-specific image tagging and versioning

- **AWS RDS (Relational Database Service) - Enhanced:**
  - PostgreSQL with comprehensive schema for all features
  - Enhanced performance tuning for marketplace and analytics
  - Advanced backup strategies for financial and premium data
  - Multi-AZ deployment with read replicas for analytics

- **AWS ElastiCache - Enhanced:**
  - Redis clusters optimized for different use cases
  - Session management for comprehensive user experience
  - Caching strategies for marketplace, rewards, and analytics

- **AWS S3 - Ecosystem Buckets:**
  - Static Content: Web assets, mobile app resources
  - Marketplace Assets: Product images, merchant documents
  - KYC Documents: Fayda National ID verification (encrypted)
  - Analytics Data: Business intelligence and ML training data
  - Audit Logs: Comprehensive ecosystem audit trails
  - Premium Content: Exclusive member resources

### Enhanced Deployment Steps (Comprehensive Ecosystem)

1.  **Prepare AWS Account for Ecosystem:**
    - Enhanced IAM roles for all ecosystem components
    - Feature-Sliced Architecture security boundaries
    - Comprehensive VPC configuration for all services
    - Advanced security groups for marketplace, payments, premium features

2.  **Set Up Enhanced Database:**
    - Comprehensive schema for all four payment options
    - Marketplace tables (merchants, products, orders)
    - Rewards and loyalty system tables
    - Premium subscription management tables
    - Analytics and ML feature tables
    - Virtual cards and QR payment tables

3.  **Set Up Kubernetes Cluster with FSA:**
    - Feature-based namespace organization
    - Enhanced security policies for financial features
    - Advanced resource allocation for different components
    - Comprehensive monitoring and logging setup

4.  **Deploy Comprehensive Application:**
    - Feature-Sliced Architecture deployment strategy
    - All ecosystem services with proper dependencies
    - Enhanced security validation for all components
    - Comprehensive NBE compliance verification

## 5. Kubernetes Configuration - Microservice Architecture

### Namespace Structure

```
├── kube-system                    # Kubernetes system components
├── monitoring                     # Prometheus, Grafana, etc.
├── logging                        # Fluentd, Elasticsearch, etc.
├── meqenet-staging               # Staging environment namespace
└── meqenet-production           # Production environment namespace
```

_Individual services are deployed within the appropriate environment namespace._

### Service Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payments-service
  namespace: meqenet-production # Deployed into the production namespace
  labels:
    app.kubernetes.io/name: payments-service
    app.kubernetes.io/part-of: meqenet
spec:
  replicas: 3
  selector:
    matchLabels:
      app.kubernetes.io/name: payments-service
  template:
    metadata:
      labels:
        app.kubernetes.io/name: payments-service
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      containers:
        - name: payments-service
          image: ${{ env.ECR_REPOSITORY_PREFIX }}/payments-service:${{ github.sha }}
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          # ... (Resources, Env Vars, Probes) ...
```

## 6. Mobile App Deployment - Comprehensive Ecosystem

### iOS Deployment (TestFlight & App Store)

- **Enhanced Build Configuration:**
  - Comprehensive feature flags for all ecosystem components
  - Environment-specific configurations for all services
  - Advanced code signing for financial application

- **Comprehensive Fastlane Configuration:**

  ```ruby
  # Fastfile for comprehensive ecosystem
  lane :beta do
    match(type: "appstore")
    increment_build_number

    # Build with all ecosystem features
    build_app(
      scheme: "Meqenet-Comprehensive",
      configuration: "Release-Comprehensive",
      export_options: {
        method: "app-store",
        provisioningProfiles: {
          "et.meqenet.comprehensive" => "match AppStore et.meqenet.comprehensive"
        }
      }
    )

    upload_to_testflight(
      app_identifier: "et.meqenet.comprehensive",
      skip_waiting_for_build_processing: true
    )
  end

  lane :release do
    match(type: "appstore")
    increment_build_number

    build_app(
      scheme: "Meqenet-Comprehensive",
      configuration: "Release-Production"
    )

    upload_to_app_store(
      app_identifier: "et.meqenet.comprehensive",
      submit_for_review: true,
      automatic_release: true,
      force: true,
      submission_information: {
        add_id_info_limits_tracking: true,
        add_id_info_serves_ads: false,
        add_id_info_tracks_action: true,
        add_id_info_tracks_install: true,
        add_id_info_uses_idfa: false,
        content_rights_has_rights: true,
        content_rights_contains_third_party_content: false,
        export_compliance_platform: 'ios',
        export_compliance_compliance_required: false,
        export_compliance_encryption_updated: false,
        export_compliance_app_type: nil,
        export_compliance_uses_encryption: false,
        export_compliance_is_exempt: false,
        export_compliance_contains_third_party_cryptography: false,
        export_compliance_contains_proprietary_cryptography: false,
        export_compliance_available_on_french_store: false
      }
    )
  end
  ```

### Android Deployment (Google Play)

- **Enhanced Build Configuration:**
  - Comprehensive product flavors for all ecosystem features
  - Advanced security configurations for financial data
  - Multi-APK support for different device capabilities

- **Comprehensive Fastlane Configuration:**

  ```ruby
  # Android Fastfile for comprehensive ecosystem
  lane :beta do
    gradle(
      task: "bundleComprehensiveRelease",
      properties: {
        "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"],
        "android.injected.signing.store.password" => ENV["KEYSTORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["KEY_PASSWORD"],
        "ecosystem.features" => "all",
        "build.type" => "comprehensive"
      }
    )

    upload_to_play_store(
      track: "internal",
      aab: "app/build/outputs/bundle/comprehensiveRelease/app-comprehensive-release.aab"
    )
  end

  lane :release do
    gradle(
      task: "bundleComprehensiveRelease",
      properties: {
        "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"],
        "android.injected.signing.store.password" => ENV["KEYSTORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["KEY_PASSWORD"],
        "ecosystem.features" => "production",
        "build.type" => "production"
      }
    )

    upload_to_play_store(
      track: "production",
      aab: "app/build/outputs/bundle/comprehensiveRelease/app-comprehensive-release.aab"
    )
  end
  ```

## 7. Deployment Strategies - Comprehensive Ecosystem

### Backend Services (Enhanced Blue-Green Deployment)

- **Immutable Infrastructure Principle**: Aligned with the best practices described by Finextra, our
  deployments treat infrastructure as immutable. Instead of updating services in-place, we deploy
  entirely new instances of the service with the updated code. Once the new version is confirmed
  healthy, traffic is switched over. The old version is kept for a short period to allow for rapid
  rollbacks before being decommissioned. This approach minimizes the risk of a failed deployment
  affecting production traffic.
- **Feature-Aware Process:**
  1. Deploy new version of all ecosystem services alongside existing
  2. Validate health of each feature domain separately
  3. Gradually shift traffic using feature-specific load balancers
  4. Monitor business metrics for all ecosystem components
  5. Complete cutover when all features are confirmed stable
  6. Maintain rollback capability for each feature domain

### Frontend Web (Enhanced Canary Releases)

- **Ecosystem-Aware Process:**
  1. Deploy new version with all ecosystem features to subset of pods
  2. Route small percentage of Ethiopian traffic to new version
  3. Monitor performance across all feature domains
  4. Validate marketplace, rewards, premium features separately
  5. Gradually increase traffic if all ecosystem metrics remain stable
  6. Full promotion when comprehensive validation passes

### Database Migrations (Comprehensive Schema)

- **Enhanced Strategy:**
  - Backward compatible migrations for all ecosystem features
  - Feature-specific migration phases for complex changes
  - Comprehensive testing across all payment options and features
  - Point-in-time recovery for all ecosystem data

## 8. Compliance Considerations (NBE & Ethiopian Laws) - Comprehensive Ecosystem

- **Enhanced NBE Regulations:** Deployment processes must adhere to NBE directives for all ecosystem
  components including marketplace operations, premium financial services, and analytics data
  handling.
- **Comprehensive Data Localization:** Strict adherence to NBE requirements for all ecosystem data
  including marketplace transactions, rewards data, premium subscriber information, and analytics
  insights.
- **Advanced Change Management:** Enhanced approval processes for production changes affecting
  financial services, marketplace operations, premium features, and customer data.
- **Comprehensive Audit Trails:** Enhanced logging and monitoring across all ecosystem components
  for NBE compliance and regulatory review.
- **Multi-Provider Integration:** Coordinated deployment of updates affecting Ethiopian payment
  providers, marketplace integrations, and premium service providers.
- **Enhanced KYC/AML Compliance:** Deployment processes must maintain Fayda National ID verification
  integrity across all ecosystem features.

## 9. Feature-Sliced Architecture Deployment Considerations

- **Feature Isolation:** Each feature domain can be deployed independently while maintaining
  ecosystem coherence
- **Cross-Feature Dependencies:** Careful management of shared services and utilities during
  deployments
- **Feature Flags:** Advanced feature flagging system for gradual rollout of ecosystem enhancements
- **Security Boundaries:** Maintained security isolation between features during deployment
  processes
- **Monitoring Integration:** Feature-specific monitoring and alerting during deployment validation
- **Testing Strategies:** Comprehensive testing across feature boundaries and ecosystem integration
  points

---

**Related Documentation:**

- [Infrastructure Architecture](./17.%20Infrastructure.md): Detailed infrastructure for
  comprehensive ecosystem
- [Monitoring & Logging](./19.%20Monitoring_And_Logging.md): Observability for all ecosystem
  components
- [Testing Guidelines](./18.%20Testing.md): Testing strategies for comprehensive ecosystem
- [Business Model](../Stage%201%20-%20Foundation/7.%20Business_Model.md): Complete business model
  with all payment options
- [Feature-Sliced Architecture](../Stage%201%20-%20Foundation/2.%20Architecture.md): FSA
  implementation details
