# Master Development Progress

_Last updated: 2025-06-23 21:14:16 UTC_

This document provides a master view of all development tasks for the Meqenet platform. It is
auto-generated from `tasks.yaml`.

## Overall Progress

**0 / 295 Sub-tasks Completed**

`[----------------------------------------] 0.00%`

## Stage 1: Foundation & Setup

### 🚀 Project Governance and Git Setup (`MEQ-FND-01`)

- [ ] **FND-GIT-01**: Initialize Git repository on GitHub/GitLab.
  - **Context**: `docs/Stage 2 -Development/21-Code_Review.md`
- [ ] **FND-GIT-02**: Define and enforce branch protection rules for 'main' and 'develop' (require
      PRs, passing checks).
  - **Context**: `docs/Stage 2 -Development/21-Code_Review.md`
- [ ] **FND-GIT-03**: Create repository issue templates for bugs, features, and chores.
  - **Context**: `docs/Stage 1 - Foundation/01-Architecture_Governance.md`
- [ ] **FND-GIT-04**: [DevEx/Security] Implement pre-commit/pre-push hooks using Husky to run local
      security and lint checks before code is pushed.
  - **Context**: `docs/Stage 3 - Deployment & Operations/30-Dependency_Management.md`
- [ ] **FND-DEVEX-01**: [DevEx] Create scripts and detailed documentation to automate and streamline
      local development environment setup.
  - **Context**: `docs/Stage 2 -Development/16-Developer_Onboarding.md`
- [ ] **FND-DEVEX-02**: [DevEx] Create and maintain the standard `cookiecutter` service template for
      bootstrapping new microservices.
  - **Context**: `docs/Stage 2 -Development/16-Developer_Onboarding.md`
- [ ] **FND-GOV-02**: [Gov] Create template files for `REVIEWERS.md` and feature-specific
      `REVIEW_CHECKLIST.md` files as per code review guidelines.
  - **Context**: `docs/Stage 2 -Development/21-Code_Review.md`

### 🚀 Backend: Microservices Monorepo Setup (`MEQ-FND-02`)

- [ ] **FND-BE-NX-01**: Initialize backend monorepo with Nx. Create initial applications for the API
      Gateway and the first core microservice (e.g., 'auth-service').
  - **Context**: `docs/Stage 1 - Foundation/08-Architecture.md`,
    `docs/Stage 1 - Foundation/09-Tech_Stack.md`
- [ ] **FND-BE-DB-01**: Integrate Prisma ORM, configure database connection URLs via environment
      variables.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`
- [ ] **FND-BE-CFG-01**: Implement a global configuration service (e.g., `@nestjs/config`) to manage
      all environment variables.
  - **Context**: `docs/Stage 1 - Foundation/08-Architecture.md`
- [ ] **FND-BE-LOG-01**: Set up a structured logger (e.g., Pino) for application-wide logging.
  - **Context**: `docs/Stage 3 - Deployment & Operations/25-Monitoring_And_Logging.md`
- [ ] **FND-BE-ERR-01**: Implement a global exception filter for consistent, structured error
      responses.
  - **Context**: `docs/Stage 2 -Development/20-Error_Handling.md`
- [ ] **FND-BE-ERR-02**: [BE] Implement the custom exception hierarchy as defined in
      `20-Error_Handling.md` (e.g., `FinancialServiceException`).
  - **Context**: `docs/Stage 2 -Development/20-Error_Handling.md`
- [ ] **FND-BE-LNT-01**: Configure ESLint and Prettier with strict rules, including
      eslint-plugin-security, and custom rules to enforce FSA principles in the backend monorepo.
  - **Context**: `docs/Stage 2 -Development/21-Code_Review.md`,
    `docs/Stage 3 - Deployment & Operations/23-Deployment.md`,
    `docs/Stage 3 - Deployment & Operations/30-Dependency_Management.md`
- [ ] **FND-BE-API-01**: [API Gov] Create the initial `openapi.yaml` file defining info, servers,
      and JWT security scheme.
  - **Context**: `docs/Stage 1 - Foundation/02-API_Specification_and_Governance.md`
- [ ] **FND-BE-API-02**: [API Gov] Configure NestJS for URI-based versioning (e.g., '/api/v1').
  - **Context**: `docs/Stage 1 - Foundation/02-API_Specification_and_Governance.md`
- [ ] **FND-BE-ERD-01**: [Arch Gov] Create initial database ERD diagrams for each core
      microservice's domain (e.g., User, Payments) as Mermaid diagrams in `10-Database.md`.
  - **Context**: `docs/Stage 1 - Foundation/01-Architecture_Governance.md`,
    `docs/Stage 1 - Foundation/10-Database.md`
- [ ] **FND-BE-METRICS-01**: [BE/Monitoring] Instrument backend services with a Prometheus client to
      expose custom business and application metrics.
  - **Context**: `docs/Stage 3 - Deployment & Operations/25-Monitoring_And_Logging.md`
- [ ] **FND-BE-SEC-01**: [BE/Security] Configure Helmet middleware for security headers (HSTS, CSP,
      X-Frame-Options, etc.) across all services.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **FND-BE-SEC-02**: [BE/Security] Implement comprehensive input validation framework using
      Zod/Joi with sanitization for all API endpoints.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **FND-BE-SEC-03**: [BE/Security] Configure CORS policies with strict origin controls and
      secure defaults for all services.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **FND-BE-SEC-04**: [BE/Security] Implement comprehensive rate limiting and DDoS protection
      using ThrottlerGuard across all API endpoints.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **FND-BE-SEC-05**: [BE/Security] Implement structured request/response logging with audit
      trails for all API calls (excluding sensitive data).
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`,
    `docs/Stage 3 - Deployment & Operations/25-Monitoring_And_Logging.md`
- [ ] **FND-BE-CFG-02**: [BE/Config] Implement environment variable validation using Zod schemas to
      ensure all required config is present and valid.
  - **Context**: `docs/Stage 1 - Foundation/08-Architecture.md`,
    `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **FND-BE-HEALTH-01**: [BE/Monitoring] Implement comprehensive health checks using
      @nestjs/terminus for database, external services, and system resources.
  - **Context**: `docs/Stage 1 - Foundation/05-Compliance_Framework.md`,
    `docs/Stage 3 - Deployment & Operations/25-Monitoring_And_Logging.md`

### 🚀 Frontend: Monorepo for Web & Mobile Apps (`MEQ-FND-03`)

- [ ] **FND-FE-NX-01**: Initialize frontend monorepo with Nx, a Next.js app ('website'), and a React
      Native app ('app').
  - **Context**: `docs/Stage 1 - Foundation/08-Architecture.md`,
    `docs/Stage 1 - Foundation/09-Tech_Stack.md`
- [ ] **FND-FE-STY-01**: Set up Tailwind CSS for the Next.js 'website' application.
  - **Context**: `docs/Stage 1 - Foundation/12-User_Experience_Guidelines.md`
- [ ] **FND-FE-STY-02**: Set up a compatible styling solution (e.g., `twrnc`) for the React Native
      'app'.
  - **Context**: `docs/Stage 1 - Foundation/12-User_Experience_Guidelines.md`
- [ ] **FND-FE-API-01**: Create a shared API client library (e.g., using Axios) for both frontends
      to communicate with the backend.
  - **Context**: `docs/Stage 1 - Foundation/02-API_Specification_and_Governance.md`
- [ ] **FND-FE-LNT-01**: Configure ESLint and Prettier for both Next.js and React Native apps,
      including eslint-plugin-security and custom rules to enforce FSA principles.
  - **Context**: `docs/Stage 2 -Development/21-Code_Review.md`,
    `docs/Stage 1 - Foundation/08-Architecture.md`,
    `docs/Stage 3 - Deployment & Operations/30-Dependency_Management.md`
- [ ] **FND-FE-PWA-01**: [Web] Configure the Next.js app to be a fully compliant Progressive Web App
      (PWA) with a service worker and manifest.
  - **Context**: `docs/Stage 1 - Foundation/08-Architecture.md`
- [ ] **FND-FE-W-ERR-01**: [Web] Implement a root React Error Boundary to catch rendering errors and
      show a graceful fallback UI.
  - **Context**: `docs/Stage 2 -Development/20-Error_Handling.md`
- [ ] **FND-FE-A-ERR-01**: [App] Implement a root React Error Boundary for the React Native app to
      prevent crashes from rendering errors.
  - **Context**: `docs/Stage 2 -Development/20-Error_Handling.md`
- [ ] **FND-FE-A-CRASH-01**: [App/Monitoring] Integrate Sentry or Firebase Crashlytics into the
      React Native app for real-time crash reporting.
  - **Context**: `docs/Stage 3 - Deployment & Operations/25-Monitoring_And_Logging.md`

### 🚀 DevOps: CI/CD & Infrastructure Foundation (`MEQ-FND-04`)

- [ ] **FND-CI-BE-01**: [CI] Create GitHub Actions workflow for the backend to run lint, type-check,
      and unit tests on PRs.
  - **Context**: `docs/Stage 3 - Deployment & Operations/23-Deployment.md`
- [ ] **FND-CI-SCA-01**: [CI/Security] Integrate and configure Software Composition Analysis (SCA)
      to scan for vulnerable dependencies and enforce governance policies (e.g., check for approved
      licenses and libraries).
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`,
    `docs/Stage 3 - Deployment & Operations/30-Dependency_Management.md`
