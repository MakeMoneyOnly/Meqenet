# App Development Progress

_Last updated: 2025-06-23 21:14:16 UTC_

This document tracks the development progress of the Meqenet platform. It is auto-generated from
`tasks.yaml`.

## Stage 1: Foundation & Setup

### Project Governance and Git Setup (`MEQ-FND-01`)

- [ ] **FND-GIT-01**: Initialize Git repository on GitHub/GitLab.
- [ ] **FND-GIT-02**: Define and enforce branch protection rules for 'main' and 'develop' (require
      PRs, passing checks).
- [ ] **FND-GIT-03**: Create repository issue templates for bugs, features, and chores.
- [ ] **FND-GIT-04**: [DevEx/Security] Implement pre-commit/pre-push hooks using Husky to run local
      security and lint checks before code is pushed.
- [ ] **FND-DEVEX-01**: [DevEx] Create scripts and detailed documentation to automate and streamline
      local development environment setup.
- [ ] **FND-DEVEX-02**: [DevEx] Create and maintain the standard `cookiecutter` service template for
      bootstrapping new microservices.
- [ ] **FND-GOV-02**: [Gov] Create template files for `REVIEWERS.md` and feature-specific
      `REVIEW_CHECKLIST.md` files as per code review guidelines.

### Backend: Microservices Monorepo Setup (`MEQ-FND-02`)

- [ ] **FND-BE-NX-01**: Initialize backend monorepo with Nx. Create initial applications for the API
      Gateway and the first core microservice (e.g., 'auth-service').
- [ ] **FND-BE-DB-01**: Integrate Prisma ORM, configure database connection URLs via environment
      variables.
- [ ] **FND-BE-CFG-01**: Implement a global configuration service (e.g., `@nestjs/config`) to manage
      all environment variables.
- [ ] **FND-BE-LOG-01**: Set up a structured logger (e.g., Pino) for application-wide logging.
- [ ] **FND-BE-ERR-01**: Implement a global exception filter for consistent, structured error
      responses.
- [ ] **FND-BE-ERR-02**: [BE] Implement the custom exception hierarchy as defined in
      `20-Error_Handling.md` (e.g., `FinancialServiceException`).
- [ ] **FND-BE-LNT-01**: Configure ESLint and Prettier with strict rules, including
      eslint-plugin-security, and custom rules to enforce FSA principles in the backend monorepo.
- [ ] **FND-BE-API-01**: [API Gov] Create the initial `openapi.yaml` file defining info, servers,
      and JWT security scheme.
- [ ] **FND-BE-API-02**: [API Gov] Configure NestJS for URI-based versioning (e.g., '/api/v1').
- [ ] **FND-BE-ERD-01**: [Arch Gov] Create initial database ERD diagrams for each core
      microservice's domain (e.g., User, Payments) as Mermaid diagrams in `10-Database.md`.
- [ ] **FND-BE-METRICS-01**: [BE/Monitoring] Instrument backend services with a Prometheus client to
      expose custom business and application metrics.
- [ ] **FND-BE-SEC-01**: [BE/Security] Configure Helmet middleware for security headers (HSTS, CSP,
      X-Frame-Options, etc.) across all services.
- [ ] **FND-BE-SEC-02**: [BE/Security] Implement comprehensive input validation framework using
      Zod/Joi with sanitization for all API endpoints.
- [ ] **FND-BE-SEC-03**: [BE/Security] Configure CORS policies with strict origin controls and
      secure defaults for all services.
- [ ] **FND-BE-SEC-04**: [BE/Security] Implement comprehensive rate limiting and DDoS protection
      using ThrottlerGuard across all API endpoints.
- [ ] **FND-BE-SEC-05**: [BE/Security] Implement structured request/response logging with audit
      trails for all API calls (excluding sensitive data).
- [ ] **FND-BE-CFG-02**: [BE/Config] Implement environment variable validation using Zod schemas to
      ensure all required config is present and valid.
- [ ] **FND-BE-HEALTH-01**: [BE/Monitoring] Implement comprehensive health checks using
      @nestjs/terminus for database, external services, and system resources.

### Frontend: Monorepo for Web & Mobile Apps (`MEQ-FND-03`)

- [ ] **FND-FE-NX-01**: Initialize frontend monorepo with Nx, a Next.js app ('website'), and a React
      Native app ('app').
- [ ] **FND-FE-STY-01**: Set up Tailwind CSS for the Next.js 'website' application.
- [ ] **FND-FE-STY-02**: Set up a compatible styling solution (e.g., `twrnc`) for the React Native
      'app'.
- [ ] **FND-FE-API-01**: Create a shared API client library (e.g., using Axios) for both frontends
      to communicate with the backend.
- [ ] **FND-FE-LNT-01**: Configure ESLint and Prettier for both Next.js and React Native apps,
      including eslint-plugin-security and custom rules to enforce FSA principles.
- [ ] **FND-FE-PWA-01**: [Web] Configure the Next.js app to be a fully compliant Progressive Web App
      (PWA) with a service worker and manifest.
