# Testing Guidelines (Meqenet BNPL Platform)

## Overview

This document outlines comprehensive testing guidelines for the Meqenet BNPL platform, covering the
complete financial ecosystem including **all four payment options** from our business model: Pay in
4 (interest-free), Pay in 30 (interest-free), Pay Over Time (6-24 months with 15-22% APR), and Pay
in Full Today with buyer protection. Testing strategies are designed for modern FinTech standards
and ensure quality, security, and compliance across all platform components.

**Testing a Microservice Architecture:** Testing is organized by service. Each service has its own
comprehensive test suite. We prioritize contract testing to ensure reliable inter-service
communication, reducing our reliance on slow, full end-to-end tests.

> **Related Documentation:**
>
> - [API Documentation](./19-API_Documentation_Strategy.md): API endpoints to test
> - [AI Integration](./18-AI_Integration.md): AI features and credit risk models to test
> - [Error Handling](./20-Error_Handling.md): Error scenarios to verify
> - [Security](../Stage%201%20-%20Foundation/07-Security.md): Security and NBE compliance
>   requirements
> - [Code Review](./21-Code_Review.md): Code quality standards and review processes
> - `.cursorrules`: Core security and quality coding standards for the project.

## 1. Testing Philosophy

- **Financial Integrity First:** Ensure all financial calculations, transactions, and payment flows
  are thoroughly tested and accurate.
- **Test Early, Test Often:** Integrate testing throughout the development lifecycle.
- **Automation First:** Automate repetitive tests (unit, integration, E2E) where feasible.
- **Focus on User Flows:** Prioritize tests that cover critical financial user journeys.
- **Include Negative Paths:** Test error handling and edge cases, especially for financial
  transactions.
- **Compliance Driven:** Ensure tests cover NBE regulations, Ethiopian laws, and financing terms
  compliance.
- **Security is Non-Negotiable:** Integrate security testing into the process, with special
  attention to financial data protection per NBE guidelines.

## 2. Testing Strategy by Service

### Testing Structure by Service

```
services/
├── payments-service/
│   └── __tests__/
│       ├── unit/
│       │   └── payment-calculator.test.ts
│       ├── integration/
│       │   └── database-connection.test.ts
│       ├── contract/
│       │   └── rewards-service.pact.ts
│       └── e2e/
│           └── payment-flow.test.ts
├── rewards-service/
│   └── __tests__/
│       ├── unit/
│       │   └── cashback.test.ts
│       ├── contract/
│       │   └── pact-provider.test.ts # Verifies pacts from consumers
│       └── ...
shared/
│   └── __tests__/
│       ├── utilities.test.ts            # Shared utility tests
│       └── validation.test.ts           # Common validation tests
__tests__/
    └── e2e/
        └── cross-service-journey.test.ts # High-level user journey E2E tests
```

### Service Testing Isolation Rules

1.  **Service-Specific Tests:** Each microservice owns its full test suite.
2.  **Mock Dependencies:** For unit and integration tests, all external dependencies (including
    other microservices) must be mocked.
3.  **Shared Test Utilities:** Common testing utilities are available through `shared/__tests__/`.
4.  **Contract-Based Communication:** All inter-service communication is tested via contracts, not
    direct integration tests.

## 3. Types of Testing (Ethiopian Context)

- **Unit Tests:**
  - _Goal:_ Verify individual functions/methods/components within a single service in complete
    isolation.
  - _Tools:_ Jest (Backend), Jest/React Testing Library (Frontend).
  - _Scope:_ Test financial business logic (ETB calculations), utilities for handling Ethiopian data
    formats, API controllers (mocking service dependencies).
  - _Frequency:_ Run on every commit and in CI pipeline.
- **Integration Tests:**
  - _Goal:_ Verify the interaction of a service with its own infrastructure dependencies, such as
    its database or cache. **Does not involve other microservices.**
  - _Tools:_ Jest/Supertest with Docker (e.g., `testcontainers`) for spinning up a real database.
  - _Scope:_ Test that a service can correctly write to and read from its database, publish events,
    or interact with its cache.
  - _Frequency:_ Run in CI pipeline.
- **Contract Tests:**
  - _Goal:_ Ensure that two microservices can communicate correctly without coupling them. The
    "consumer" service defines a contract (the requests it will send and the responses it expects),
    and the "provider" service verifies it can fulfill that contract.
  - _Tools:_ Pact.
  - _Scope:_ Verify all client-provider interactions for both gRPC and REST APIs between services.
    The contract becomes part of the provider's CI pipeline.
  - _Frequency:_ Run in CI pipeline for both consumer and provider. A provider build will fail if it
    breaks a consumer's contract.
- **End-to-End (E2E) Tests:**
  - _Goal:_ Simulate a small number of critical user workflows through the entire deployed
    application stack. These are kept to a minimum as they are slow and brittle.
  - _Tools:_ Detox (for mobile testing), Cypress/Playwright (for web).
  - _Scope:_ Test a few critical "happy path" user journeys that span multiple services (e.g.,
    signup -> KYC -> first payment).