- [ ] **FND-CI-SAST-01**: [CI/Security] Integrate Static Application Security Testing (SAST) scanner
      into the backend CI workflow.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **FND-CI-SEC-CFG-01**: [CI/Security/DevOps] Procure and configure secrets (e.g., SNYK_TOKEN,
      SEMGREP_APP_TOKEN) for all CI security scanning tools.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`,
    `docs/Stage 3 - Deployment & Operations/23-Deployment.md`
- [ ] **FND-CI-FE-01**: [CI] Create GitHub Actions workflow for the frontend to run lint,
      type-check, and unit tests on PRs.
  - **Context**: `docs/Stage 3 - Deployment & Operations/23-Deployment.md`
- [ ] **FND-IAC-01**: [IaC] Initialize Terraform project with a remote state backend (S3).
  - **Context**: `docs/Stage 3 - Deployment & Operations/24-Infrastructure.md`
- [ ] **FND-IAC-02**: [IaC] Write Terraform scripts to provision core AWS networking (VPC, Subnets,
      Security Groups).
  - **Context**: `docs/Stage 3 - Deployment & Operations/24-Infrastructure.md`,
    `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **FND-IAC-03**: [IaC] Write Terraform scripts to provision a managed PostgreSQL database
      (RDS).
  - **Context**: `docs/Stage 3 - Deployment & Operations/24-Infrastructure.md`
- [ ] **FND-CI-API-01**: [CI/API Gov] Set up pipeline to auto-generate and publish API docs from
      `openapi.yaml`.
  - **Context**: `docs/Stage 1 - Foundation/02-API_Specification_and_Governance.md`,
    `docs/Stage 3 - Deployment & Operations/23-Deployment.md`
- [ ] **FND-CI-ARCH-01**: [CI/Arch Gov] Add a CI step to validate Mermaid syntax in all project
      Markdown files.
  - **Context**: `docs/Stage 1 - Foundation/01-Architecture_Governance.md`,
    `docs/Stage 3 - Deployment & Operations/23-Deployment.md`
- [ ] **FND-BE-EVT-01**: [BE/DevOps] Implement an event bus (e.g., AWS SNS/SQS) and define core
      domain events for cross-service communication.
  - **Context**: `docs/Stage 1 - Foundation/08-Architecture.md`
- [ ] **FND-BE-GW-01**: [IaC/DevOps] Configure AWS API Gateway to manage, secure, and route traffic
      to the backend services.
  - **Context**: `docs/Stage 1 - Foundation/08-Architecture.md`

### 🚀 Data Governance & Lifecycle Management (`MEQ-FND-05`)

- [ ] **FND-DG-CLS-01**: [BE/DevOps] Implement a data classification system for all `schema.prisma`
      models (e.g., using comments).
  - **Context**: `docs/Stage 1 - Foundation/06-Data_Governance_and_Privacy_Policy.md`
- [ ] **FND-DG-LC-01**: [BE/DevOps] Develop and implement automated data retention and deletion
      scripts based on data classification.
  - **Context**: `docs/Stage 1 - Foundation/06-Data_Governance_and_Privacy_Policy.md`,
    `docs/Stage 1 - Foundation/05-Compliance_Framework.md`
- [ ] **FND-DG-QUAL-01**: [BE/DB] Establish and implement data quality checks and validation rules
      at the database/ORM layer.
  - **Context**: `docs/Stage 1 - Foundation/06-Data_Governance_and_Privacy_Policy.md`
- [ ] **FND-DG-DOC-01**: [Docs] Formally document data ownership and stewardship for core data
      domains in `06-Data_Governance_and_Privacy_Policy.md`.
  - **Context**: `docs/Stage 1 - Foundation/06-Data_Governance_and_Privacy_Policy.md`

### 🚀 [FE] Core Design System & Component Library (`MEQ-FND-06`)

- [ ] **FND-FE-DS-01**: [UX] Implement design tokens (colors, typography, spacing) from UX
      Guidelines into Tailwind/Styling solution.
  - **Context**: `docs/Stage 1 - Foundation/12-User_Experience_Guidelines.md`
- [ ] **FND-FE-DS-02**: [UX] Build and document core UI components (Button, Input, Card, Modal) in
      Storybook for both web and mobile.
  - **Context**: `docs/Stage 1 - Foundation/12-User_Experience_Guidelines.md`
- [ ] **FND-FE-DS-03**: [UX] Build and document specialized financial components (PaymentPlanCard,
      ProgressIndicator, etc.).
  - **Context**: `docs/Stage 1 - Foundation/12-User_Experience_Guidelines.md`
- [ ] **FND-FE-DS-04**: [UX/A11y] Implement and test WCAG 2.1 AAA compliance across the component
      library.
  - **Context**: `docs/Stage 1 - Foundation/12-User_Experience_Guidelines.md`

### 🚀 Test Infrastructure & Developer Experience (`MEQ-FND-07`)

- [ ] **FND-TEST-SIM-01**: [DevEx/Test] Develop a simulator/mock server for key Ethiopian payment
      providers (Telebirr, etc.) to enable robust integration testing.
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`
- [ ] **FND-TEST-DATA-01**: [DevEx/Test] Create and maintain a seed script to populate databases
      with realistic, anonymized Ethiopian test data.
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`

### 🚀 Localization & API Documentation (`MEQ-FND-08`)

- [ ] **FND-I18N-01**: [BE/FE] Implement a robust internationalization (i18n) framework (e.g.,
      `react-i18next`) across both frontends and for backend error messages.
  - **Context**: `docs/Stage 2 -Development/19-API_Documentation_Strategy.md`,
    `docs/Stage 2 -Development/20-Error_Handling.md`
- [ ] **FND-I18N-02**: [FE] Create centralized i18n resource files for UI text and error messages,
      with initial translations for Amharic and English.
  - **Context**: `docs/Stage 2 -Development/20-Error_Handling.md`
- [ ] **FND-DOCS-01**: [Docs/DevEx] Create and maintain Postman collections for all public-facing
      APIs, including environment setups for local and staging.
  - **Context**: `docs/Stage 2 -Development/19-API_Documentation_Strategy.md`
- [ ] **FND-DOCS-02**: [Docs/DevEx] Generate and publish code examples for API usage in key
      languages (JavaScript, Python) alongside API documentation.
  - **Context**: `docs/Stage 2 -Development/19-API_Documentation_Strategy.md`

---

## Stage 2: Authentication & User Management

### 🚀 [BE] Implement Secure Authentication Service (`MEQ-AUTH-01`)

- [ ] **AUTH-BE-DB-01**: Design and finalize User, Profile, Credential, and Role schemas in
      `schema.prisma`.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`,
    `docs/Stage 1 - Foundation/01-Architecture_Governance.md`
- [ ] **AUTH-BE-DB-02**: Generate and apply the database migration for all authentication-related
      tables.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`
- [ ] **AUTH-BE-API-01**: Implement `/auth/register` endpoint with robust DTO validation for
      incoming data.
  - **Context**: `docs/Stage 1 - Foundation/02-API_Specification_and_Governance.md`