- [ ] **FND-FE-W-ERR-01**: [Web] Implement a root React Error Boundary to catch rendering errors and
      show a graceful fallback UI.
- [ ] **FND-FE-A-ERR-01**: [App] Implement a root React Error Boundary for the React Native app to
      prevent crashes from rendering errors.
- [ ] **FND-FE-A-CRASH-01**: [App/Monitoring] Integrate Sentry or Firebase Crashlytics into the
      React Native app for real-time crash reporting.

### DevOps: CI/CD & Infrastructure Foundation (`MEQ-FND-04`)

- [ ] **FND-CI-BE-01**: [CI] Create GitHub Actions workflow for the backend to run lint, type-check,
      and unit tests on PRs.
- [ ] **FND-CI-SCA-01**: [CI/Security] Integrate and configure Software Composition Analysis (SCA)
      to scan for vulnerable dependencies and enforce governance policies (e.g., check for approved
      licenses and libraries).
- [ ] **FND-CI-SAST-01**: [CI/Security] Integrate Static Application Security Testing (SAST) scanner
      into the backend CI workflow.
- [ ] **FND-CI-SEC-CFG-01**: [CI/Security/DevOps] Procure and configure secrets (e.g., SNYK_TOKEN,
      SEMGREP_APP_TOKEN) for all CI security scanning tools.
- [ ] **FND-CI-FE-01**: [CI] Create GitHub Actions workflow for the frontend to run lint,
      type-check, and unit tests on PRs.
- [ ] **FND-IAC-01**: [IaC] Initialize Terraform project with a remote state backend (S3).
- [ ] **FND-IAC-02**: [IaC] Write Terraform scripts to provision core AWS networking (VPC, Subnets,
      Security Groups).
- [ ] **FND-IAC-03**: [IaC] Write Terraform scripts to provision a managed PostgreSQL database
      (RDS).
- [ ] **FND-CI-API-01**: [CI/API Gov] Set up pipeline to auto-generate and publish API docs from
      `openapi.yaml`.
- [ ] **FND-CI-ARCH-01**: [CI/Arch Gov] Add a CI step to validate Mermaid syntax in all project
      Markdown files.
- [ ] **FND-BE-EVT-01**: [BE/DevOps] Implement an event bus (e.g., AWS SNS/SQS) and define core
      domain events for cross-service communication.
- [ ] **FND-BE-GW-01**: [IaC/DevOps] Configure AWS API Gateway to manage, secure, and route traffic
      to the backend services.

### Data Governance & Lifecycle Management (`MEQ-FND-05`)

- [ ] **FND-DG-CLS-01**: [BE/DevOps] Implement a data classification system for all `schema.prisma`
      models (e.g., using comments).
- [ ] **FND-DG-LC-01**: [BE/DevOps] Develop and implement automated data retention and deletion
      scripts based on data classification.
- [ ] **FND-DG-QUAL-01**: [BE/DB] Establish and implement data quality checks and validation rules
      at the database/ORM layer.
- [ ] **FND-DG-DOC-01**: [Docs] Formally document data ownership and stewardship for core data
      domains in `06-Data_Governance_and_Privacy_Policy.md`.

### [FE] Core Design System & Component Library (`MEQ-FND-06`)

- [ ] **FND-FE-DS-01**: [UX] Implement design tokens (colors, typography, spacing) from UX
      Guidelines into Tailwind/Styling solution.
- [ ] **FND-FE-DS-02**: [UX] Build and document core UI components (Button, Input, Card, Modal) in
      Storybook for both web and mobile.
- [ ] **FND-FE-DS-03**: [UX] Build and document specialized financial components (PaymentPlanCard,
      ProgressIndicator, etc.).
- [ ] **FND-FE-DS-04**: [UX/A11y] Implement and test WCAG 2.1 AAA compliance across the component
      library.

### Test Infrastructure & Developer Experience (`MEQ-FND-07`)

- [ ] **FND-TEST-SIM-01**: [DevEx/Test] Develop a simulator/mock server for key Ethiopian payment
      providers (Telebirr, etc.) to enable robust integration testing.
- [ ] **FND-TEST-DATA-01**: [DevEx/Test] Create and maintain a seed script to populate databases
      with realistic, anonymized Ethiopian test data.

### Localization & API Documentation (`MEQ-FND-08`)

- [ ] **FND-I18N-01**: [BE/FE] Implement a robust internationalization (i18n) framework (e.g.,
      `react-i18next`) across both frontends and for backend error messages.
- [ ] **FND-I18N-02**: [FE] Create centralized i18n resource files for UI text and error messages,
      with initial translations for Amharic and English.
- [ ] **FND-DOCS-01**: [Docs/DevEx] Create and maintain Postman collections for all public-facing
      APIs, including environment setups for local and staging.
- [ ] **FND-DOCS-02**: [Docs/DevEx] Generate and publish code examples for API usage in key
      languages (JavaScript, Python) alongside API documentation.

---

## Stage 2: Authentication & User Management

### [BE] Implement Secure Authentication Service (`MEQ-AUTH-01`)

