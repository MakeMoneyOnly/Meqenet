# Error Handling Strategy (Meqenet.et Ethiopia)

## Overview

This document outlines the error handling strategy for the Meqenet BNPL platform, specifically
addressing challenges in the Ethiopian market such as variable network conditions and integration
with local payment systems (Telebirr, HelloCash, etc.). **All error handling must prevent the
exposure of sensitive financial or system details to the user, aligning with modern FinTech security
standards and NBE guidelines.**

**Error Handling in a Microservice Architecture:** Each microservice is responsible for its own
error handling. However, the system as a whole must be resilient to failures in individual services.
This guide defines patterns for inter-service communication failures, data consistency, and graceful
degradation.

> **Related Documentation:**
>
> - [AI Integration](./18-AI_Integration.md): Handling errors from AI services
> - [API Documentation](./19-API_Documentation_Strategy.md): API error response formats
> - [Testing Guidelines](./22-Testing_Guidelines.md): Testing error scenarios
> - [Security](../Stage%201%20-%20Foundation/07-Security.md): Security and NBE compliance
>   requirements
> - `.cursorrules`: Core security and quality coding standards for the project.

## 1. General Error Handling Approach

### Transaction Integrity:

- Ensure atomicity of financial transactions
- Implement compensating transactions for partial failures
- Maintain detailed audit logs for all financial operations

### Retry Logic:

- Implement exponential backoff for transient errors
- Limit maximum retries (3-5 typically sufficient)
- Add jitter to prevent thundering herd problems

### Fallback Mechanisms:

- Alternative Ethiopian payment providers (e.g., try HelloCash if Telebirr fails) where feasible and
  configured.
- Cached validation rules (e.g., for basic input checks) when services are down.
- Offline capabilities for viewing transaction history and payment schedules.

### Error Categorization:

- Transient vs. Permanent errors
- User errors vs. System errors vs. Financial service errors
- Security-related errors requiring special handling

## 2. Distributed System Error Patterns

In addition to general error handling, our microservice architecture requires specific patterns to
ensure resilience:

- **Timeouts:** All synchronous internal communication (gRPC) and external API calls must have
  aggressive, configurable timeouts to prevent requests from hanging and consuming resources.
- **Retries with Exponential Backoff:** For transient, idempotent operations, clients should retry
  failed requests. Retries must implement exponential backoff with jitter to avoid overwhelming a
  recovering service.
- **Circuit Breakers:** Each service must implement a circuit breaker for its dependencies. If a
  downstream service consistently fails, the circuit breaker will "trip" and fail fast, preventing
  cascading failures and allowing the dependency time to recover.
- **Compensating Transactions (Sagas):** For operations that span multiple services, we will use the
  saga pattern to ensure data consistency. If a step in the process fails, a series of compensating
  transactions will be executed to roll back the preceding steps.

## 3. Specific Error Scenarios (Ethiopian Context)

### Payment Processing Errors (Telebirr, HelloCash, etc.):

- Clear user feedback for declined transactions (in Amharic/English), differentiating provider
  errors from Meqenet issues.
- Map specific error codes from Telebirr/HelloCash/etc. APIs to user-friendly messages.
- Handle scenarios like insufficient mobile money balance, inactive account, or provider system
  downtime.
- Provide actionable recovery steps (e.g., "Top up your Telebirr account", "Try again later",
  "Contact Telebirr support").

### Network Failures (Ethiopian Mobile Networks):

- Assume variable network quality. Design for intermittent connectivity.
- Queue critical actions (like payment initiation) for automatic retry when connectivity resumes.
- Implement local storage with robust sync mechanisms for essential data.
- Clear UI indicators of offline status and pending actions (Amharic/English).

### Data Validation Failures:

- Field-specific validation errors (e.g., invalid Ethiopian phone format, incorrect Fayda ID
  structure).
- Prevent form submission until critical errors are fixed.
- Distinguish between required fields and formatting issues.

### Authentication Failures:

- Secure handling of invalid credentials (phone number/password).
- Account lockout policies with clear user recovery path (SMS OTP to Ethiopian number).
- Session expiration handling with graceful re-authentication.

### KYC Verification Errors (Fayda National ID Only):

- Clear feedback if submitted **Fayda National ID documents** are unreadable or rejected by
  verification service (e.g., Didit) or internal checks.
- **No support for other identity documents** - clear messaging that only Fayda National ID is
  accepted.
- Guidance on how to resubmit Fayda National ID documents or contact support (Amharic/English).
- Handle errors related to provider (Didit) availability and Fayda ID verification services.

### NBE Compliance Errors:

- Internal errors flagged if a transaction violates a known NBE regulation.
- User message should be generic (e.g., "Transaction cannot be processed at this time"), while
  internal logs detail the compliance issue.

### Marketplace & Merchant Errors:

- Merchant onboarding validation failures (incomplete documentation, failed verification).
- Product catalog errors (invalid product data, image upload failures, pricing inconsistencies).
- Merchant payment processing failures (settlement issues, account verification problems).
- Inventory management errors (out of stock, quantity validation failures).