- [ ] **AUTH-BE-SEC-01**: Use `bcrypt` with a configurable salt round count for all password
      hashing.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **AUTH-BE-API-02**: Implement `/auth/login` endpoint and protect it with rate limiting.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **AUTH-BE-SEC-02**: Generate secure, signed JWTs with appropriate claims (userID, role, exp)
      using secrets from a secure vault.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **AUTH-BE-API-03**: Implement `/auth/refresh` endpoint for secure JWT rotation.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **AUTH-BE-API-04**: Implement `/auth/password-reset-request` endpoint to generate a secure,
      single-use token.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **AUTH-BE-API-05**: Implement `/auth/password-reset-confirm` endpoint to validate token and
      update password.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **AUTH-BE-API-06**: Implement `/users/me` endpoint to fetch the current authenticated user's
      profile.
  - **Context**: `docs/Stage 1 - Foundation/02-API_Specification_and_Governance.md`
- [ ] **AUTH-BE-GUA-01**: Implement a global NestJS Guard using Passport.js to validate JWTs on all
      protected routes.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **AUTH-BE-GUA-02**: Implement a Role-Based Access Control (RBAC) Guard and decorator to
      restrict endpoints by user role.
  - **Context**: `docs/Stage 1 - Foundation/01-Architecture_Governance.md`
- [ ] **AUTH-BE-LOG-01**: Implement detailed audit logging for all auth events (login success/fail,
      registration, pw_reset, role_change).
  - **Context**: `docs/Stage 3 - Deployment & Operations/25-Monitoring_And_Logging.md`,
    `docs/Stage 1 - Foundation/05-Compliance_Framework.md`
- [ ] **AUTH-BE-TEST-01**: [Test] Write unit tests for auth service logic (hashing, JWT signing,
      user creation).
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`
- [ ] **AUTH-BE-TEST-02**: [Test] Write integration tests for all authentication endpoints,
      including error cases.
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`
- [ ] **AUTH-BE-SEC-03**: [Security] Implement risk-based adaptive authentication (e.g., step-up MFA
      for high-risk logins from new devices).
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **AUTH-BE-SEC-04**: [Security/DB] Implement field-level encryption for all 'Level 1'
      classified data fields in the database.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`,
    `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **AUTH-BE-SEC-05**: [BE/Security] Implement an OAuth 2.0 provider service (PKCE flow) for
      secure third-party and merchant integrations.
  - **Context**: `docs/Stage 2 -Development/19-API_Documentation_Strategy.md`

### 🌐 [Web] Build Authentication UI & Logic (`MEQ-AUTH-02`)

- [ ] **AUTH-FE-W-CMP-01**: Create shared, reusable auth components (Input, Button, Form, Spinner)
      with Storybook.
  - **Context**: `docs/Stage 1 - Foundation/12-User_Experience_Guidelines.md`
- [ ] **AUTH-FE-W-PG-01**: Build Login page with form validation (e.g., Zod) and API integration.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **AUTH-FE-W-PG-02**: Build Registration page with form validation and API integration.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **AUTH-FE-W-PG-03**: Build 'Request Password Reset' page.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **AUTH-FE-W-PG-04**: Build 'Confirm Password Reset' page.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **AUTH-FE-W-STATE-01**: Implement client-side session management (store/clear JWT in secure
      HttpOnly cookie).
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **AUTH-FE-W-STATE-02**: Implement global state management for user authentication status
      (e.g., React Context/Zustand).
  - **Context**: `docs/Stage 1 - Foundation/08-Architecture.md`
- [ ] **AUTH-FE-W-TEST-01**: [Test] Write E2E tests for the full login, registration, and password
      reset user flows.
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`

### 📱 [App] Build Authentication UI & Logic (`MEQ-AUTH-03`)

- [ ] **AUTH-FE-A-CMP-01**: Create shared, reusable auth components in React Native.
  - **Context**: `docs/Stage 1 - Foundation/12-User_Experience_Guidelines.md`
- [ ] **AUTH-FE-A-SCR-01**: Build Login screen with form validation (e.g., Formik/Yup) and API
      integration.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **AUTH-FE-A-SCR-02**: Build Registration screen with form validation and API integration.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **AUTH-FE-A-SCR-03**: Build 'Request Password Reset' screen.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **AUTH-FE-A-SCR-04**: Build 'Confirm Password Reset' screen.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **AUTH-FE-A-STATE-01**: Implement client-side session management (store/clear JWT in secure
      device storage).
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **AUTH-FE-A-STATE-02**: Implement global state management and navigation guards for
      authentication status.
  - **Context**: `docs/Stage 1 - Foundation/08-Architecture.md`
- [ ] **AUTH-FE-A-TEST-01**: [Test] Write E2E tests for the full mobile login and registration user
      flows.
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`

---

## Stage 3: Core BNPL & Payments

### 🚀 [BE] Core BNPL & Payments Database Schema (`MEQ-BNPL-01`)

- [ ] **BNPL-BE-DB-01**: Design and finalize Loan, Installment, Transaction, and PaymentMethod
      schemas in `schema.prisma`.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`,
    `docs/Stage 1 - Foundation/03-Business_Model.md`
- [ ] **BNPL-BE-DB-02**: Define relations between loan/transaction tables and the User model.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`
- [ ] **BNPL-BE-DB-03**: Generate and apply the database migration for all core BNPL tables.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`

### 🚀 [BE] BNPL Business Logic & Services (`MEQ-BNPL-02`)

- [ ] **BNPL-BE-SVC-01**: Develop a service to calculate loan terms, interest (if any), and
      installment schedules.
  - **Context**: `docs/Stage 1 - Foundation/03-Business_Model.md`
- [ ] **BNPL-BE-SVC-02**: Implement the core service for loan applications, checking user
      eligibility (e.g., KYC status, credit score).
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`,
    `docs/Stage 2 -Development/18-AI_Integration.md`
- [ ] **BNPL-BE-SVC-03**: Build the service to handle manual and automatic installment payments
      against a loan.
  - **Context**: `docs/Stage 1 - Foundation/03-Business_Model.md`
- [ ] **BNPL-BE-JOB-01**: Implement a scheduled job (cron) for sending payment reminders via
      email/SMS.
  - **Context**: `docs/Stage 1 - Foundation/03-Business_Model.md`
- [ ] **BNPL-BE-JOB-02**: Implement a scheduled job for identifying overdue payments and applying
      late fees according to business rules.
  - **Context**: `docs/Stage 1 - Foundation/03-Business_Model.md`
- [ ] **BNPL-BE-SEC-01**: [Security] Design a tamper-proof interest calculation engine with
      cryptographic verification of results.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **BNPL-BE-AUDIT-01**: [Compliance] Implement immutable audit trails for all manual and
      automated changes to loan terms or interest rates.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`,
    `docs/Stage 1 - Foundation/05-Compliance_Framework.md`
- [ ] **BNPL-BE-TEST-01**: [Test] Write unit & integration tests for all BNPL services, covering
      calculations and state changes.
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`
- [ ] **BNPL-BE-SVC-04**: [BE] Implement a circuit breaker pattern (e.g., using
      `nestjs-circuitbreaker`) for critical external dependencies like payment gateways.
  - **Context**: `docs/Stage 2 -Development/20-Error_Handling.md`

### 🚀 [BE] External Service Integrations (eKYC & Payments) (`MEQ-BNPL-03`)

- [ ] **BNPL-BE-INT-01**: Develop a robust NestJS service for the Fayda eKYC API, based on the
      contract in `11-Integration_Requirements.md`.
  - **Context**: `docs/Stage 1 - Foundation/11-Integration_Requirements.md`
- [ ] **BNPL-BE-INT-02**: Develop a robust NestJS service for Telebirr, based on the contract in
      `11-Integration_Requirements.md`.
  - **Context**: `docs/Stage 1 - Foundation/11-Integration_Requirements.md`,
    `docs/Stage 2 -Development/20-Error_Handling.md`