- [ ] **AUTH-BE-DB-01**: Design and finalize User, Profile, Credential, and Role schemas in
      `schema.prisma`.
- [ ] **AUTH-BE-DB-02**: Generate and apply the database migration for all authentication-related
      tables.
- [ ] **AUTH-BE-API-01**: Implement `/auth/register` endpoint with robust DTO validation for
      incoming data.
- [ ] **AUTH-BE-SEC-01**: Use `bcrypt` with a configurable salt round count for all password
      hashing.
- [ ] **AUTH-BE-API-02**: Implement `/auth/login` endpoint and protect it with rate limiting.
- [ ] **AUTH-BE-SEC-02**: Generate secure, signed JWTs with appropriate claims (userID, role, exp)
      using secrets from a secure vault.
- [ ] **AUTH-BE-API-03**: Implement `/auth/refresh` endpoint for secure JWT rotation.
- [ ] **AUTH-BE-API-04**: Implement `/auth/password-reset-request` endpoint to generate a secure,
      single-use token.
- [ ] **AUTH-BE-API-05**: Implement `/auth/password-reset-confirm` endpoint to validate token and
      update password.
- [ ] **AUTH-BE-API-06**: Implement `/users/me` endpoint to fetch the current authenticated user's
      profile.
- [ ] **AUTH-BE-GUA-01**: Implement a global NestJS Guard using Passport.js to validate JWTs on all
      protected routes.
- [ ] **AUTH-BE-GUA-02**: Implement a Role-Based Access Control (RBAC) Guard and decorator to
      restrict endpoints by user role.
- [ ] **AUTH-BE-LOG-01**: Implement detailed audit logging for all auth events (login success/fail,
      registration, pw_reset, role_change).
- [ ] **AUTH-BE-TEST-01**: [Test] Write unit tests for auth service logic (hashing, JWT signing,
      user creation).
- [ ] **AUTH-BE-TEST-02**: [Test] Write integration tests for all authentication endpoints,
      including error cases.
- [ ] **AUTH-BE-SEC-03**: [Security] Implement risk-based adaptive authentication (e.g., step-up MFA
      for high-risk logins from new devices).
- [ ] **AUTH-BE-SEC-04**: [Security/DB] Implement field-level encryption for all 'Level 1'
      classified data fields in the database.
- [ ] **AUTH-BE-SEC-05**: [BE/Security] Implement an OAuth 2.0 provider service (PKCE flow) for
      secure third-party and merchant integrations.

### [App] Build Authentication UI & Logic (`MEQ-AUTH-03`)

- [ ] **AUTH-FE-A-CMP-01**: Create shared, reusable auth components in React Native.
- [ ] **AUTH-FE-A-SCR-01**: Build Login screen with form validation (e.g., Formik/Yup) and API
      integration.
- [ ] **AUTH-FE-A-SCR-02**: Build Registration screen with form validation and API integration.
- [ ] **AUTH-FE-A-SCR-03**: Build 'Request Password Reset' screen.
- [ ] **AUTH-FE-A-SCR-04**: Build 'Confirm Password Reset' screen.
- [ ] **AUTH-FE-A-STATE-01**: Implement client-side session management (store/clear JWT in secure
      device storage).
- [ ] **AUTH-FE-A-STATE-02**: Implement global state management and navigation guards for
      authentication status.
- [ ] **AUTH-FE-A-TEST-01**: [Test] Write E2E tests for the full mobile login and registration user
      flows.

---

## Stage 3: Core BNPL & Payments

### [BE] Core BNPL & Payments Database Schema (`MEQ-BNPL-01`)

- [ ] **BNPL-BE-DB-01**: Design and finalize Loan, Installment, Transaction, and PaymentMethod
      schemas in `schema.prisma`.
- [ ] **BNPL-BE-DB-02**: Define relations between loan/transaction tables and the User model.
- [ ] **BNPL-BE-DB-03**: Generate and apply the database migration for all core BNPL tables.

### [BE] BNPL Business Logic & Services (`MEQ-BNPL-02`)

- [ ] **BNPL-BE-SVC-01**: Develop a service to calculate loan terms, interest (if any), and
      installment schedules.
- [ ] **BNPL-BE-SVC-02**: Implement the core service for loan applications, checking user
      eligibility (e.g., KYC status, credit score).
- [ ] **BNPL-BE-SVC-03**: Build the service to handle manual and automatic installment payments
      against a loan.
- [ ] **BNPL-BE-JOB-01**: Implement a scheduled job (cron) for sending payment reminders via
      email/SMS.
- [ ] **BNPL-BE-JOB-02**: Implement a scheduled job for identifying overdue payments and applying
      late fees according to business rules.
- [ ] **BNPL-BE-SEC-01**: [Security] Design a tamper-proof interest calculation engine with
      cryptographic verification of results.
- [ ] **BNPL-BE-AUDIT-01**: [Compliance] Implement immutable audit trails for all manual and
      automated changes to loan terms or interest rates.
- [ ] **BNPL-BE-TEST-01**: [Test] Write unit & integration tests for all BNPL services, covering
      calculations and state changes.
