# App Development Progress

_Last updated: 2025-09-09 23:10:39 UTC_

This document tracks the development progress of the Meqenet platform. It is auto-generated from `tasks.yaml`.

## Platform Progress

**97 / 330 Sub-tasks Completed**

`[███████████-----------------------------] 29.39%`

## Stage 1: Foundation & Setup

**72 / 72 Sub-tasks Completed**

`[████████████████████████████████████████] 100.00%`

### Project Governance and Git Setup (`MEQ-FND-01`)

- [x] Initialize Git repository on GitHub/GitLab.
- [x] Define and enforce branch protection rules for 'main' and 'develop' (require PRs, passing checks).
- [x] Create repository issue templates for bugs, features, and chores.
- [x] [DevEx/Security] Implement pre-commit/pre-push hooks using Husky to run local security and lint checks before code is pushed.
- [x] [DevEx] Create scripts and detailed documentation to automate and streamline local development environment setup.
- [x] [DevEx] Create and maintain the standard `cookiecutter` service template for bootstrapping new microservices.
- [x] [Gov] Create template files for `REVIEWERS.md` and feature-specific `REVIEW_CHECKLIST.md` files as per code review guidelines.

### Backend: Microservices Monorepo Setup (`MEQ-FND-02`)

- [x] Initialize backend monorepo with Nx. Create initial applications for the API Gateway and the first core microservice (e.g., 'auth-service').
- [x] Integrate Prisma ORM, configure database connection URLs via environment variables.
- [x] Implement a global configuration service (e.g., `@nestjs/config`) to manage all environment variables.
- [x] Set up a structured logger (e.g., Pino) for application-wide logging.
- [x] Implement a global exception filter for consistent, structured error responses.
- [x] [BE] Implement the custom exception hierarchy as defined in `20-Error_Handling.md` (e.g., `FinancialServiceException`).
- [x] Configure ESLint and Prettier with strict rules, including eslint-plugin-security, and custom rules to enforce FSA principles in the backend monorepo.
- [x] [API Gov] Create the initial `openapi.yaml` file defining info, servers, and JWT security scheme.
- [x] [API Gov] Configure NestJS for URI-based versioning (e.g., '/api/v1').
- [x] [API Gov] Create per-service OpenAPI 3.0 specs (e.g., auth-service) and expose Swagger endpoints; validate per-service specs against the central contract.
- [x] [API Gov] Define and version service-to-service gRPC contracts in `.proto` files (e.g., `auth.v1`) and enable code generation for TypeScript/NestJS.
- [x] [API Gov/CI] Establish a shared `.proto` registry and CI to publish generated client/server stubs to the internal package registry.
- [x] [BE/Resilience] Configure HTTP client timeouts, retries with exponential backoff, and circuit breakers for the API Gateway and outbound service calls.
- [x] [BE/Monitoring] Initialize OpenTelemetry SDK in services (resource attrs, http/express instrumentation) to enable traces/metrics/log correlation.
- [x] [Arch Gov] Create initial database ERD diagrams for each core microservice's domain (e.g., User, Payments) as Mermaid diagrams in `10-Database.md`.
- [x] [BE/Monitoring] Instrument backend services with a Prometheus client to expose custom business and application metrics.
- [x] [BE/Security] Configure Helmet middleware for security headers (HSTS, CSP, X-Frame-Options, etc.) across all services.
- [x] [BE/Security] Implement comprehensive input validation framework using Zod/Joi with sanitization for all API endpoints.
- [x] [BE/Security] Configure CORS policies with strict origin controls and secure defaults for all services.
- [x] [BE/Security] Implement comprehensive rate limiting and DDoS protection using ThrottlerGuard across all API endpoints.
- [x] [BE/Security] Implement structured request/response logging with audit trails for all API calls (excluding sensitive data).
- [x] [BE/Config] Implement environment variable validation using Zod schemas to ensure all required config is present and valid.
- [x] [BE/Monitoring] Implement comprehensive health checks using @nestjs/terminus for database, external services, and system resources.

### Frontend: Monorepo for Web & Mobile Apps (`MEQ-FND-03`)

- [x] Initialize frontend monorepo with Nx, a Next.js app ('website'), and a React Native app ('app').
- [x] Set up Tailwind CSS for the Next.js 'website' application.
- [x] Set up a compatible styling solution (e.g., `twrnc`) for the React Native 'app'.
- [x] Create a shared API client library (e.g., using Axios) for both frontends to communicate with the backend.
- [x] Configure ESLint and Prettier for both Next.js and React Native apps, including eslint-plugin-security and custom rules to enforce FSA principles.
- [x] [Web] Configure the Next.js app to be a fully compliant Progressive Web App (PWA) with a service worker and manifest.
- [x] [Web] Implement a root React Error Boundary to catch rendering errors and show a graceful fallback UI.
- [x] [App] Implement a root React Error Boundary for the React Native app to prevent crashes from rendering errors.
- [x] [App/Monitoring] Integrate Sentry or Firebase Crashlytics into the React Native app for real-time crash reporting.