- [ ] **BNPL-BE-INT-03**: Implement webhook handlers for Telebirr to process payment confirmations
      asynchronously and securely.
  - **Context**: `docs/Stage 1 - Foundation/11-Integration_Requirements.md`,
    `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **BNPL-BE-INT-04**: Integrate an SMS service (e.g., Twilio) for sending notifications
      (reminders, confirmations).
  - **Context**: `docs/Stage 1 - Foundation/11-Integration_Requirements.md`
- [ ] **BNPL-BE-TEST-02**: [Test] Write integration tests for integration services using mocks for
      external APIs.
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`
- [ ] **BNPL-BE-INT-06**: Develop a robust NestJS service for HelloCash/CBE Birr integration.
  - **Context**: `docs/Stage 1 - Foundation/11-Integration_Requirements.md`,
    `docs/Stage 1 - Foundation/03-Business_Model.md`
- [ ] **BNPL-BE-INT-07**: Develop a robust NestJS service for ArifPay integration.
  - **Context**: `docs/Stage 1 - Foundation/11-Integration_Requirements.md`
- [ ] **BNPL-BE-INT-08**: Develop a robust NestJS service for SantimPay integration.
  - **Context**: `docs/Stage 1 - Foundation/11-Integration_Requirements.md`
- [ ] **BNPL-BE-INT-09**: Develop a robust NestJS service for Chapa payment gateway integration.
  - **Context**: `docs/Stage 1 - Foundation/11-Integration_Requirements.md`

### 🌐 [Web] Consumer BNPL Portal (`MEQ-BNPL-04`)

- [ ] **BNPL-FE-W-CHK-01**: Build UI for selecting Meqenet as a payment option within a partner's
      checkout flow.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **BNPL-FE-W-KYC-01**: Develop the multi-step UI for the eKYC identity verification process.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **BNPL-FE-W-DSH-01**: Build consumer dashboard page for viewing active and past loans.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **BNPL-FE-W-DSH-02**: Develop UI for displaying detailed installment schedules for each loan.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **BNPL-FE-W-DSH-03**: Implement UI and logic for making manual payments on installments.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **BNPL-FE-W-EXPORT-01**: [Web] Implement export functionality (PDF, CSV) for the transaction
      history page.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **BNPL-FE-W-TEST-01**: [Test] Write E2E tests for the web-based loan application and payment
      process.
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`
- [ ] **BNPL-FE-W-CMP-01**: [Web/UX] Build a Payment Plan Comparison Tool to visualize costs for all
      four payment options.
  - **Context**: `docs/Stage 2 -Development/15-Development_Plan.md`
- [ ] **BNPL-FE-W-CALC-01**: [Web/UX] Build a Financial Impact Calculator to show total interest and
      payment schedules.
  - **Context**: `docs/Stage 2 -Development/15-Development_Plan.md`

### 📱 [App] Consumer BNPL Features (`MEQ-BNPL-05`)

- [ ] **BNPL-FE-A-PAY-01**: Build UI for in-store QR code scanning and payment initiation.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **BNPL-FE-A-KYC-01**: Develop the multi-screen flow for the eKYC identity verification process
      on mobile.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **BNPL-FE-A-DSH-01**: Build loan management screens (history, upcoming payments).
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **BNPL-FE-A-DSH-02**: Implement UI and logic for making manual payments on the mobile app.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **BNPL-FE-A-NOT-01**: Implement push notifications for payment reminders and confirmations.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **BNPL-FE-A-TEST-01**: [Test] Write E2E tests (using Detox/Maestro) for the mobile QR code
      payment flow.
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`,
    `docs/Stage 1 - Foundation/09-Tech_Stack.md`
- [ ] **BNPL-FE-A-OFFLINE-01**: [App] Implement offline-first capabilities (local storage, data
      synchronization) for viewing loans and transaction history.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`,
    `docs/Stage 1 - Foundation/08-Architecture.md`
- [ ] **BNPL-FE-A-CMP-01**: [App/UX] Build a Payment Plan Comparison Tool to visualize costs for all
      four payment options.
  - **Context**: `docs/Stage 2 -Development/15-Development_Plan.md`
- [ ] **BNPL-FE-A-CALC-01**: [App/UX] Build a Financial Impact Calculator to show total interest and
      payment schedules.
  - **Context**: `docs/Stage 2 -Development/15-Development_Plan.md`

---

## Stage 4: Merchant & Admin Platforms

### 🚀 [BE] Merchant & Admin Database Schema (`MEQ-MGT-01`)

- [ ] **MGT-BE-DB-01**: Design and finalize Merchant, Store, MerchantUser, Settlement, and AuditLog
      schemas in `schema.prisma`.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`
- [ ] **MGT-BE-DB-02**: Define relations for merchants to users, transactions, and settlements.
      Generate and apply migration.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`

### 🚀 [BE] Merchant Onboarding & Management Services (`MEQ-MGT-02`)

- [ ] **MGT-BE-SVC-01**: Implement merchant application/onboarding endpoint.
  - **Context**: `docs/Stage 1 - Foundation/02-API_Specification_and_Governance.md`
- [ ] **MGT-BE-SVC-02**: Build service for admin to review and approve/reject merchant applications.
  - **Context**: `docs/Stage 1 - Foundation/02-API_Specification_and_Governance.md`
- [ ] **MGT-BE-SVC-03**: Implement service for merchants to manage their own profile and store
      details.
  - **Context**: `docs/Stage 1 - Foundation/02-API_Specification_and_Governance.md`
- [ ] **MGT-BE-SVC-04**: Develop service for merchants to generate and manage their API keys.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`

### 🚀 [BE] Settlement & Admin Services (`MEQ-MGT-03`)

- [ ] **MGT-BE-SVC-05**: Develop a service to calculate merchant settlement amounts based on
      transactions, fees, and rolling reserves.
  - **Context**: `docs/Stage 1 - Foundation/03-Business_Model.md`
- [ ] **MGT-BE-JOB-01**: Implement a scheduled job to automatically process and record merchant
      settlements daily/weekly.
  - **Context**: `docs/Stage 1 - Foundation/03-Business_Model.md`
- [ ] **MGT-BE-ADM-01**: Build admin endpoints for managing consumer accounts (view details,
      block/unblock, view loans).
  - **Context**: `docs/Stage 1 - Foundation/02-API_Specification_and_Governance.md`,
    `docs/Stage 1 - Foundation/05-Compliance_Framework.md`
- [ ] **MGT-BE-ADM-02**: Build admin endpoints for managing system-level settings (e.g., BNPL plan
      terms, late fees).
  - **Context**: `docs/Stage 1 - Foundation/02-API_Specification_and_Governance.md`
- [ ] **MGT-BE-TEST-01**: [Test] Write unit & integration tests for merchant onboarding and
      settlement calculation logic.
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`

### 🌐 [Web] Merchant Portal (`MEQ-MGT-04`)

- [ ] **MGT-FE-W-ONB-01**: Build merchant onboarding application form.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **MGT-FE-W-DSH-01**: Develop the main merchant dashboard showing key analytics (sales volume,
      AOV, etc.).
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **MGT-FE-W-TRX-01**: Build page for viewing and searching transaction history.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **MGT-FE-W-STL-01**: Build page for viewing settlement history and downloading reports.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **MGT-FE-W-API-01**: Create UI for managing API keys and viewing webhook integration details.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **MGT-FE-W-TEST-01**: [Test] Write E2E tests for merchant onboarding and viewing settlements.
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`

### 🌐 [Web] Admin Portal (`MEQ-MGT-05`)

- [ ] **MGT-FE-W-SEC-01**: Build a secure, role-based admin portal with dedicated login.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`,
    `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **MGT-FE-W-USR-01**: Develop UI for managing consumer accounts (search, view, block/unblock).
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **MGT-FE-W-MER-01**: Develop UI for managing merchants (review applications, view profiles,
      manage stores).
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **MGT-FE-W-TRX-02**: Build UI for viewing and searching all system-wide transactions and
      loans.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **MGT-FE-W-STL-02**: Build UI for monitoring settlement jobs and manually triggering
      settlements if needed.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **MGT-FE-W-TEST-02**: [Test] Write E2E tests for core admin workflows like approving a
      merchant and blocking a user.
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`

### 🚀 [BE] AML/CTF Compliance & Monitoring System (`MEQ-MGT-06`)

- [ ] **MGT-BE-AML-01**: [BE/Compliance] Integrate with a sanctions list provider for real-time
      customer and merchant screening.
  - **Context**: `docs/Stage 1 - Foundation/05-Compliance_Framework.md`,
    `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **MGT-BE-AML-02**: [BE/Compliance] Implement advanced fuzzy name matching for sanctions
      screening, tuned for Ethiopian names.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **MGT-BE-AML-03**: [BE/Compliance] Implement a real-time transaction monitoring engine with
      configurable rules (e.g., threshold-based alerts).
  - **Context**: `docs/Stage 1 - Foundation/05-Compliance_Framework.md`