- [ ] **BNPL-BE-SVC-04**: [BE] Implement a circuit breaker pattern (e.g., using
      `nestjs-circuitbreaker`) for critical external dependencies like payment gateways.

### [BE] External Service Integrations (eKYC & Payments) (`MEQ-BNPL-03`)

- [ ] **BNPL-BE-INT-01**: Develop a robust NestJS service for the Fayda eKYC API, based on the
      contract in `11-Integration_Requirements.md`.
- [ ] **BNPL-BE-INT-02**: Develop a robust NestJS service for Telebirr, based on the contract in
      `11-Integration_Requirements.md`.
- [ ] **BNPL-BE-INT-03**: Implement webhook handlers for Telebirr to process payment confirmations
      asynchronously and securely.
- [ ] **BNPL-BE-INT-04**: Integrate an SMS service (e.g., Twilio) for sending notifications
      (reminders, confirmations).
- [ ] **BNPL-BE-TEST-02**: [Test] Write integration tests for integration services using mocks for
      external APIs.
- [ ] **BNPL-BE-INT-06**: Develop a robust NestJS service for HelloCash/CBE Birr integration.
- [ ] **BNPL-BE-INT-07**: Develop a robust NestJS service for ArifPay integration.
- [ ] **BNPL-BE-INT-08**: Develop a robust NestJS service for SantimPay integration.
- [ ] **BNPL-BE-INT-09**: Develop a robust NestJS service for Chapa payment gateway integration.

### [App] Consumer BNPL Features (`MEQ-BNPL-05`)

- [ ] **BNPL-FE-A-PAY-01**: Build UI for in-store QR code scanning and payment initiation.
- [ ] **BNPL-FE-A-KYC-01**: Develop the multi-screen flow for the eKYC identity verification process
      on mobile.
- [ ] **BNPL-FE-A-DSH-01**: Build loan management screens (history, upcoming payments).
- [ ] **BNPL-FE-A-DSH-02**: Implement UI and logic for making manual payments on the mobile app.
- [ ] **BNPL-FE-A-NOT-01**: Implement push notifications for payment reminders and confirmations.
- [ ] **BNPL-FE-A-TEST-01**: [Test] Write E2E tests (using Detox/Maestro) for the mobile QR code
      payment flow.
- [ ] **BNPL-FE-A-OFFLINE-01**: [App] Implement offline-first capabilities (local storage, data
      synchronization) for viewing loans and transaction history.
- [ ] **BNPL-FE-A-CMP-01**: [App/UX] Build a Payment Plan Comparison Tool to visualize costs for all
      four payment options.
- [ ] **BNPL-FE-A-CALC-01**: [App/UX] Build a Financial Impact Calculator to show total interest and
      payment schedules.

---

## Stage 4: Merchant & Admin Platforms

### [BE] Merchant & Admin Database Schema (`MEQ-MGT-01`)

- [ ] **MGT-BE-DB-01**: Design and finalize Merchant, Store, MerchantUser, Settlement, and AuditLog
      schemas in `schema.prisma`.
- [ ] **MGT-BE-DB-02**: Define relations for merchants to users, transactions, and settlements.
      Generate and apply migration.

### [BE] Merchant Onboarding & Management Services (`MEQ-MGT-02`)

- [ ] **MGT-BE-SVC-01**: Implement merchant application/onboarding endpoint.
- [ ] **MGT-BE-SVC-02**: Build service for admin to review and approve/reject merchant applications.
- [ ] **MGT-BE-SVC-03**: Implement service for merchants to manage their own profile and store
      details.
- [ ] **MGT-BE-SVC-04**: Develop service for merchants to generate and manage their API keys.

### [BE] Settlement & Admin Services (`MEQ-MGT-03`)

- [ ] **MGT-BE-SVC-05**: Develop a service to calculate merchant settlement amounts based on
      transactions, fees, and rolling reserves.
- [ ] **MGT-BE-JOB-01**: Implement a scheduled job to automatically process and record merchant
      settlements daily/weekly.
- [ ] **MGT-BE-ADM-01**: Build admin endpoints for managing consumer accounts (view details,
      block/unblock, view loans).
- [ ] **MGT-BE-ADM-02**: Build admin endpoints for managing system-level settings (e.g., BNPL plan
      terms, late fees).
- [ ] **MGT-BE-TEST-01**: [Test] Write unit & integration tests for merchant onboarding and
      settlement calculation logic.

### [BE] AML/CTF Compliance & Monitoring System (`MEQ-MGT-06`)

- [ ] **MGT-BE-AML-01**: [BE/Compliance] Integrate with a sanctions list provider for real-time
      customer and merchant screening.
- [ ] **MGT-BE-AML-02**: [BE/Compliance] Implement advanced fuzzy name matching for sanctions
      screening, tuned for Ethiopian names.
- [ ] **MGT-BE-AML-03**: [BE/Compliance] Implement a real-time transaction monitoring engine with
      configurable rules (e.g., threshold-based alerts).