### Rewards & Cashback Errors:

- Cashback calculation discrepancies (rate miscalculations, eligibility issues).
- Meqenet Balance redemption failures (insufficient balance, invalid redemption requests).
- Loyalty tier calculation errors (points miscalculation, tier upgrade/downgrade issues).
- Partner merchant cashback synchronization failures.

### Premium Subscription Errors (Meqenet Plus):

- Subscription payment failures (payment method declined, insufficient funds).
- Feature access validation errors (attempting to use premium features without active subscription).
- Billing cycle processing errors (renewal failures, proration calculation issues).
- Subscription upgrade/downgrade processing failures.

### Virtual Card Errors:

- Card generation failures (limit exceeded, verification required).
- Transaction authorization errors (spending limit exceeded, merchant restrictions).
- Card management errors (freeze/unfreeze failures, limit adjustment issues).
- Security validation failures (suspicious activity detection, fraud prevention).

### Analytics & Insights Errors:

- Data processing failures (incomplete transaction data, calculation errors).
- Personalization engine errors (recommendation generation failures, user segmentation issues).
- Reporting generation failures (export errors, data aggregation issues).
- Privacy compliance errors (data anonymization failures, consent validation issues).

## 4. Error Handling by Service Domain

### Error Handling Structure by Service

```
services/
├── payments-service/
│   ├── src/
│   │   ├── error-handling/
│   │   │   ├── payment-exceptions.ts    # Custom exceptions for payments
│   │   │   └── provider-handler.ts    # Logic for handling Telebirr/HelloCash errors
│   │   └── ...
├── rewards-service/
│   ├── src/
│   │   ├── error-handling/
│   │   │   ├── rewards-exceptions.ts    # Custom exceptions for rewards
│   │   │   └── redemption-handler.ts    # Logic for handling redemption failures
│   │   └── ...
shared/
│   ├── lib/
│   │   ├── error-handling/
│   │   │   ├── base.exception.ts      # Base error classes for all services
│   │   │   ├── error-codes.ts         # Standardized internal error codes
│   │   │   └── middleware.ts          # Common error handling middleware (e.g., for Express/NestJS)
│   │   └── i18n/
│   │       ├── error-messages.ts      # Localized error messages (keys)
│   │       └── amharic-errors.ts      # Amharic error translations
```

### Service Error Isolation Rules

1.  **Service-Specific Errors:** Each microservice defines its own specific exceptions.
2.  **No Cross-Service Error Logic:** A service should not contain logic to handle the internal
    errors of another service. It should only handle communication failures (e.g., timeout,
    unavailable) from its dependencies.
3.  **Shared Error Utilities:** Common error classes and middleware are shared through the `shared`
    library.
4.  **Localized Error Messages:** All user-facing error messages support Amharic/English through
    i18n keys.
5.  **Propagate via Standard Codes:** Errors are propagated between services using standard gRPC
    status codes or well-defined error payloads in asynchronous messages.

## 5. Exception Framework (Ethiopian Context)

```javascript
// Base Exception for Financial Service issues
class FinancialServiceException extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'FinancialServiceException';
    // General code, can be overridden
    this.code = options.code || 'FINANCIAL_SERVICE_ERROR';
    this.isRetryable = options.isRetryable || false;
    // Default user message, should be localized (Amharic/English)
    this.userMessageKey = options.userMessageKey || 'error.payment.general'; // Key for i18n
    this.logDetails = options.logDetails || {}; // Additional info for logging
    // Specific provider involved (e.g., 'Telebirr', 'Didit')
    this.provider = options.provider;
  }
}

// Specific exception for Ethiopian payment provider issues
class EthiopianPaymentProviderException extends FinancialServiceException {
  constructor(provider, providerCode, message, options = {}) {
    super(message, {
      ...options,
      name: 'EthiopianPaymentProviderException',
      // Map provider-specific code if possible
      code: options.code || `PAYMENT_PROVIDER_${provider.toUpperCase()}_ERROR`,
      // Specific user message key based on provider and code
      userMessageKey:
        options.userMessageKey ||
        `error.payment.${provider.toLowerCase()}.${providerCode || 'general'}`,
      provider: provider,
      logDetails: { ...options.logDetails, providerCode }, // Log the original provider code
    });
  }
}

// Example: Telebirr insufficient balance
class TelebirrInsufficientFundsException extends EthiopianPaymentProviderException {
  constructor(providerCode, message, options = {}) {
    super('Telebirr', providerCode, message || 'Telebirr: Insufficient balance', {
      ...options,
      name: 'TelebirrInsufficientFundsException',
      code: 'INSUFFICIENT_FUNDS_TELEBIRR',
      userMessageKey: 'error.payment.telebirr.insufficient_funds',
      isRetryable: false,
    });
  }
}

// Exception for KYC related issues
class KYCVerificationException extends FinancialServiceException {
  constructor(message, options = {}) {
    super(message, {
      ...options,
      name: 'KYCVerificationException',
      code: options.code || 'KYC_VERIFICATION_ERROR',
      userMessageKey: options.userMessageKey || 'error.kyc.general',
    });
  }
}

// Example: Fayda ID validation failure
class FaydaValidationException extends KYCVerificationException {
  constructor(message, options = {}) {
    super(message || 'Fayda ID validation failed', {
      ...options,
      name: 'FaydaValidationException',
      code: 'KYC_FAYDA_INVALID',
      userMessageKey: 'error.kyc.fayda_invalid',
      isRetryable: false,
    });
  }
}

// General Transaction Exception (e.g., internal logic failure)
class TransactionException extends FinancialServiceException {
  constructor(message, options = {}) {
    super(message, {
      ...options,
      name: 'TransactionException',
      code: options.code || 'TRANSACTION_ERROR',
      userMessageKey: options.userMessageKey || 'error.transaction.general',
    });
  }
}

// Example: Credit Limit Exceeded
class CreditLimitExceededException extends TransactionException {
  constructor(message, options = {}) {
    super(message || 'Credit limit exceeded', {
      ...options,
      name: 'CreditLimitExceededException',
      code: 'CREDIT_LIMIT_EXCEEDED',
      userMessageKey: 'error.transaction.credit_limit_exceeded',
      isRetryable: false,
    });
  }
}
```