- [ ] **MGT-BE-AML-04**: [BE/Compliance] Develop logic for enhanced due diligence (EDD) on high-risk
      customers.
  - **Context**: `docs/Stage 1 - Foundation/05-Compliance_Framework.md`
- [ ] **MGT-BE-AML-05**: [BE/Compliance] Build a service to generate Suspicious Transaction Reports
      (STRs) for regulatory submission.
  - **Context**: `docs/Stage 1 - Foundation/05-Compliance_Framework.md`

### 🌐 [Web] Compliance & AML Admin UI (`MEQ-MGT-07`)

- [ ] **MGT-FE-W-AML-01**: [Web/Admin] Build dashboard for viewing AML alerts, statistics, and Key
      Compliance Indicators (KCIs).
  - **Context**: `docs/Stage 1 - Foundation/05-Compliance_Framework.md`
- [ ] **MGT-FE-W-AML-02**: [Web/Admin] Develop UI for a case management system to investigate and
      resolve AML alerts.
  - **Context**: `docs/Stage 1 - Foundation/05-Compliance_Framework.md`
- [ ] **MGT-FE-W-AML-03**: [Web/Admin] Create UI for sanctions list management, manual screening,
      and viewing screening history.
  - **Context**: `docs/Stage 1 - Foundation/05-Compliance_Framework.md`

### 🚀 [BE/FE] Customer Complaint & DSR Management (`MEQ-MGT-08`)

- [ ] **MGT-BE-CMP-01**: [BE/Compliance] Design and implement schema for tracking complaint and Data
      Subject Right (DSR) tickets.
  - **Context**: `docs/Stage 1 - Foundation/05-Compliance_Framework.md`
- [ ] **MGT-BE-CMP-02**: [BE/API] Build API endpoints for users to submit complaints and DSR
      requests (access, erasure).
  - **Context**: `docs/Stage 1 - Foundation/05-Compliance_Framework.md`,
    `docs/Stage 1 - Foundation/06-Data_Governance_and_Privacy_Policy.md`
- [ ] **MGT-FE-W-CMP-01**: [Web/Admin] Build UI for support/compliance officers to manage, process,
      and resolve tickets.
  - **Context**: `docs/Stage 1 - Foundation/05-Compliance_Framework.md`
- [ ] **MGT-FE-A-CMP-01**: [App/Web] Create UI for users to submit and view the status of their
      complaints/DSR requests.
  - **Context**: `docs/Stage 1 - Foundation/05-Compliance_Framework.md`

---

## Stage 5: AI, Deployment & Launch

### 🚀 [BE] AI/ML Credit Scoring Model Integration (`MEQ-AI-01`)

- [ ] **AI-BE-PIPE-01**: Develop data pipelines to extract and anonymize user/transaction data for
      model training.
  - **Context**: `docs/Stage 2 -Development/18-AI_Integration.md`,
    `docs/Stage 1 - Foundation/06-Data_Governance_and_Privacy_Policy.md`
- [ ] **AI-BE-SVC-01**: [BE/AI] Create a NestJS service to integrate with an external AI provider
      (e.g., OpenAI) for the initial credit scoring model.
  - **Context**: `docs/Stage 2 -Development/18-AI_Integration.md`,
    `docs/Stage 2 -Development/15-Development_Plan.md`
- [ ] **AI-BE-INT-01**: Integrate the credit score into the BNPL application service to influence
      loan approvals and terms.
  - **Context**: `docs/Stage 2 -Development/18-AI_Integration.md`,
    `docs/Stage 1 - Foundation/03-Business_Model.md`
- [ ] **AI-BE-FAIR-01**: [AI/ML] Implement bias detection and fairness metrics monitoring for the
      credit scoring model.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **AI-BE-XAI-01**: [AI/ML] Develop an 'Explainable AI' service to provide human-readable
      reasons for credit decisions.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **AI-BE-MON-01**: Implement monitoring for the credit scoring service (latency, error rate,
      score distribution).
  - **Context**: `docs/Stage 3 - Deployment & Operations/25-Monitoring_And_Logging.md`

### 🚀 Production Infrastructure & Deployment (`MEQ-DEP-01`)

- [ ] **DEP-IAC-01**: [IaC] Write Terraform scripts for production AWS resources (ECS Fargate, RDS
      with replicas, ElastiCache).
  - **Context**: `docs/Stage 3 - Deployment & Operations/24-Infrastructure.md`
- [ ] **DEP-IAC-02**: [IaC] Configure production-grade security groups and network ACLs.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **DEP-SEC-01**: [Security] Configure AWS Secrets Manager for all production secrets and
      integrate with the backend service.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **DEP-SEC-02**: [Security/IaC] Provision and configure Hardware Security Modules (HSMs) or
      equivalent for primary key management.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **DEP-SEC-03**: [DevOps/Security] Implement data masking and tokenization jobs for creating
      sanitized non-production environments.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **DEP-CI-01**: [CI/CD] Create workflow to build and push versioned Docker images to ECR on
      merge to 'main'.
  - **Context**: `docs/Stage 3 - Deployment & Operations/23-Deployment.md`
- [ ] **DEP-CI-02**: [CI/CD] Implement a deployment pipeline (e.g., using GitHub Actions) to deploy
      the new image to production via a blue/green or canary strategy.
  - **Context**: `docs/Stage 3 - Deployment & Operations/23-Deployment.md`
- [ ] **DEP-LOG-01**: Set up centralized logging (CloudWatch) and monitoring dashboards/alerts
      (Datadog/Grafana) for the production environment.
  - **Context**: `docs/Stage 3 - Deployment & Operations/25-Monitoring_And_Logging.md`
- [ ] **DEP-LOG-02**: [DevOps/Monitoring] Configure dashboards and alerts for key error metrics
      (payment provider success rates, API endpoint error rates).
  - **Context**: `docs/Stage 2 -Development/20-Error_Handling.md`
- [ ] **DEP-SEC-04**: [Security/DevOps] Configure the service mesh or API Gateway to enforce mTLS
      for all internal service-to-service communication.
  - **Context**: `docs/Stage 2 -Development/19-API_Documentation_Strategy.md`,
    `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **DEP-IAC-08**: [IaC/DevOps] Provision and configure a managed Redis cluster (e.g.,
      ElastiCache) for caching and session storage.
  - **Context**: `docs/Stage 2 -Development/19-API_Documentation_Strategy.md`
- [ ] **DEP-IAC-05**: [IaC/DBA] Configure PgBouncer for production PostgreSQL connection pooling.
  - **Context**: `docs/Stage 1 - Foundation/09-Tech_Stack.md`,
    `docs/Stage 3 - Deployment & Operations/24-Infrastructure.md`
- [ ] **DEP-IAC-06**: [IaC/DevOps] Provision and configure an Elasticsearch cluster for product
      search and logging.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`,
    `docs/Stage 3 - Deployment & Operations/24-Infrastructure.md`
- [ ] **DEP-IAC-07**: [IaC/DevOps] Provision a Data Warehouse (e.g., Snowflake/BigQuery) and
      establish initial ETL pipelines.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`,
    `docs/Stage 3 - Deployment & Operations/24-Infrastructure.md`
- [ ] **DEP-DB-BCK-01**: [IaC/DBA] Define and implement automated backup policies, Point-in-Time
      Recovery, and regular restore testing for production databases.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`,
    `docs/Stage 3 - Deployment & Operations/27-Disaster_Recovery_Plan.md`
- [ ] **DEP-CI-MOBILE-01**: [CI/CD/Mobile] Configure a CI/CD pipeline using Fastlane to automate
      building, signing, and deploying the mobile app.
  - **Context**: `docs/Stage 3 - Deployment & Operations/23-Deployment.md`