- [ ] **MGT-BE-AML-04**: [BE/Compliance] Develop logic for enhanced due diligence (EDD) on high-risk
      customers.
- [ ] **MGT-BE-AML-05**: [BE/Compliance] Build a service to generate Suspicious Transaction Reports
      (STRs) for regulatory submission.

### [BE/FE] Customer Complaint & DSR Management (`MEQ-MGT-08`)

- [ ] **MGT-BE-CMP-01**: [BE/Compliance] Design and implement schema for tracking complaint and Data
      Subject Right (DSR) tickets.
- [ ] **MGT-BE-CMP-02**: [BE/API] Build API endpoints for users to submit complaints and DSR
      requests (access, erasure).
- [ ] **MGT-FE-W-CMP-01**: [Web/Admin] Build UI for support/compliance officers to manage, process,
      and resolve tickets.
- [ ] **MGT-FE-A-CMP-01**: [App/Web] Create UI for users to submit and view the status of their
      complaints/DSR requests.

---

## Stage 5: AI, Deployment & Launch

### [BE] AI/ML Credit Scoring Model Integration (`MEQ-AI-01`)

- [ ] **AI-BE-PIPE-01**: Develop data pipelines to extract and anonymize user/transaction data for
      model training.
- [ ] **AI-BE-SVC-01**: [BE/AI] Create a NestJS service to integrate with an external AI provider
      (e.g., OpenAI) for the initial credit scoring model.
- [ ] **AI-BE-INT-01**: Integrate the credit score into the BNPL application service to influence
      loan approvals and terms.
- [ ] **AI-BE-FAIR-01**: [AI/ML] Implement bias detection and fairness metrics monitoring for the
      credit scoring model.
- [ ] **AI-BE-XAI-01**: [AI/ML] Develop an 'Explainable AI' service to provide human-readable
      reasons for credit decisions.
- [ ] **AI-BE-MON-01**: Implement monitoring for the credit scoring service (latency, error rate,
      score distribution).

### Production Infrastructure & Deployment (`MEQ-DEP-01`)

- [ ] **DEP-IAC-01**: [IaC] Write Terraform scripts for production AWS resources (ECS Fargate, RDS
      with replicas, ElastiCache).
- [ ] **DEP-IAC-02**: [IaC] Configure production-grade security groups and network ACLs.
- [ ] **DEP-SEC-01**: [Security] Configure AWS Secrets Manager for all production secrets and
      integrate with the backend service.
- [ ] **DEP-SEC-02**: [Security/IaC] Provision and configure Hardware Security Modules (HSMs) or
      equivalent for primary key management.
- [ ] **DEP-SEC-03**: [DevOps/Security] Implement data masking and tokenization jobs for creating
      sanitized non-production environments.
- [ ] **DEP-CI-01**: [CI/CD] Create workflow to build and push versioned Docker images to ECR on
      merge to 'main'.
- [ ] **DEP-CI-02**: [CI/CD] Implement a deployment pipeline (e.g., using GitHub Actions) to deploy
      the new image to production via a blue/green or canary strategy.
- [ ] **DEP-LOG-01**: Set up centralized logging (CloudWatch) and monitoring dashboards/alerts
      (Datadog/Grafana) for the production environment.
- [ ] **DEP-LOG-02**: [DevOps/Monitoring] Configure dashboards and alerts for key error metrics
      (payment provider success rates, API endpoint error rates).
- [ ] **DEP-SEC-04**: [Security/DevOps] Configure the service mesh or API Gateway to enforce mTLS
      for all internal service-to-service communication.
- [ ] **DEP-IAC-08**: [IaC/DevOps] Provision and configure a managed Redis cluster (e.g.,
      ElastiCache) for caching and session storage.
- [ ] **DEP-IAC-05**: [IaC/DBA] Configure PgBouncer for production PostgreSQL connection pooling.
- [ ] **DEP-IAC-06**: [IaC/DevOps] Provision and configure an Elasticsearch cluster for product
      search and logging.
- [ ] **DEP-IAC-07**: [IaC/DevOps] Provision a Data Warehouse (e.g., Snowflake/BigQuery) and
      establish initial ETL pipelines.
- [ ] **DEP-DB-BCK-01**: [IaC/DBA] Define and implement automated backup policies, Point-in-Time
      Recovery, and regular restore testing for production databases.
- [ ] **DEP-CI-MOBILE-01**: [CI/CD/Mobile] Configure a CI/CD pipeline using Fastlane to automate
      building, signing, and deploying the mobile app.
- [ ] **DEP-APM-01**: [BE/DevOps] Integrate Datadog APM or another OpenTelemetry-compatible agent
      for distributed tracing across services.
- [ ] **DEP-ALERT-01**: [DevOps] Integrate monitoring/alerting systems with PagerDuty for on-call
      scheduling and escalation.
- [ ] **DEP-TEST-SYN-01**: [Test/DevOps] Create synthetic monitoring checks to test critical
      financial flows from an end-user perspective.