- **Note:** Utilize internationalization (i18n) libraries (e.g., `i18next` with resource files for
  Amharic/English) to map `userMessageKey` to actual localized messages displayed to the user.

## 6. Client-Side Error Handling (Amharic/English Support)

### Form Validation:

- Real-time field validation as users type
- Clear error messages with resolution guidance
- Disabled submission buttons when form is invalid

### Network Error Detection:

- Online/offline state monitoring
- Retry strategies for important API calls
- Graceful degradation of features when offline

### Error Boundary Components:

- React error boundaries to prevent full app crashes.
- Fallback UI components with localized messages (Amharic/English).
- Automated error reporting to backend services including locale information.

### Example React Error Boundary:

```jsx
class FinancialComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Report to error tracking service
    errorReportingService.captureException(error, {
      extra: errorInfo,
      tags: { component: this.props.componentName },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h3>Something went wrong with this component.</h3>
          <button onClick={() => this.setState({ hasError: false })}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Fallback Mechanisms:

- Alternative Ethiopian payment providers (e.g., try HelloCash if Telebirr fails) where feasible and
  configured.
- Cached validation rules (e.g., for basic input checks) when services are down.
- Offline capabilities for viewing transaction history and payment schedules.
- Implement circuit breakers for critical external dependencies (e.g., payment gateways, AI
  services) to prevent cascading failures when they are unresponsive or erroring frequently.

### Error Categorization:

- Transient vs. Permanent errors
- User errors vs. System errors vs. Financial service errors
- Security-related errors requiring special handling

### Internal Error Details:

- Comprehensive logging of technical details
- Stack traces for developer debugging
- Correlation IDs to track request flow (e.g., generated via middleware at the API Gateway or
  service entry point, propagated through request headers/context, and included in all related
  logs).
- Alert thresholds for critical error rates

### Security Considerations:

- No exposure of database errors, stack traces, or system paths to users
- Sanitize all error messages before client display
- Generic messages for security-sensitive errors
- Detailed internal logging with appropriate access controls

## 7. Server-Side Error Handling

### API Error Responses:

- Consistent error response format (as defined in API Docs).
- Appropriate HTTP status codes.
- Detailed internal error codes (`code` from exceptions) for client handling.
- Use `userMessageKey` for client-side localization, avoid sending raw messages.

### Transaction Rollbacks:

- Automatic database transaction rollbacks on error
- Compensating transactions for distributed operations
- Event sourcing for critical financial operations

### Audit Logging:

- Log all financial transaction attempts (success and failure) with details of Ethiopian providers
  used.
- Record request/response details for troubleshooting, including provider-specific codes.
- Maintain NBE-compliant logging (no sensitive PII or payment details unless explicitly allowed and
  secured).

## 8. Monitoring & Metrics (Ethiopian Context)

### Service Health Metrics:

- API response times
- Error rates by endpoint
- Transaction success/failure ratio

### Financial Metrics:

- Payment success rates by Ethiopian provider (Telebirr vs. HelloCash, etc.).
- Average transaction processing time per provider.
- Fraud detection effectiveness (Ethiopian patterns).

### User Experience Metrics:

- Form completion rates
- Error occurrence by form field
- Recovery success after errors

## 9. Error Communication Guidelines (Amharic/English)

### User-Facing Error Messages:

- Clear, non-technical language in both Amharic and English (use i18n).
- Actionable next steps relevant to Ethiopian context (e.g., "Check your Telebirr balance").

### Internal Error Details:

- Comprehensive logging of technical details
- Stack traces for developer debugging
- Correlation IDs to track request flow (e.g., generated via middleware at the API Gateway or
  service entry point, propagated through request headers/context, and included in all related
  logs).
- Alert thresholds for critical error rates

### Security Considerations:

- No exposure of database errors, stack traces, or system paths to users
- Sanitize all error messages before client display
- Generic messages for security-sensitive errors
- Detailed internal logging with appropriate access controls