- [ ] **DEP-APM-01**: [BE/DevOps] Integrate Datadog APM or another OpenTelemetry-compatible agent
      for distributed tracing across services.
  - **Context**: `docs/Stage 3 - Deployment & Operations/25-Monitoring_And_Logging.md`
- [ ] **DEP-ALERT-01**: [DevOps] Integrate monitoring/alerting systems with PagerDuty for on-call
      scheduling and escalation.
  - **Context**: `docs/Stage 3 - Deployment & Operations/25-Monitoring_And_Logging.md`,
    `docs/Stage 3 - Deployment & Operations/26-Incident_Response_Plan.md`
- [ ] **DEP-TEST-SYN-01**: [Test/DevOps] Create synthetic monitoring checks to test critical
      financial flows from an end-user perspective.
  - **Context**: `docs/Stage 3 - Deployment & Operations/25-Monitoring_And_Logging.md`
- [ ] **DEP-WAF-01**: [Security/IaC] Configure AWS WAF with OWASP Top 10 rules and custom rate-based
      rules tuned for Ethiopian traffic.
  - **Context**: `docs/Stage 3 - Deployment & Operations/24-Infrastructure.md`
- [ ] **DEP-FGT-SEC-01**: [IaC/Fargate] Refine and enforce strict Security Group ingress/egress
      rules between Fargate services.
  - **Context**: `docs/Stage 3 - Deployment & Operations/24-Infrastructure.md`,
    `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **DEP-SEC-05**: [Security/IaC] Configure AWS SSM Session Manager for secure, auditable shell
      access, disabling direct SSH.
  - **Context**: `docs/Stage 3 - Deployment & Operations/24-Infrastructure.md`,
    `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **DEP-CDN-01**: [IaC/Web] Configure CloudFront distributions with geo-restriction to primarily
      serve traffic to Ethiopia.
  - **Context**: `docs/Stage 3 - Deployment & Operations/24-Infrastructure.md`

### 🚀 Pre-Launch Finalization & Go-Live (`MEQ-LNC-01`)

- [ ] **LNC-CFG-01**: [Ops/Compliance] Obtain and securely configure production credentials for all
      external services (Fayda, NBE, Payment Providers) in the production vault.
  - **Context**: `docs/Stage 1 - Foundation/11-Integration_Requirements.md`,
    `docs/Stage 3 - Deployment & Operations/23-Deployment.md`
- [ ] **LNC-TEST-01**: [Test] Perform and sign-off on end-to-end testing of all critical user flows
      (consumer, merchant, admin).
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`
- [ ] **LNC-TEST-02**: [Test] Conduct performance testing (K6) on critical endpoints, simulating
      Ethiopian network conditions (latency, bandwidth).
  - **Context**: `docs/Stage 3 - Deployment & Operations/28-Performance_Optimization.md`,
    `docs/Stage 1 - Foundation/09-Tech_Stack.md`,
    `docs/Stage 2 -Development/22-Testing_Guidelines.md`
- [ ] **LNC-OPT-01**: [BE/FE] Implement data compression (Gzip) and image optimization strategies to
      improve performance on low-bandwidth networks.
  - **Context**: `docs/Stage 1 - Foundation/08-Architecture.md`
- [ ] **LNC-SEC-01**: Conduct and review a full, third-party security audit and penetration test.
      Remediate critical findings.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **LNC-SEC-02**: [Test/Security] Schedule recurring DAST scans (e.g., quarterly) using tools
      like OWASP ZAP against the staging environment.
  - **Context**: `docs/Stage 1 - Foundation/07-Security.md`,
    `docs/Stage 2 -Development/22-Testing_Guidelines.md`
- [ ] **LNC-DR-01**: Perform and document a successful disaster recovery drill (e.g., database
      restore, service failover).
  - **Context**: `docs/Stage 3 - Deployment & Operations/27-Disaster_Recovery_Plan.md`
- [ ] **LNC-DOC-01**: Prepare and publish final, versioned API documentation for merchants.
  - **Context**: `docs/Stage 2 -Development/19-API_Documentation_Strategy.md`
- [ ] **LNC-DOC-02**: [Docs] Write the full Incident Response Plan based on the placeholder,
      detailing roles, severity levels, and procedures.
  - **Context**: `docs/Stage 3 - Deployment & Operations/26-Incident_Response_Plan.md`
- [ ] **LNC-OPS-01**: Finalize and train the support team on the incident response plan.
  - **Context**: `docs/Stage 3 - Deployment & Operations/26-Incident_Response_Plan.md`
- [ ] **LNC-GO-01**: Execute the production deployment ('Go-Live').
  - **Context**: `docs/Stage 3 - Deployment & Operations/23-Deployment.md`
- [ ] **LNC-GO-02**: Perform post-launch monitoring and health checks.
  - **Context**: `docs/Stage 3 - Deployment & Operations/25-Monitoring_And_Logging.md`
- [ ] **LNC-DOC-03**: [Docs] Write the full Disaster Recovery Plan based on the placeholder,
      detailing RTO/RPO, failover strategy, and restoration procedures.
  - **Context**: `docs/Stage 3 - Deployment & Operations/27-Disaster_Recovery_Plan.md`

### 🚀 Cloud Cost Management & FinOps (`MEQ-DEP-02`)

- [ ] **DEP-FIN-01**: [FinOps/IaC] Implement and enforce the mandatory resource tagging policy using
      AWS Config rules to enable cost allocation.
  - **Context**: `docs/Stage 3 - Deployment & Operations/29-Cost_Management.md`
- [ ] **DEP-FIN-02**: [FinOps/DevOps] Configure AWS Budgets with alerts for overall spend and for
      key services, notifying relevant teams.
  - **Context**: `docs/Stage 3 - Deployment & Operations/29-Cost_Management.md`
- [ ] **DEP-FIN-03**: [FinOps/DevOps] Create dedicated FinOps dashboards in Grafana/Datadog to
      visualize cost drivers.
  - **Context**: `docs/Stage 3 - Deployment & Operations/29-Cost_Management.md`
- [ ] **DEP-FIN-04**: [FinOps/IaC] Implement S3 Lifecycle Policies to automatically transition aged
      data to lower-cost storage tiers.
  - **Context**: `docs/Stage 3 - Deployment & Operations/29-Cost_Management.md`
- [ ] **DEP-FIN-05**: [FinOps/IaC] Evaluate and use Graviton instances for production services to
      improve price-performance.
  - **Context**: `docs/Stage 3 - Deployment & Operations/29-Cost_Management.md`
- [ ] **DEP-FIN-06**: [FinOps/IaC] Implement a strategy to use Spot Instances for non-critical,
      fault-tolerant workloads (e.g., CI/CD runners).
  - **Context**: `docs/Stage 3 - Deployment & Operations/29-Cost_Management.md`
- [ ] **DEP-FIN-07**: [FinOps/Gov] Establish and document the monthly cost review process and
      schedule the first meeting.
  - **Context**: `docs/Stage 3 - Deployment & Operations/29-Cost_Management.md`
- [ ] **DEP-FIN-08**: [AI/FinOps] Implement caching and detailed usage monitoring for AI service
      calls to manage token consumption costs.
  - **Context**: `docs/Stage 3 - Deployment & Operations/29-Cost_Management.md`

### 🚀 Performance Optimization & Monitoring (`MEQ-LNC-03`)

- [ ] **LNC-PERF-01**: [FE/Perf] Analyze production bundle composition to identify and optimize
      large dependencies.
  - **Context**: `docs/Stage 3 - Deployment & Operations/28-Performance_Optimization.md`
- [ ] **LNC-PERF-02**: [FE/Perf] Implement a script or CI job to convert all project images to an
      optimized format like WebP.
  - **Context**: `docs/Stage 3 - Deployment & Operations/28-Performance_Optimization.md`
- [ ] **LNC-PERF-03**: [FE/Perf] Implement progressive/lazy loading for all non-critical images and
      media assets.
  - **Context**: `docs/Stage 3 - Deployment & Operations/28-Performance_Optimization.md`
- [ ] **LNC-PERF-04**: [App/Perf] Audit native modules for performance bottlenecks and identify
      candidates for native implementation.
  - **Context**: `docs/Stage 3 - Deployment & Operations/28-Performance_Optimization.md`
- [ ] **LNC-PERF-05**: [App/Perf] Configure Metro bundler for optimal production performance,
      including enabling the Hermes engine.
  - **Context**: `docs/Stage 3 - Deployment & Operations/28-Performance_Optimization.md`
- [ ] **LNC-PERF-06**: [Test/Perf] Expand real-device testing matrix to include a wider range of
      low-end Android devices common in Ethiopia.
  - **Context**: `docs/Stage 3 - Deployment & Operations/28-Performance_Optimization.md`
- [ ] **LNC-PERF-07**: [App/Monitoring] Integrate a Real User Monitoring (RUM) tool (e.g., Firebase
      Performance) into the mobile app.
  - **Context**: `docs/Stage 3 - Deployment & Operations/28-Performance_Optimization.md`
- [ ] **LNC-PERF-08**: [DevOps/Monitoring] Configure alerts for key performance regressions (LCP,
      API latency, etc.) in the production monitoring system.
  - **Context**: `docs/Stage 3 - Deployment & Operations/28-Performance_Optimization.md`

### 🚀 Compliance & Localization Testing (`MEQ-LNC-02`)

- [ ] **LNC-TEST-CMPL-01**: [Test/Compliance] Develop and run an automated test suite to validate
      NBE compliance requirements (disclosures, KYC data handling).
  - **Context**: `docs/Stage 1 - Foundation/05-Compliance_Framework.md`,
    `docs/Stage 2 -Development/22-Testing_Guidelines.md`
- [ ] **LNC-TEST-LOC-01**: [Test/FE] Create and execute a formal test plan for Amharic localization,
      covering UI layout, text, and data formats on web and mobile.
  - **Context**: `docs/Stage 2 -Development/22-Testing_Guidelines.md`,
    `docs/Stage 2 -Development/19-API_Documentation_Strategy.md`

---

## Stage 6: Marketplace, Rewards & Financial Wellness

### 🚀 [BE] Marketplace & Discovery Services (`MEQ-MKT-01`)

- [ ] **MKT-BE-DB-01**: Design and implement Product, Category, and MerchantProduct schemas in
      `schema.prisma`.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`, `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **MKT-BE-API-01**: Implement APIs for product search, filtering, and categorization.
  - **Context**: `docs/Stage 1 - Foundation/02-API_Specification_and_Governance.md`
- [ ] **MKT-BE-API-02**: Build APIs for merchants to manage their product listings.
  - **Context**: `docs/Stage 1 - Foundation/02-API_Specification_and_Governance.md`

### 🚀 [Web/App] Marketplace UI/UX (`MEQ-MKT-02`)

- [ ] **MKT-FE-UI-01**: Build product listing and product detail pages/screens for both web and app.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`,
    `docs/Stage 1 - Foundation/12-User_Experience_Guidelines.md`