- [ ] **DEP-WAF-01**: [Security/IaC] Configure AWS WAF with OWASP Top 10 rules and custom rate-based
      rules tuned for Ethiopian traffic.
- [ ] **DEP-FGT-SEC-01**: [IaC/Fargate] Refine and enforce strict Security Group ingress/egress
      rules between Fargate services.
- [ ] **DEP-SEC-05**: [Security/IaC] Configure AWS SSM Session Manager for secure, auditable shell
      access, disabling direct SSH.
- [ ] **DEP-CDN-01**: [IaC/Web] Configure CloudFront distributions with geo-restriction to primarily
      serve traffic to Ethiopia.

### Pre-Launch Finalization & Go-Live (`MEQ-LNC-01`)

- [ ] **LNC-CFG-01**: [Ops/Compliance] Obtain and securely configure production credentials for all
      external services (Fayda, NBE, Payment Providers) in the production vault.
- [ ] **LNC-TEST-01**: [Test] Perform and sign-off on end-to-end testing of all critical user flows
      (consumer, merchant, admin).
- [ ] **LNC-TEST-02**: [Test] Conduct performance testing (K6) on critical endpoints, simulating
      Ethiopian network conditions (latency, bandwidth).
- [ ] **LNC-OPT-01**: [BE/FE] Implement data compression (Gzip) and image optimization strategies to
      improve performance on low-bandwidth networks.
- [ ] **LNC-SEC-01**: Conduct and review a full, third-party security audit and penetration test.
      Remediate critical findings.
- [ ] **LNC-SEC-02**: [Test/Security] Schedule recurring DAST scans (e.g., quarterly) using tools
      like OWASP ZAP against the staging environment.
- [ ] **LNC-DR-01**: Perform and document a successful disaster recovery drill (e.g., database
      restore, service failover).
- [ ] **LNC-DOC-01**: Prepare and publish final, versioned API documentation for merchants.
- [ ] **LNC-DOC-02**: [Docs] Write the full Incident Response Plan based on the placeholder,
      detailing roles, severity levels, and procedures.
- [ ] **LNC-OPS-01**: Finalize and train the support team on the incident response plan.
- [ ] **LNC-GO-01**: Execute the production deployment ('Go-Live').
- [ ] **LNC-GO-02**: Perform post-launch monitoring and health checks.
- [ ] **LNC-DOC-03**: [Docs] Write the full Disaster Recovery Plan based on the placeholder,
      detailing RTO/RPO, failover strategy, and restoration procedures.

### Cloud Cost Management & FinOps (`MEQ-DEP-02`)

- [ ] **DEP-FIN-01**: [FinOps/IaC] Implement and enforce the mandatory resource tagging policy using
      AWS Config rules to enable cost allocation.
- [ ] **DEP-FIN-02**: [FinOps/DevOps] Configure AWS Budgets with alerts for overall spend and for
      key services, notifying relevant teams.
- [ ] **DEP-FIN-03**: [FinOps/DevOps] Create dedicated FinOps dashboards in Grafana/Datadog to
      visualize cost drivers.
- [ ] **DEP-FIN-04**: [FinOps/IaC] Implement S3 Lifecycle Policies to automatically transition aged
      data to lower-cost storage tiers.
- [ ] **DEP-FIN-05**: [FinOps/IaC] Evaluate and use Graviton instances for production services to
      improve price-performance.
- [ ] **DEP-FIN-06**: [FinOps/IaC] Implement a strategy to use Spot Instances for non-critical,
      fault-tolerant workloads (e.g., CI/CD runners).
- [ ] **DEP-FIN-07**: [FinOps/Gov] Establish and document the monthly cost review process and
      schedule the first meeting.
- [ ] **DEP-FIN-08**: [AI/FinOps] Implement caching and detailed usage monitoring for AI service
      calls to manage token consumption costs.

### Performance Optimization & Monitoring (`MEQ-LNC-03`)

- [ ] **LNC-PERF-01**: [FE/Perf] Analyze production bundle composition to identify and optimize
      large dependencies.
- [ ] **LNC-PERF-02**: [FE/Perf] Implement a script or CI job to convert all project images to an
      optimized format like WebP.
- [ ] **LNC-PERF-03**: [FE/Perf] Implement progressive/lazy loading for all non-critical images and
      media assets.
- [ ] **LNC-PERF-04**: [App/Perf] Audit native modules for performance bottlenecks and identify
      candidates for native implementation.
- [ ] **LNC-PERF-05**: [App/Perf] Configure Metro bundler for optimal production performance,
      including enabling the Hermes engine.
- [ ] **LNC-PERF-06**: [Test/Perf] Expand real-device testing matrix to include a wider range of
      low-end Android devices common in Ethiopia.
- [ ] **LNC-PERF-07**: [App/Monitoring] Integrate a Real User Monitoring (RUM) tool (e.g., Firebase
      Performance) into the mobile app.
- [ ] **LNC-PERF-08**: [DevOps/Monitoring] Configure alerts for key performance regressions (LCP,
      API latency, etc.) in the production monitoring system.

### Compliance & Localization Testing (`MEQ-LNC-02`)