### DevOps: CI/CD & Infrastructure Foundation (`MEQ-FND-04`)

- [x] [CI] Create GitHub Actions workflow for the backend to run lint, type-check, and unit tests on PRs.
- [x] [CI/Security] Integrate and configure Software Composition Analysis (SCA) to scan for vulnerable dependencies and enforce governance policies (e.g., check for approved licenses and libraries).
- [x] [CI/Security] Integrate Static Application Security Testing (SAST) scanner into the backend CI workflow.
- [x] [CI/Security/DevOps] Procure and configure secrets (e.g., SNYK_TOKEN, SEMGREP_APP_TOKEN) for all CI security scanning tools.
- [x] [CI] Create GitHub Actions workflow for the frontend to run lint, type-check, and unit tests on PRs.
- [x] [IaC] Initialize Terraform project with a remote state backend (S3).
- [x] [IaC] Write Terraform scripts to provision core AWS networking (VPC, Subnets, Security Groups).
- [x] [IaC] Write Terraform scripts to provision a managed PostgreSQL database (RDS).
- [x] [CI/API Gov] Set up pipeline to auto-generate and publish API docs from `openapi.yaml`.
- [x] [CI/Arch Gov] Add a CI step to validate Mermaid syntax in all project Markdown files.
- [x] [BE/DevOps] Implement an event bus (e.g., AWS SNS/SQS) and define core domain events for cross-service communication.
- [x] [IaC/DevOps] Configure AWS API Gateway to manage, secure, and route traffic to the backend services.

### Data Governance & Lifecycle Management (`MEQ-FND-05`)

- [x] [BE/DevOps] Implement a data classification system for all `schema.prisma` models (e.g., using comments).
- [x] [BE/DevOps] Develop and implement automated data retention and deletion scripts based on data classification.
- [x] [BE/DB] Establish and implement data quality checks and validation rules at the database/ORM layer.
- [x] [Docs] Formally document data ownership and stewardship for core data domains in `06-Data_Governance_and_Privacy_Policy.md`.

### [FE] Core Design System & Component Library (`MEQ-FND-06`)

- [x] [UX] Implement design tokens (colors, typography, spacing) from UX Guidelines into Tailwind/Styling solution.
- [x] [UX] Build and document core UI components (Button, Input, Card, Modal) in Storybook for both web and mobile.
- [x] [UX] Build and document specialized financial components (PaymentPlanCard, ProgressIndicator, etc.).
- [x] [UX/A11y] Implement and test WCAG 2.1 AAA compliance across the component library.

### Test Infrastructure & Developer Experience (`MEQ-FND-07`)

- [x] [DevEx/Test] Develop a simulator/mock server for key Ethiopian payment providers (Telebirr, etc.) to enable robust integration testing.
- [x] [DevEx/Test] Create and maintain a seed script to populate databases with realistic, anonymized Ethiopian test data.
- [x] [DevEx/Test] Create Docker Compose configuration for E2E test environment with PostgreSQL 15, Redis 7, and all microservices.
- [x] [DevEx/Test] Implement E2E test orchestration scripts with service health checks and startup coordination.
- [x] [DevEx/Test] Create E2E test data management system with automatic seeding, isolation, and cleanup between test runs.
- [x] [DevEx/Test] Configure E2E test database with proper encryption for Fayda National ID data and NBE compliance validation.
- [x] [CI/Test] Integrate E2E test suite into CI/CD pipeline with proper service orchestration and parallel test execution.
- [x] [E2E] Add end-to-end tests covering API Gateway proxying to Auth service (login/register flows via gateway).

### Localization & API Documentation (`MEQ-FND-08`)

- [x] [BE/FE] Implement a robust internationalization (i18n) framework (e.g., `react-i18next`) across both frontends and for backend error messages.
- [x] [FE] Create centralized i18n resource files for UI text and error messages, with initial translations for Amharic and English.
- [x] [Docs/DevEx] Create and maintain Postman collections for all public-facing APIs, including environment setups for local and staging.
- [x] [Docs/DevEx] Generate and publish code examples for API usage in key languages (JavaScript, Python) alongside API documentation.
- [x] [BE/i18n] Wire bilingual (Amharic/English) error responses across backend controllers and DTO validation messages.

---

## Stage 2: Authentication & User Management

**25 / 28 Sub-tasks Completed**

`[███████████████████████████████████-----] 89.29%`

### [BE] Implement Secure Authentication Service (`MEQ-AUTH-01`)