- [ ] **MKT-FE-UI-02**: Implement search and filtering UI on both platforms.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **MKT-FE-UI-03**: Build Wishlist feature UI and logic.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`

### 🚀 [BE] Rewards & Cashback Engine (`MEQ-REW-01`)

- [ ] **REW-BE-DB-01**: Design and implement CashbackLedger and RewardsProgram schemas in
      `schema.prisma`.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`,
    `docs/Stage 1 - Foundation/03-Business_Model.md`
- [ ] **REW-BE-SVC-01**: Develop a rules engine to calculate cashback based on merchant, category,
      and promotions.
  - **Context**: `docs/Stage 1 - Foundation/03-Business_Model.md`

### 🚀 [Web/App] Rewards UI/UX (`MEQ-REW-02`)

- [ ] **REW-FE-UI-01**: Build UI for users to view their cashback balance and transaction history.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **REW-FE-UI-02**: Integrate 'apply cashback' option into the checkout flow.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`

### 🚀 [BE] Financial Wellness Services (`MEQ-FIN-01`)

- [ ] **FIN-BE-SVC-01**: Implement a service to automatically categorize user spending.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`

### 🚀 [Web/App] Financial Wellness Tools UI (`MEQ-FIN-02`)

- [ ] **FIN-FE-UI-01**: Build UI for spending analytics and budget tracking.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **FIN-FE-UI-02**: Develop UI for creating and managing savings goals.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **FIN-FE-UI-03**: Create Financial Education module with interactive content.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`

---

## Stage 7: Advanced Platforms & Premium Features

### 🚀 [BE/FE] Meqenet Plus Subscription (`MEQ-PREM-01`)

- [ ] **PREM-BE-DB-01**: Add `Subscription` model to `schema.prisma` and link to User.
  - **Context**: `docs/Stage 1 - Foundation/10-Database.md`
- [ ] **PREM-BE-SVC-01**: Implement service to manage subscription lifecycle (subscribe, renew,
      cancel) via Telebirr.
  - **Context**: `docs/Stage 1 - Foundation/03-Business_Model.md`
- [ ] **PREM-FE-UI-01**: Build UI for users to subscribe to Meqenet Plus and manage their
      subscription.
  - **Context**: `docs/Stage 1 - Foundation/03-Business_Model.md`

### 🚀 [BE] Virtual Card Service Integration (`MEQ-VCC-01`)

- [ ] **VCC-BE-INT-01**: Integrate with a virtual card issuing provider's API.
  - **Context**: `docs/Stage 1 - Foundation/11-Integration_Requirements.md`,
    `docs/Stage 1 - Foundation/03-Business_Model.md`
- [ ] **VCC-BE-API-01**: Build APIs to create, fund, and manage the lifecycle of virtual cards.
  - **Context**: `docs/Stage 1 - Foundation/02-API_Specification_and_Governance.md`

### 🚀 [Web/App] Virtual Card UI (`MEQ-VCC-02`)

- [ ] **VCC-FE-UI-01**: Build UI to securely display virtual card details.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`, `docs/Stage 1 - Foundation/07-Security.md`
- [ ] **VCC-FE-UI-02**: Develop UI to freeze/unfreeze card, view transactions, and manage limits.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`

### 🚀 [BE] USSD Gateway Service (`MEQ-USD-01`)

- [ ] **USSD-BE-SVC-01**: Develop a service to handle USSD menu navigation and state management.
  - **Context**: `docs/Stage 1 - Foundation/03-Business_Model.md`,
    `docs/Stage 1 - Foundation/11-Integration_Requirements.md`
- [ ] **USSD-BE-INT-01**: Integrate with a mobile network operator's USSD gateway.
  - **Context**: `docs/Stage 1 - Foundation/11-Integration_Requirements.md`

### 🌐 [Browser Extension] Core Functionality (`MEQ-EXT-01`)

- [ ] **EXT-FE-SETUP-01**: Set up scaffolding for a cross-browser (Chrome/Firefox) extension.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **EXT-FE-LOGIC-01**: Implement logic to detect partner merchant checkout pages.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`
- [ ] **EXT-FE-UI-01**: Build UI to display Meqenet payment options within the extension popup.
  - **Context**: `docs/Stage 1 - Foundation/04-PRD.md`

---

## Stage 8: Advanced AI & Personalization

### 🚀 [BE] AI-Powered Recommendation Engines (`MEQ-AI-02`)

- [ ] **AI-BE-REC-01**: [BE/AI] Develop an AI-powered service for recommending the optimal payment
      plan based on user profile and purchase context.
  - **Context**: `docs/Stage 2 -Development/18-AI_Integration.md`,
    `docs/Stage 2 -Development/15-Development_Plan.md`
- [ ] **AI-BE-REC-02**: [BE/AI] Integrate the payment plan recommendations into the checkout flow on
      both web and mobile.
  - **Context**: `docs/Stage 2 -Development/18-AI_Integration.md`
- [ ] **AI-BE-REC-03**: [BE/AI] Build a product recommendation engine for the marketplace based on
      user behavior and financial profile.
  - **Context**: `docs/Stage 2 -Development/18-AI_Integration.md`

### 🚀 [BE] Dynamic Interest Rate & Financial Optimization (`MEQ-AI-03`)

- [ ] **AI-BE-RIO-01**: [BE/AI] Develop and train an ML model for dynamic interest rate optimization
      on 'Pay Over Time' loans.
  - **Context**: `docs/Stage 2 -Development/18-AI_Integration.md`,
    `docs/Stage 2 -Development/15-Development_Plan.md`