- [ ] **LNC-TEST-CMPL-01**: [Test/Compliance] Develop and run an automated test suite to validate
      NBE compliance requirements (disclosures, KYC data handling).
- [ ] **LNC-TEST-LOC-01**: [Test/FE] Create and execute a formal test plan for Amharic localization,
      covering UI layout, text, and data formats on web and mobile.

---

## Stage 6: Marketplace, Rewards & Financial Wellness

### [BE] Marketplace & Discovery Services (`MEQ-MKT-01`)

- [ ] **MKT-BE-DB-01**: Design and implement Product, Category, and MerchantProduct schemas in
      `schema.prisma`.
- [ ] **MKT-BE-API-01**: Implement APIs for product search, filtering, and categorization.
- [ ] **MKT-BE-API-02**: Build APIs for merchants to manage their product listings.

### [Web/App] Marketplace UI/UX (`MEQ-MKT-02`)

- [ ] **MKT-FE-UI-01**: Build product listing and product detail pages/screens for both web and app.
- [ ] **MKT-FE-UI-02**: Implement search and filtering UI on both platforms.
- [ ] **MKT-FE-UI-03**: Build Wishlist feature UI and logic.

### [BE] Rewards & Cashback Engine (`MEQ-REW-01`)

- [ ] **REW-BE-DB-01**: Design and implement CashbackLedger and RewardsProgram schemas in
      `schema.prisma`.
- [ ] **REW-BE-SVC-01**: Develop a rules engine to calculate cashback based on merchant, category,
      and promotions.

### [Web/App] Rewards UI/UX (`MEQ-REW-02`)

- [ ] **REW-FE-UI-01**: Build UI for users to view their cashback balance and transaction history.
- [ ] **REW-FE-UI-02**: Integrate 'apply cashback' option into the checkout flow.

### [BE] Financial Wellness Services (`MEQ-FIN-01`)

- [ ] **FIN-BE-SVC-01**: Implement a service to automatically categorize user spending.

### [Web/App] Financial Wellness Tools UI (`MEQ-FIN-02`)

- [ ] **FIN-FE-UI-01**: Build UI for spending analytics and budget tracking.
- [ ] **FIN-FE-UI-02**: Develop UI for creating and managing savings goals.
- [ ] **FIN-FE-UI-03**: Create Financial Education module with interactive content.

---

## Stage 7: Advanced Platforms & Premium Features

### [BE/FE] Meqenet Plus Subscription (`MEQ-PREM-01`)

- [ ] **PREM-BE-DB-01**: Add `Subscription` model to `schema.prisma` and link to User.
- [ ] **PREM-BE-SVC-01**: Implement service to manage subscription lifecycle (subscribe, renew,
      cancel) via Telebirr.
- [ ] **PREM-FE-UI-01**: Build UI for users to subscribe to Meqenet Plus and manage their
      subscription.

### [BE] Virtual Card Service Integration (`MEQ-VCC-01`)

- [ ] **VCC-BE-INT-01**: Integrate with a virtual card issuing provider's API.
- [ ] **VCC-BE-API-01**: Build APIs to create, fund, and manage the lifecycle of virtual cards.

### [Web/App] Virtual Card UI (`MEQ-VCC-02`)

- [ ] **VCC-FE-UI-01**: Build UI to securely display virtual card details.
- [ ] **VCC-FE-UI-02**: Develop UI to freeze/unfreeze card, view transactions, and manage limits.

### [BE] USSD Gateway Service (`MEQ-USD-01`)

- [ ] **USSD-BE-SVC-01**: Develop a service to handle USSD menu navigation and state management.
- [ ] **USSD-BE-INT-01**: Integrate with a mobile network operator's USSD gateway.

---

## Stage 8: Advanced AI & Personalization

### [BE] AI-Powered Recommendation Engines (`MEQ-AI-02`)

- [ ] **AI-BE-REC-01**: [BE/AI] Develop an AI-powered service for recommending the optimal payment
      plan based on user profile and purchase context.
- [ ] **AI-BE-REC-02**: [BE/AI] Integrate the payment plan recommendations into the checkout flow on
      both web and mobile.
- [ ] **AI-BE-REC-03**: [BE/AI] Build a product recommendation engine for the marketplace based on
      user behavior and financial profile.

### [BE] Dynamic Interest Rate & Financial Optimization (`MEQ-AI-03`)

- [ ] **AI-BE-RIO-01**: [BE/AI] Develop and train an ML model for dynamic interest rate optimization
      on 'Pay Over Time' loans.
- [ ] **AI-BE-CBO-01**: [BE/AI] Build a service to provide AI-powered cashback and rewards
      optimization suggestions to users.

### [BE] Merchant & Marketplace AI Services (`MEQ-AI-04`)

- [ ] **AI-BE-MRS-01**: [BE/AI] Develop an ML model for Merchant Risk Scoring to automate and
      enhance merchant onboarding.
- [ ] **AI-BE-MRS-02**: [BE/AI] Implement AI-driven inventory and pricing optimization suggestions
      for merchants.

---