- [x] Design and finalize User, Profile, Credential, and Role schemas in `schema.prisma`.
- [x] Generate and apply the database migration for all authentication-related tables.
- [x] Implement `/auth/register` endpoint with robust DTO validation for incoming data.
- [x] Use `bcrypt` with a configurable salt round count for all password hashing.
- [x] Implement `/auth/login` endpoint and protect it with rate limiting.
- [x] Generate secure, signed JWTs with appropriate claims (userID, role, exp) using secrets from a secure vault.
- [x] Implement `/auth/refresh` endpoint for secure JWT rotation.
- [x] Implement `/auth/password-reset-request` endpoint to generate a secure, single-use token.
- [x] Implement `/auth/password-reset-confirm` endpoint to validate token and update password.
- [x] Implement `/users/me` endpoint to fetch the current authenticated user's profile.
- [x] [Security] Implement Multi-Factor Authentication (MFA) via SMS and Email OTP with secure rate-limiting and anti-SIM swap controls.
- [x] [Security/Mobile] Integrate biometric factor (device biometrics) into MFA flow and risk-based step-up authentication.
- [x] Implement a global NestJS Guard using Passport.js to validate JWTs on all protected routes.
- [x] Implement a Role-Based Access Control (RBAC) Guard and decorator to restrict endpoints by user role.
- [x] Implement detailed audit logging for all auth events (login success/fail, registration, pw_reset, role_change).
- [x] [Test] Write unit tests for auth service logic (hashing, JWT signing, user creation).
- [x] [Test] Write integration tests for all authentication endpoints, including error cases.
- [x] [Security] Implement risk-based adaptive authentication (e.g., step-up MFA for high-risk logins from new devices).
- [x] [Security/DB] Implement field-level encryption for all 'Level 1' classified data fields in the database.
- [x] [BE/Security] Implement an OAuth 2.0 provider service (PKCE flow) for secure third-party and merchant integrations.

### [App] Build Authentication UI & Logic (`MEQ-AUTH-03`)

- [x] Create shared, reusable auth components in React Native.
- [x] Build Login screen with form validation (e.g., Formik/Yup) and API integration.
- [x] Build Registration screen with form validation and API integration.
- [x] Build 'Request Password Reset' screen.
- [x] Build 'Confirm Password Reset' screen.
- [ ] Implement client-side session management (store/clear JWT in secure device storage).
- [ ] Implement global state management and navigation guards for authentication status.
- [ ] [Test] Write E2E tests for the full mobile login and registration user flows.

---

## Stage 3: Core BNPL & Payments

**0 / 51 Sub-tasks Completed**

`[----------------------------------------] 0.00%`

### [BE] Core BNPL & Payments Database Schema (`MEQ-BNPL-01`)

- [ ] Design and finalize Loan, Installment, Transaction, and PaymentMethod schemas in `schema.prisma`.
- [ ] Define relations between loan/transaction tables and the User model.
- [ ] Generate and apply the database migration for all core BNPL tables.

### [BE] BNPL Business Logic & Services (`MEQ-BNPL-02`)

- [ ] Develop a service to calculate loan terms, interest (if any), and installment schedules.
- [ ] Implement the core service for loan applications, checking user eligibility (e.g., KYC status, credit score).
- [ ] Build the service to handle manual and automatic installment payments against a loan.
- [ ] Implement a scheduled job (cron) for sending payment reminders via email/SMS.
- [ ] Implement a scheduled job for identifying overdue payments and applying late fees according to business rules.
- [ ] [Security] Design a tamper-proof interest calculation engine with cryptographic verification of results.
- [ ] [Compliance] Implement immutable audit trails for all manual and automated changes to loan terms or interest rates.
- [ ] [Test] Write unit & integration tests for all BNPL services, covering calculations and state changes.
- [ ] [BE] Implement a circuit breaker pattern (e.g., using `nestjs-circuitbreaker`) for critical external dependencies like payment gateways.

### [BE] External Service Integrations (eKYC & Payments) (`MEQ-BNPL-03`)

- [ ] Develop a robust NestJS service for the Fayda eKYC API, based on the contract in `11-Integration_Requirements.md`.
- [ ] Develop a robust NestJS service for Telebirr, based on the contract in `11-Integration_Requirements.md`.
- [ ] Implement webhook handlers for Telebirr to process payment confirmations asynchronously and securely.
- [ ] Integrate an SMS service (e.g., Twilio) for sending notifications (reminders, confirmations).
- [ ] [Test] Write integration tests for integration services using mocks for external APIs.
- [ ] Develop a robust NestJS service for HelloCash/CBE Birr integration.
- [ ] Develop a robust NestJS service for ArifPay integration.
- [ ] Develop a robust NestJS service for SantimPay integration.
- [ ] Develop a robust NestJS service for Chapa payment gateway integration.

### [App] Consumer BNPL Features (`MEQ-BNPL-05`)