- **Payment Processing Tests (Ethiopian Providers):**
  - _Goal:_ Specifically verify payment processing flows using Ethiopian payment methods.
  - _Tools:_ Sandbox/Test environments provided by Telebirr, HelloCash, M-Pesa (Ethiopia), etc. (if
    available - _Note: Track availability and reliability of these sandboxes_). May require building
    simulators/mocks if sandboxes are limited.
  - _Scope:_ Test successful payments, declined payments (insufficient mobile money balance,
    inactive account), payment retries, refunds via these specific methods.
  - _Frequency:_ Run in CI pipeline and before deployments.
- **Manual Testing:**
  - _Goal:_ Exploratory testing, usability testing (with target Ethiopian users), verifying complex
    financial scenarios, and testing on representative Ethiopian devices/networks.
  - _Scope:_ New feature validation, UI/UX checks in Amharic and English, complex financing terms
    scenarios, **KYC flow with physical Fayda National ID documents only**, testing under simulated
    poor network conditions.
  - _Frequency:_ Before major releases, during feature development.
- **Security Testing:**
  - _Goal:_ Identify and mitigate security vulnerabilities, focusing on compliance with NBE
    guidelines and protection of sensitive Ethiopian user data.
  - _Tools:_ OWASP ZAP, SAST, SCA, manual code review, potential external penetration testing
    focusing on Ethiopian context.
  - _Scope:_ Check for vulnerabilities relevant to local integrations, secure handling of Fayda ID
    data, compliance with Ethiopian data protection laws, NBE security directives.
  - _Frequency:_ Regularly (automated scans), before major releases (manual review/pentest).
- **Performance Testing (Ethiopian Network Simulation):**
  - _Goal:_ Assess application responsiveness and scalability under load, simulating typical
    Ethiopian network conditions (latency, bandwidth constraints).
  - _Tools:_ k6 (configured for network simulation).
  - _Scope:_ Test API response times, database query performance, transaction processing speeds via
    Ethiopian payment gateways under simulated local network conditions.
  - _Frequency:_ Before major releases, when significant architectural changes occur.
- **Compliance Testing (NBE & Local Laws):**
  - _Goal:_ Verify adherence to NBE regulations, Proclamation 1176/2020 (AML/KYC), Ethiopian
    consumer protection, and data protection laws.
  - _Scope:_ Test data handling practices, **KYC verification flow compliance using exclusively
    Fayda National ID**, financing terms compliance (proper interest rate disclosure for longer-term
    plans), verify proper disclosure of terms (Amharic/English), validate credit assessment fairness
    per NBE guidelines.
  - _Frequency:_ Before major releases, when relevant regulations change.
- **Localization Testing (Amharic):**
  - _Goal:_ Ensure correct display and functionality of the UI in Amharic.
  - _Scope:_ Verify all text translations, UI layout adaptability (Right-to-Left if needed for
    Amharic text), date/number formatting, input methods.
  - _Frequency:_ During feature development involving UI changes, before releases.

## 3. Testing Process

1.  **Development:** Developers write unit and integration tests alongside feature code.
2.  **Code Review:** Reviewers check for test coverage and quality, with special attention to
    financial logic.
3.  **CI Pipeline:** Automated tests (unit, integration) run on every push/PR. Build fails if tests
    fail.
4.  **Staging Deployment:** E2E tests run against the staging environment. Manual/Exploratory
    testing is performed on staging.
5.  **Bug Reporting:** Use a consistent bug tracking system (e.g., GitHub Issues). Include steps to
    reproduce, expected vs. actual results, environment details.
6.  **Production Deployment:** Confidence gained through comprehensive testing in staging. Monitor
    closely post-deployment, especially financial transactions.

## 4. Test Coverage

- Aim for high unit test coverage on critical financial logic (>90% recommended).
- Ensure all payment processing flows and financial calculations have comprehensive test coverage.
- All API endpoints and user flows are covered by integration and E2E tests.
- Coverage metrics are a guide, not a strict rule; focus on testing critical paths and complex logic
  effectively.

## 5. Financial Transaction Testing Strategies (Ethiopian Context)

- **Payment Flow Testing:**
  - **Mobile Money Processing:** Test successful payments, insufficient balance, inactive accounts,
    network timeouts with Telebirr, HelloCash, M-Pesa, etc.
  - **Declined Payments:** Verify handling of declines from Ethiopian providers, specific error
    codes, and user messages (Amharic/English).
  - **Installment Calculations:** Test ETB calculations for installments (both interest-free
    short-term and interest-bearing longer-term plans).
  - **Refunds:** Verify full and partial refund processes via Ethiopian payment methods.
  - **Edge Cases:** Test with minimum/maximum ETB amounts, transactions near provider cut-off times.