## Stage 9: Ecosystem & Plugin Development

### [BE] Strategic Payment Integrations (`MEQ-ECO-02`)

- [ ] **ECO-BE-INT-01**: [BE/Integration] Develop a robust NestJS service for M-Pesa integration as
      a strategic ecosystem partner.

---

## Stage 10: Scalability & Performance Engineering

### [BE/DevOps] Near-Term Scalability Enhancements (`MEQ-SCL-01`)

- [ ] **SCL-CACHE-01**: Implement advanced, feature-specific caching strategies (e.g., Redis) for
      high-read domains like Marketplace.
- [ ] **SCL-COMMS-01**: Review and optimize cross-feature communication protocols to reduce latency
      and overhead.
- [ ] **SCL-AUTOSCALE-01**: Define and implement feature-specific Horizontal Pod Autoscaler (HPA)
      policies based on domain metrics.
- [ ] **SCL-DB-PARTITION-01**: Implement database partitioning (e.g., by date/hash) for high-volume
      tables like 'transactions' and 'analytics_events'.
- [ ] **SCL-MONITOR-01**: Implement comprehensive, per-domain monitoring dashboards to track
      feature-specific scalability KPIs.

### [Arch] Mid-Term Scalability Initiatives (`MEQ-SCL-02`)

- [ ] **SCL-MICROSERVICE-01**: Evaluate decomposition of largest feature domains (e.g., Marketplace)
      into finer-grained microservices.
- [ ] **SCL-EVENTSOURCE-01**: Investigate and potentially implement event sourcing for complex,
      cross-feature state management.
- [ ] **SCL-CDN-01**: Implement feature-specific CDN optimization rules for assets based on usage
      patterns.
- [ ] **SCL-DB-SHARD-01**: Evaluate and plan for database sharding for hyper-growth features like
      Marketplace and Analytics.
- [ ] **SCL-PREDICT-01**: Develop a predictive scaling model based on historical data and Ethiopian
      market patterns (e.g., holidays).

### [Arch] Long-Term Scalability Research (`MEQ-SCL-03`)

- [ ] **SCL-REGION-01**: Investigate and create a plan for potential multi-region, active-active
      deployment.
- [ ] **SCL-AI-CAPACITY-01**: Research and design an AI-driven capacity planning and autonomous
      scaling system.

---

## Stage 11: Continuous Improvement & Governance

### [Gov] Feature Expansion Framework Setup (`MEQ-GOV-01`)

- [ ] **GOV-TPL-01**: Create the official 'Feature Proposal' issue template in the GitHub repository
      based on 32-Feature_Expansion.md.
- [ ] **GOV-PROCESS-01**: Establish and document the process for using the Feature Prioritization
      Framework for all new feature requests.
- [ ] **GOV-DOCS-01**: Create a process and assign ownership for updating user, API, and internal
      documentation when features are added or changed.

### [Gov] Cross-Functional Process Implementation (`MEQ-GOV-02`)

- [ ] **GOV-FIN-01**: Establish a formal review process for all new features that have financial
      logic to ensure consistency and NBE compliance.
- [ ] **GOV-SEC-01**: Mandate and formalize a threat modeling session as a required step for any new
      feature proposal.
- [ ] **GOV-UX-01**: Establish a formal user research process for major new features, specifically
      targeting Ethiopian user segments.

---

## Stage 12: Accessibility & Inclusion

### [A11y] Foundational Accessibility Audit & Setup (`MEQ-A11Y-01`)

- [ ] **A11Y-AUDIT-01**: Perform an initial automated accessibility audit (Axe/Lighthouse) on web
      and app to establish a baseline.
- [ ] **A11Y-CI-01**: Integrate automated accessibility checks (e.g., jest-axe) into the CI
      pipelines for both frontend projects.
- [ ] **A11Y-DOCS-01**: Create and publish a public-facing Accessibility Statement on the website.
- [ ] **A11Y-DS-01**: Incorporate accessibility requirements and documentation directly into the
      shared Design System (Storybook).

### [A11y] Implementation & Remediation (`MEQ-A11Y-02`)

- [ ] **A11Y-KB-01**: Perform a full keyboard-only navigation test of all critical user flows on
      both web and app.
- [ ] **A11Y-SR-01**: Conduct manual screen reader testing (VoiceOver, TalkBack) for primary user
      journeys.
- [ ] **A11Y-COLOR-01**: Audit and remediate all color contrast issues to ensure WCAG 2.1 AA
      compliance.
- [ ] **A11Y-FORMS-01**: Ensure all form fields across all platforms have proper labels,
      instructions, and accessible error handling.

### [A11y] Advanced & Ongoing Processes (`MEQ-A11Y-03`)

- [ ] **A11Y-USER-TEST-01**: Plan and conduct the first round of usability testing that includes
      users with disabilities.
- [ ] **A11Y-TRAINING-01**: Develop and deliver accessibility training for all designers and
      developers.
- [ ] **A11Y-I18N-01**: Verify Amharic language support with screen readers and ensure proper
      right-to-left UI handling where needed.

---