- [ ] **AI-BE-CBO-01**: [BE/AI] Build a service to provide AI-powered cashback and rewards
      optimization suggestions to users.
  - **Context**: `docs/Stage 2 -Development/18-AI_Integration.md`

### 🚀 [BE] Merchant & Marketplace AI Services (`MEQ-AI-04`)

- [ ] **AI-BE-MRS-01**: [BE/AI] Develop an ML model for Merchant Risk Scoring to automate and
      enhance merchant onboarding.
  - **Context**: `docs/Stage 2 -Development/18-AI_Integration.md`
- [ ] **AI-BE-MRS-02**: [BE/AI] Implement AI-driven inventory and pricing optimization suggestions
      for merchants.
  - **Context**: `docs/Stage 2 -Development/18-AI_Integration.md`

### 🌐 [Web] Public Education & Resource Hub (`MEQ-WEB-01`)

- [ ] **WEB-FE-EDU-01**: [Web] Design and build the public-facing Financial Literacy Center with
      articles, tools, and videos.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **WEB-FE-EDU-02**: [Web] Populate the hub with initial content in both Amharic and English.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`

---

## Stage 9: Ecosystem & Plugin Development

### 🌐 [BE/FE] E-commerce Integration Toolkit (`MEQ-ECO-01`)

- [ ] **ECO-BE-PLUGIN-01**: [BE/Plugin] Develop a generic backend service and SDK to support
      integrations with third-party e-commerce platforms.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`
- [ ] **ECO-FE-WEB-01**: [Web] Build a public-facing developer portal and documentation center for
      e-commerce integrations.
  - **Context**: `docs/Stage 2 -Development/17-Web_Platform_Features.md`

### 🚀 [BE] Strategic Payment Integrations (`MEQ-ECO-02`)

- [ ] **ECO-BE-INT-01**: [BE/Integration] Develop a robust NestJS service for M-Pesa integration as
      a strategic ecosystem partner.
  - **Context**: `docs/Stage 1 - Foundation/11-Integration_Requirements.md`,
    `docs/Stage 1 - Foundation/03-Business_Model.md`

---

## Stage 10: Scalability & Performance Engineering

### 🚀 [BE/DevOps] Near-Term Scalability Enhancements (`MEQ-SCL-01`)

- [ ] **SCL-CACHE-01**: Implement advanced, feature-specific caching strategies (e.g., Redis) for
      high-read domains like Marketplace.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/31-Scalability_Planning.md`
- [ ] **SCL-COMMS-01**: Review and optimize cross-feature communication protocols to reduce latency
      and overhead.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/31-Scalability_Planning.md`
- [ ] **SCL-AUTOSCALE-01**: Define and implement feature-specific Horizontal Pod Autoscaler (HPA)
      policies based on domain metrics.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/31-Scalability_Planning.md`
- [ ] **SCL-DB-PARTITION-01**: Implement database partitioning (e.g., by date/hash) for high-volume
      tables like 'transactions' and 'analytics_events'.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/31-Scalability_Planning.md`
- [ ] **SCL-MONITOR-01**: Implement comprehensive, per-domain monitoring dashboards to track
      feature-specific scalability KPIs.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/31-Scalability_Planning.md`

### 🚀 [Arch] Mid-Term Scalability Initiatives (`MEQ-SCL-02`)

- [ ] **SCL-MICROSERVICE-01**: Evaluate decomposition of largest feature domains (e.g., Marketplace)
      into finer-grained microservices.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/31-Scalability_Planning.md`
- [ ] **SCL-EVENTSOURCE-01**: Investigate and potentially implement event sourcing for complex,
      cross-feature state management.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/31-Scalability_Planning.md`
- [ ] **SCL-CDN-01**: Implement feature-specific CDN optimization rules for assets based on usage
      patterns.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/31-Scalability_Planning.md`
- [ ] **SCL-DB-SHARD-01**: Evaluate and plan for database sharding for hyper-growth features like
      Marketplace and Analytics.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/31-Scalability_Planning.md`
- [ ] **SCL-PREDICT-01**: Develop a predictive scaling model based on historical data and Ethiopian
      market patterns (e.g., holidays).
  - **Context**: `docs/Stage 4 - Growth & Maintenance/31-Scalability_Planning.md`

### 🚀 [Arch] Long-Term Scalability Research (`MEQ-SCL-03`)

- [ ] **SCL-REGION-01**: Investigate and create a plan for potential multi-region, active-active
      deployment.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/31-Scalability_Planning.md`
- [ ] **SCL-AI-CAPACITY-01**: Research and design an AI-driven capacity planning and autonomous
      scaling system.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/31-Scalability_Planning.md`

---

## Stage 11: Continuous Improvement & Governance

### 🚀 [Gov] Feature Expansion Framework Setup (`MEQ-GOV-01`)

- [ ] **GOV-TPL-01**: Create the official 'Feature Proposal' issue template in the GitHub repository
      based on 32-Feature_Expansion.md.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/32-Feature_Expansion.md`
- [ ] **GOV-PROCESS-01**: Establish and document the process for using the Feature Prioritization
      Framework for all new feature requests.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/32-Feature_Expansion.md`
- [ ] **GOV-DOCS-01**: Create a process and assign ownership for updating user, API, and internal
      documentation when features are added or changed.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/32-Feature_Expansion.md`

### 🚀 [Gov] Cross-Functional Process Implementation (`MEQ-GOV-02`)

- [ ] **GOV-FIN-01**: Establish a formal review process for all new features that have financial
      logic to ensure consistency and NBE compliance.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/32-Feature_Expansion.md`
- [ ] **GOV-SEC-01**: Mandate and formalize a threat modeling session as a required step for any new
      feature proposal.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/32-Feature_Expansion.md`
- [ ] **GOV-UX-01**: Establish a formal user research process for major new features, specifically
      targeting Ethiopian user segments.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/32-Feature_Expansion.md`

---

## Stage 12: Accessibility & Inclusion

### 🚀 [A11y] Foundational Accessibility Audit & Setup (`MEQ-A11Y-01`)

- [ ] **A11Y-AUDIT-01**: Perform an initial automated accessibility audit (Axe/Lighthouse) on web
      and app to establish a baseline.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/33-Accessibility.md`
- [ ] **A11Y-CI-01**: Integrate automated accessibility checks (e.g., jest-axe) into the CI
      pipelines for both frontend projects.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/33-Accessibility.md`
- [ ] **A11Y-DOCS-01**: Create and publish a public-facing Accessibility Statement on the website.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/33-Accessibility.md`
- [ ] **A11Y-DS-01**: Incorporate accessibility requirements and documentation directly into the
      shared Design System (Storybook).
  - **Context**: `docs/Stage 4 - Growth & Maintenance/33-Accessibility.md`

### 🚀 [A11y] Implementation & Remediation (`MEQ-A11Y-02`)

- [ ] **A11Y-KB-01**: Perform a full keyboard-only navigation test of all critical user flows on
      both web and app.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/33-Accessibility.md`
- [ ] **A11Y-SR-01**: Conduct manual screen reader testing (VoiceOver, TalkBack) for primary user
      journeys.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/33-Accessibility.md`
- [ ] **A11Y-COLOR-01**: Audit and remediate all color contrast issues to ensure WCAG 2.1 AA
      compliance.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/33-Accessibility.md`
- [ ] **A11Y-FORMS-01**: Ensure all form fields across all platforms have proper labels,
      instructions, and accessible error handling.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/33-Accessibility.md`

### 🚀 [A11y] Advanced & Ongoing Processes (`MEQ-A11Y-03`)

- [ ] **A11Y-USER-TEST-01**: Plan and conduct the first round of usability testing that includes
      users with disabilities.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/33-Accessibility.md`
- [ ] **A11Y-TRAINING-01**: Develop and deliver accessibility training for all designers and
      developers.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/33-Accessibility.md`
- [ ] **A11Y-I18N-01**: Verify Amharic language support with screen readers and ensure proper
      right-to-left UI handling where needed.
  - **Context**: `docs/Stage 4 - Growth & Maintenance/33-Accessibility.md`

---