- **Payment Gateway Simulation/Mocks:**
  - Utilize provider sandbox environments (Telebirr, etc.) if available and reliable.
  - Develop robust mocks/simulators if sandboxes are lacking, covering success, various failure
    modes, and delays.
  - Simulate network failures during communication with providers.
- **Transaction Integrity:**
  - Verify atomicity and consistency for transactions involving Ethiopian payment systems.
  - Test database consistency after provider communication failures.
  - Test transaction logging and audit trail accuracy per NBE requirements.
- **Credit Assessment Testing (Alternative Data):**
  - Test risk scoring using alternative data specific to Ethiopian users (mobile money patterns, KYC
    data).
  - Verify consistent application of credit policies based on alternative data.
  - Test edge cases (e.g., users with sparse mobile money history, newly verified KYC).

## 6. AI Risk Assessment Testing (Ethiopian Context)

- **Model Evaluation:**
  - Test credit risk assessment models with standardized test datasets representing Ethiopian user
    profiles and alternative data.
  - Compare decisions against rule-based system or manual assessments.
  - Verify consistent risk scoring across similar Ethiopian profiles.
- **Mock Testing:**
  - Mock AI service responses for consistent test execution (both success and various failure/error
    modes).
  - Test fallback mechanisms (rule-based system) by forcing AI service failures.
- **Fairness Testing:**
  - Evaluate model outcomes across relevant Ethiopian demographic groups (using anonymized data if
    available).
  - Test for bias related to region, alternative data availability, etc.
  - Ensure compliance with NBE fair treatment guidelines.
- **Explainability Testing:**
  - Verify that credit decisions include appropriate explanations understandable to Ethiopian users
    (Amharic/English).
  - Test adverse action notice generation compliant with NBE rules.

## 7. Testing Environments

- **Local:** Developer machines for coding and initial testing.
- **CI:** Ephemeral environment for running automated tests.
- **Staging:** Mirrors production environment as closely as possible. Includes sandbox integrations
  with payment processors and credit bureaus.
- **Production:** Live environment for end-users with real financial transactions.

## 8. Test Data Management (Ethiopian Context)

- Create representative test data sets covering Ethiopian user scenarios (e.g., users with only
  Telebirr, users with Fayda vs. Passport, different income levels in ETB).
- Use seed data reflecting typical Ethiopian names, addresses, phone numbers.
- Never use production financial data or real PII/Fayda details in test environments.
- Define data cleanup procedures.
- Create synthetic Ethiopian customer profiles representing different risk categories based on
  alternative data (_e.g., using libraries like Faker.js configured for Ethiopian locales, combined
  with realistic alternative data patterns_).

## 9. Financial Edge Case Testing (Ethiopian Context)

- **Transaction Timing:**
  - Test transactions near statement cycles or due dates.
  - Simulate clock changes, time zone differences, and leap years.
- **Account Status Changes:**
  - Test transitions between good standing, delinquent, and default states based on ETB payments.
  - Verify grace period calculations and any applicable late fees (ensure proper disclosure and NBE
    compliance).
- **Limit Scenarios:**
  - Test transactions at or near credit limits.
  - Verify behavior when a user reaches maximum installment plans.
- **Fraud Scenarios:**
  - Test known fraud patterns specific to Ethiopian mobile money or identity systems.

## 10. Bug Triage & Management

- **Bug Severity Levels:**
  - **Critical:** System unavailable, financial data inconsistency, security breach, payment
    processing failures.
  - **High:** Major feature broken, significant performance issue impacting user experience.
  - **Medium:** Feature working incorrectly but with workarounds.
  - **Low:** Minor issues, cosmetic defects.

- **Bug Lifecycle:**
  - Identification → Documentation → Triage → Assignment → Fixing → Verification → Closure

## 11. Continuous Improvement

- Review test failures to identify testing gaps.
- Perform test retrospectives after major releases.
- Regularly refactor test code to maintain quality.
- Update testing standards as financial regulations evolve.
- Invest in improving test infrastructure and tooling for faster feedback.

## 12. Regulatory Compliance Testing (NBE & Ethiopian Laws)

- **Documentation Requirements:**
  - Verify required terms, conditions, and fee disclosures are presented correctly in Amharic and
    English.
  - Test that users must acknowledge terms before proceeding.
- **Notification Testing:**
  - Verify payment due reminders (Amharic/English) sent via SMS/Push comply with NBE rules.
  - Test communication of any changes to terms or fees.
- **Record Keeping:**
  - Test audit logs for completeness and accuracy per NBE requirements.
  - Verify retention of transaction histories (in ETB) for required periods.
- **KYC/AML Compliance:**
  - Test the KYC verification flow using Fayda/Passport/etc. against Proclamation 1176/2020
    requirements.
  - Verify AML checks if applicable.