- [ ] Build UI for in-store QR code scanning and payment initiation.
- [ ] Develop the multi-screen flow for the eKYC identity verification process on mobile.
- [ ] Build loan management screens (history, upcoming payments).
- [ ] Implement UI and logic for making manual payments on the mobile app.
- [ ] Implement push notifications for payment reminders and confirmations.
- [ ] [Test] Write E2E tests (using Detox/Maestro) for the mobile QR code payment flow.
- [ ] [App] Implement offline-first capabilities (local storage, data synchronization) for viewing loans and transaction history.
- [ ] [App/UX] Build a Payment Plan Comparison Tool to visualize costs for all four payment options.
- [ ] [App/UX] Build a Financial Impact Calculator to show total interest and payment schedules.

### [BE] Credit & Risk Engine (`MEQ-BNPL-06`)

- [ ] Implement alternative data credit scoring models for underserved populations.
- [ ] Build dynamic credit limits engine with real-time adjustments.
- [ ] Develop collections engine with automated reminders, grace periods, and escalations.
- [ ] Implement portfolio risk analytics and stress testing capabilities.

### [BE] Payments & Settlements Infrastructure (`MEQ-BNPL-07`)

- [ ] Build payment switch layer supporting all payment channels and methods.
- [ ] Implement settlement engine with T+0 and T+2 processing capabilities.
- [ ] Develop comprehensive refunds and disputes workflow system.
- [ ] Implement chargeback handling with NBE compliance and dispute resolution.
- [ ] Integrate offline payment methods (USSD, POS) for comprehensive coverage.

### [Mobile] Consumer Mobile App Development (`MEQ-BNPL-08`)

- [ ] Create React Native TypeScript mobile app skeleton with navigation setup.
- [ ] Implement onboarding and KYC flow integration with Fayda ID.
- [ ] Integrate authentication with backend JWT and secure storage.
- [ ] Build user dashboard for credit status and repayment tracking.
- [ ] Implement checkout flow with BNPL payment plan selection.
- [ ] Integrate push notifications and in-app payment reminders.
- [ ] Develop wallet interface and transaction history features.
- [ ] Create profile and settings management module.
- [ ] Integrate rewards and loyalty program features.
- [ ] Build USSD fallback interface for low-connectivity scenarios.
- [ ] Conduct accessibility testing for Amharic support and low-end devices.
- [ ] Prepare and execute App Store and Google Play publishing process.

---

## Stage 4: Merchant & Admin Platforms

**0 / 24 Sub-tasks Completed**

`[----------------------------------------] 0.00%`

### [BE] Merchant & Admin Database Schema (`MEQ-MGT-01`)

- [ ] Design and finalize Merchant, Store, MerchantUser, Settlement, and AuditLog schemas in `schema.prisma`.
- [ ] Define relations for merchants to users, transactions, and settlements. Generate and apply migration.

### [BE] Merchant Onboarding & Management Services (`MEQ-MGT-02`)

- [ ] Implement merchant application/onboarding endpoint.
- [ ] Build service for admin to review and approve/reject merchant applications.
- [ ] Implement service for merchants to manage their own profile and store details.
- [ ] Develop service for merchants to generate and manage their API keys.

### [BE] Settlement & Admin Services (`MEQ-MGT-03`)

- [ ] Develop a service to calculate merchant settlement amounts based on transactions, fees, and rolling reserves.
- [ ] Implement a scheduled job to automatically process and record merchant settlements daily/weekly.
- [ ] Build admin endpoints for managing consumer accounts (view details, block/unblock, view loans).
- [ ] Build admin endpoints for managing system-level settings (e.g., BNPL plan terms, late fees).
- [ ] [Test] Write unit & integration tests for merchant onboarding and settlement calculation logic.

### [BE] AML/CTF Compliance & Monitoring System (`MEQ-MGT-06`)

- [ ] [BE/Compliance] Integrate with a sanctions list provider for real-time customer and merchant screening.
- [ ] [BE/Compliance] Implement advanced fuzzy name matching for sanctions screening, tuned for Ethiopian names.
- [ ] [BE/Compliance] Implement a real-time transaction monitoring engine with configurable rules (e.g., threshold-based alerts).
- [ ] [BE/Compliance] Develop logic for enhanced due diligence (EDD) on high-risk customers.
- [ ] [BE/Compliance] Build a service to generate Suspicious Transaction Reports (STRs) for regulatory submission.

### [BE/FE] Customer Complaint & DSR Management (`MEQ-MGT-08`)

- [ ] [BE/Compliance] Design and implement schema for tracking complaint and Data Subject Right (DSR) tickets.
- [ ] [BE/API] Build API endpoints for users to submit complaints and DSR requests (access, erasure).
- [ ] [Web/Admin] Build UI for support/compliance officers to manage, process, and resolve tickets.
- [ ] [App/Web] Create UI for users to submit and view the status of their complaints/DSR requests.

### [BE/FE] Merchant Integrations (`MEQ-MGT-09`)

- [ ] Develop merchant SDKs for iOS, Android, Web, and React Native platforms.
- [ ] Create e-commerce plugins for Shopify, WooCommerce, and Magento platforms.
- [ ] Implement POS integrations for retail checkout systems.
- [ ] Build merchant developer portal with sandbox environment and documentation.

---

## Stage 5: AI, Deployment & Launch

**0 / 84 Sub-tasks Completed**

`[----------------------------------------] 0.00%`

### [BE] AI/ML Credit Scoring Model Integration (`MEQ-AI-01`)

- [ ] Develop data pipelines to extract and anonymize user/transaction data for model training.
- [ ] [BE/AI] Create a NestJS service to integrate with an external AI provider (e.g., OpenAI) for the initial credit scoring model.
- [ ] Integrate the credit score into the BNPL application service to influence loan approvals and terms.
- [ ] [AI/ML] Implement bias detection and fairness metrics monitoring for the credit scoring model.
- [ ] [AI/ML] Develop an 'Explainable AI' service to provide human-readable reasons for credit decisions.
- [ ] Implement monitoring for the credit scoring service (latency, error rate, score distribution).

### Production Infrastructure & Deployment (`MEQ-DEP-01`)

- [ ] [IaC] Write Terraform scripts for production AWS resources (ECS Fargate, RDS with replicas, ElastiCache).
- [ ] [IaC] Configure production-grade security groups and network ACLs.
- [ ] [Security] Configure AWS Secrets Manager for all production secrets and integrate with the backend service.
- [ ] [Security/IaC] Provision and configure Hardware Security Modules (HSMs) or equivalent for primary key management.
- [ ] [DevOps/Security] Implement data masking and tokenization jobs for creating sanitized non-production environments.
- [ ] [IaC/DBA] Enable at-rest encryption for RDS (KMS-managed keys/TDE) and define key rotation policies; validate PITR.
- [ ] [CI/CD] Create workflow to build and push versioned Docker images to ECR on merge to 'main'.
- [ ] [CI/CD] Implement a deployment pipeline (e.g., using GitHub Actions) to deploy the new image to production via a blue/green or canary strategy.
- [ ] Set up centralized logging (CloudWatch) and monitoring dashboards/alerts (Datadog/Grafana) for the production environment.
- [ ] [DevOps/Monitoring] Configure dashboards and alerts for key error metrics (payment provider success rates, API endpoint error rates).
- [ ] [Security/DevOps] Configure the service mesh or API Gateway to enforce mTLS for all internal service-to-service communication.
- [ ] [Security/IAM] Adopt SPIFFE/SPIRE for workload identities and automate certificate issuance/rotation for mesh mTLS.
- [ ] [IaC/DevOps] Provision and configure a managed Redis cluster (e.g., ElastiCache) for caching and session storage.
- [ ] [IaC/DBA] Configure PgBouncer for production PostgreSQL connection pooling.
- [ ] [IaC/DevOps] Provision and configure an Elasticsearch cluster for product search and logging.
- [ ] [IaC/DevOps] Provision a Data Warehouse (e.g., Snowflake/BigQuery) and establish initial ETL pipelines.
- [ ] [IaC/DBA] Define and implement automated backup policies, Point-in-Time Recovery, and regular restore testing for production databases.
- [ ] [CI/CD/Mobile] Configure a CI/CD pipeline using Fastlane to automate building, signing, and deploying the mobile app.
- [ ] [BE/DevOps] Integrate Datadog APM or another OpenTelemetry-compatible agent for distributed tracing across services.
- [ ] [DevOps] Integrate monitoring/alerting systems with PagerDuty for on-call scheduling and escalation.
- [ ] [Test/DevOps] Create synthetic monitoring checks to test critical financial flows from an end-user perspective.
- [ ] [Security/IaC] Configure AWS WAF with OWASP Top 10 rules and custom rate-based rules tuned for Ethiopian traffic.
- [ ] [IaC/Fargate] Refine and enforce strict Security Group ingress/egress rules between Fargate services.
- [ ] [Security/IaC] Configure AWS SSM Session Manager for secure, auditable shell access, disabling direct SSH.
- [ ] [IaC/Web] Configure CloudFront distributions with geo-restriction to primarily serve traffic to Ethiopia.

### Pre-Launch Finalization & Go-Live (`MEQ-LNC-01`)

- [ ] [Ops/Compliance] Obtain and securely configure production credentials for all external services (Fayda, NBE, Payment Providers) in the production vault.
- [ ] [Test] Perform and sign-off on end-to-end testing of all critical user flows (consumer, merchant, admin).
- [ ] [Test] Conduct performance testing (K6) on critical endpoints, simulating Ethiopian network conditions (latency, bandwidth).
- [ ] [BE/FE] Implement data compression (Gzip) and image optimization strategies to improve performance on low-bandwidth networks.
- [ ] Conduct and review a full, third-party security audit and penetration test. Remediate critical findings.
- [ ] [Test/Security] Schedule recurring DAST scans (e.g., quarterly) using tools like OWASP ZAP against the staging environment.
- [ ] Perform and document a successful disaster recovery drill (e.g., database restore, service failover).
- [ ] Prepare and publish final, versioned API documentation for merchants.
- [ ] [Docs] Write the full Incident Response Plan based on the placeholder, detailing roles, severity levels, and procedures.
- [ ] Finalize and train the support team on the incident response plan.
- [ ] Execute the production deployment ('Go-Live').
- [ ] Perform post-launch monitoring and health checks.
- [ ] [Docs] Write the full Disaster Recovery Plan based on the placeholder, detailing RTO/RPO, failover strategy, and restoration procedures.

### Cloud Cost Management & FinOps (`MEQ-DEP-02`)

- [ ] [FinOps/IaC] Implement and enforce the mandatory resource tagging policy using AWS Config rules to enable cost allocation.
- [ ] [FinOps/DevOps] Configure AWS Budgets with alerts for overall spend and for key services, notifying relevant teams.
- [ ] [FinOps/DevOps] Create dedicated FinOps dashboards in Grafana/Datadog to visualize cost drivers.
- [ ] [FinOps/IaC] Implement S3 Lifecycle Policies to automatically transition aged data to lower-cost storage tiers.
- [ ] [FinOps/IaC] Evaluate and use Graviton instances for production services to improve price-performance.
- [ ] [FinOps/IaC] Implement a strategy to use Spot Instances for non-critical, fault-tolerant workloads (e.g., CI/CD runners).
- [ ] [FinOps/Gov] Establish and document the monthly cost review process and schedule the first meeting.
- [ ] [AI/FinOps] Implement caching and detailed usage monitoring for AI service calls to manage token consumption costs.

### Performance Optimization & Monitoring (`MEQ-LNC-03`)

- [ ] [FE/Perf] Analyze production bundle composition to identify and optimize large dependencies.
- [ ] [FE/Perf] Implement a script or CI job to convert all project images to an optimized format like WebP.
- [ ] [FE/Perf] Implement progressive/lazy loading for all non-critical images and media assets.
- [ ] [App/Perf] Audit native modules for performance bottlenecks and identify candidates for native implementation.
- [ ] [App/Perf] Configure Metro bundler for optimal production performance, including enabling the Hermes engine.
- [ ] [Test/Perf] Expand real-device testing matrix to include a wider range of low-end Android devices common in Ethiopia.
- [ ] [App/Monitoring] Integrate a Real User Monitoring (RUM) tool (e.g., Firebase Performance) into the mobile app.
- [ ] [DevOps/Monitoring] Configure alerts for key performance regressions (LCP, API latency, etc.) in the production monitoring system.

### Compliance & Localization Testing (`MEQ-LNC-02`)

- [ ] [Test/Compliance] Develop and run an automated test suite to validate NBE compliance requirements (disclosures, KYC data handling).
- [ ] [Test/FE] Create and execute a formal test plan for Amharic localization, covering UI layout, text, and data formats on web and mobile.

### [BE/FE] Compliance & Regulatory Framework (`MEQ-LNC-04`)

- [ ] Prepare NBE license application documentation and compliance framework.
- [ ] Implement AML/CTF transaction monitoring with automated alerts.
- [ ] Build regulatory audit and automated reporting module.
- [ ] Implement data privacy controls and GDPR compliance framework.

### [BE/FE] User Experience & Trust Features (`MEQ-LNC-05`)

- [ ] Implement sub-500ms instant decisioning for BNPL applications.
- [ ] Develop transparent terms and disclosures with clear pricing display.
- [ ] Build consumer dispute resolution system with automated responses.
- [ ] Implement loyalty rewards engine with gamification features.
- [ ] Ensure USSD accessibility for low-end devices with simplified interface.

### [BE/FE] Operations & Support Infrastructure (`MEQ-LNC-06`)

- [ ] Implement omnichannel customer support with chat, email, and phone integration.
- [ ] Build merchant support tools with onboarding automation and analytics.
- [ ] Develop internal dispute resolution workflow with escalation paths.
- [ ] Create knowledge base and help center with self-service features.

### [BE] Financial Model & Treasury Management (`MEQ-LNC-07`)

- [ ] Implement treasury liquidity management with cash flow forecasting.
- [ ] Build capital management system for credit lines and partnership funding.
- [ ] Develop collections and recovery workflows with automated strategies.
- [ ] Implement IFRS-compliant accounting and automated reporting system.

### [BE/FE] Growth & Ecosystem Expansion (`MEQ-LNC-08`)

- [ ] Build referral program engine with incentive management.
- [ ] Implement social group payments for community-based lending.
- [ ] Develop consumer marketplace discovery with AI-powered recommendations.
- [ ] Integrate with telco and retail partnerships for expanded reach.
- [ ] Create merchant insights and data dashboards for performance analytics.

---

## Stage 6: Marketplace, Rewards & Financial Wellness

**0 / 14 Sub-tasks Completed**

`[----------------------------------------] 0.00%`

### [BE] Marketplace & Discovery Services (`MEQ-MKT-01`)

- [ ] Design and implement Product, Category, and MerchantProduct schemas in `schema.prisma`.
- [ ] Implement APIs for product search, filtering, and categorization.
- [ ] Build APIs for merchants to manage their product listings.

### [Web/App] Marketplace UI/UX (`MEQ-MKT-02`)

- [ ] Build product listing and product detail pages/screens for both web and app.
- [ ] Implement search and filtering UI on both platforms.
- [ ] Build Wishlist feature UI and logic.

### [BE] Rewards & Cashback Engine (`MEQ-REW-01`)

- [ ] Design and implement CashbackLedger and RewardsProgram schemas in `schema.prisma`.
- [ ] Develop a rules engine to calculate cashback based on merchant, category, and promotions.

### [Web/App] Rewards UI/UX (`MEQ-REW-02`)

- [ ] Build UI for users to view their cashback balance and transaction history.
- [ ] Integrate 'apply cashback' option into the checkout flow.

### [BE] Financial Wellness Services (`MEQ-FIN-01`)

- [ ] Implement a service to automatically categorize user spending.

### [Web/App] Financial Wellness Tools UI (`MEQ-FIN-02`)

- [ ] Build UI for spending analytics and budget tracking.
- [ ] Develop UI for creating and managing savings goals.
- [ ] Create Financial Education module with interactive content.

---

## Stage 7: Advanced Platforms & Premium Features

**0 / 9 Sub-tasks Completed**

`[----------------------------------------] 0.00%`

### [BE/FE] Meqenet Plus Subscription (`MEQ-PREM-01`)

- [ ] Add `Subscription` model to `schema.prisma` and link to User.
- [ ] Implement service to manage subscription lifecycle (subscribe, renew, cancel) via Telebirr.
- [ ] Build UI for users to subscribe to Meqenet Plus and manage their subscription.

### [BE] Virtual Card Service Integration (`MEQ-VCC-01`)

- [ ] Integrate with a virtual card issuing provider's API.
- [ ] Build APIs to create, fund, and manage the lifecycle of virtual cards.

### [Web/App] Virtual Card UI (`MEQ-VCC-02`)

- [ ] Build UI to securely display virtual card details.
- [ ] Develop UI to freeze/unfreeze card, view transactions, and manage limits.

### [BE] USSD Gateway Service (`MEQ-USD-01`)

- [ ] Develop a service to handle USSD menu navigation and state management.
- [ ] Integrate with a mobile network operator's USSD gateway.

---

## Stage 8: Advanced AI & Personalization

**0 / 7 Sub-tasks Completed**

`[----------------------------------------] 0.00%`

### [BE] AI-Powered Recommendation Engines (`MEQ-AI-02`)

- [ ] [BE/AI] Develop an AI-powered service for recommending the optimal payment plan based on user profile and purchase context.
- [ ] [BE/AI] Integrate the payment plan recommendations into the checkout flow on both web and mobile.
- [ ] [BE/AI] Build a product recommendation engine for the marketplace based on user behavior and financial profile.

### [BE] Dynamic Interest Rate & Financial Optimization (`MEQ-AI-03`)

- [ ] [BE/AI] Develop and train an ML model for dynamic interest rate optimization on 'Pay Over Time' loans.
- [ ] [BE/AI] Build a service to provide AI-powered cashback and rewards optimization suggestions to users.

### [BE] Merchant & Marketplace AI Services (`MEQ-AI-04`)

- [ ] [BE/AI] Develop an ML model for Merchant Risk Scoring to automate and enhance merchant onboarding.
- [ ] [BE/AI] Implement AI-driven inventory and pricing optimization suggestions for merchants.

---

## Stage 9: Ecosystem & Plugin Development

**0 / 1 Sub-tasks Completed**

`[----------------------------------------] 0.00%`

### [BE] Strategic Payment Integrations (`MEQ-ECO-02`)

- [ ] [BE/Integration] Develop a robust NestJS service for M-Pesa integration as a strategic ecosystem partner.

---

## Stage 10: Scalability & Performance Engineering

**0 / 12 Sub-tasks Completed**

`[----------------------------------------] 0.00%`

### [BE/DevOps] Near-Term Scalability Enhancements (`MEQ-SCL-01`)

- [ ] Implement advanced, feature-specific caching strategies (e.g., Redis) for high-read domains like Marketplace.
- [ ] Review and optimize cross-feature communication protocols to reduce latency and overhead.
- [ ] Define and implement feature-specific Horizontal Pod Autoscaler (HPA) policies based on domain metrics.
- [ ] Implement database partitioning (e.g., by date/hash) for high-volume tables like 'transactions' and 'analytics_events'.
- [ ] Implement comprehensive, per-domain monitoring dashboards to track feature-specific scalability KPIs.

### [Arch] Mid-Term Scalability Initiatives (`MEQ-SCL-02`)

- [ ] Evaluate decomposition of largest feature domains (e.g., Marketplace) into finer-grained microservices.
- [ ] Investigate and potentially implement event sourcing for complex, cross-feature state management.
- [ ] Implement feature-specific CDN optimization rules for assets based on usage patterns.
- [ ] Evaluate and plan for database sharding for hyper-growth features like Marketplace and Analytics.
- [ ] Develop a predictive scaling model based on historical data and Ethiopian market patterns (e.g., holidays).

### [Arch] Long-Term Scalability Research (`MEQ-SCL-03`)

- [ ] Investigate and create a plan for potential multi-region, active-active deployment.
- [ ] Research and design an AI-driven capacity planning and autonomous scaling system.

---

## Stage 11: Continuous Improvement & Governance

**0 / 7 Sub-tasks Completed**

`[----------------------------------------] 0.00%`

### [Gov] Feature Expansion Framework Setup (`MEQ-GOV-01`)

- [ ] Create the official 'Feature Proposal' issue template in the GitHub repository based on 32-Feature_Expansion.md.
- [ ] Establish and document the process for using the Feature Prioritization Framework for all new feature requests.
- [ ] Create a process and assign ownership for updating user, API, and internal documentation when features are added or changed.

### [Gov] Cross-Functional Process Implementation (`MEQ-GOV-02`)

- [ ] Establish a formal review process for all new features that have financial logic to ensure consistency and NBE compliance.
- [ ] Mandate and formalize a threat modeling session as a required step for any new feature proposal.
- [ ] Establish a formal user research process for major new features, specifically targeting Ethiopian user segments.
- [ ] [Gov/Supply-Chain] Enforce policy to disallow deprecated i18n backends; review and remediate vulnerable transitive dependencies quarterly.

---

## Stage 12: Accessibility & Inclusion

**0 / 21 Sub-tasks Completed**

`[----------------------------------------] 0.00%`

### [A11y] Foundational Accessibility Audit & Setup (`MEQ-A11Y-01`)

- [ ] Perform an initial automated accessibility audit (Axe/Lighthouse) on web and app to establish a baseline.
- [ ] Integrate automated accessibility checks (e.g., jest-axe) into the CI pipelines for both frontend projects.
- [ ] Create and publish a public-facing Accessibility Statement on the website.
- [ ] Incorporate accessibility requirements and documentation directly into the shared Design System (Storybook).

### [A11y] Implementation & Remediation (`MEQ-A11Y-02`)

- [ ] Perform a full keyboard-only navigation test of all critical user flows on both web and app.
- [ ] Conduct manual screen reader testing (VoiceOver, TalkBack) for primary user journeys.
- [ ] Audit and remediate all color contrast issues to ensure WCAG 2.1 AA compliance.
- [ ] Ensure all form fields across all platforms have proper labels, instructions, and accessible error handling.

### [A11y] Advanced & Ongoing Processes (`MEQ-A11Y-03`)

- [ ] Plan and conduct the first round of usability testing that includes users with disabilities.
- [ ] Develop and deliver accessibility training for all designers and developers.
- [ ] Verify Amharic language support with screen readers and ensure proper right-to-left UI handling where needed.

### [BE] Technical Infrastructure Setup (`MEQ-FND-10`)

- [ ] Define and document clear microservice boundaries and domain responsibilities.
- [ ] Design and implement public API layer with proper versioning and documentation.
- [ ] Build data pipelines for credit scoring and fraud detection systems.
- [ ] Implement multi-region infrastructure with automated failover capabilities.
- [ ] Set up comprehensive CI/CD pipeline with infrastructure as code.
- [ ] Deploy observability stack (Prometheus, Grafana, ELK) with comprehensive monitoring.

### [BE/Security] Security Infrastructure (`MEQ-FND-09`)

- [ ] Implement comprehensive encryption at rest and in transit across all systems.
- [ ] Deploy zero trust architecture with RBAC implementation.
- [ ] Establish ongoing penetration testing program with automated scanning.
- [ ] Deploy fraud AI with device fingerprinting and anomaly detection.

---

