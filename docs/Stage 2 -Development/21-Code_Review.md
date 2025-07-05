# Code Review Guidelines (Meqenet.et Ethiopia)

## Overview

This document outlines comprehensive code review guidelines for the Meqenet BNPL platform, covering
the complete financial ecosystem including **all four payment options** from our business model: Pay
in 4 (interest-free), Pay in 30 (interest-free), Pay Over Time (6-24 months with 15-22% APR), and
Pay in Full Today with buyer protection. Code reviews are designed for modern FinTech standards and
ensure security, compliance, and quality across all platform components.

**Code Review in a Microservice Architecture:** Code reviews are organized by service domains (e.g.,
`payments-service`, `rewards-service`). Each service has dedicated owners and reviewers, but
cross-service changes require additional integration review. This ensures both service autonomy and
overall system integrity.

All code review processes must adhere to the security and quality standards outlined in
`.cursorrules`.

> **Related Documentation:**
>
> - [Architecture](../Stage%201%20-%20Foundation/08-Architecture.md): System architecture and
>   service boundaries
> - [Security](../Stage%201%20-%20Foundation/07-Security.md): Security standards and NBE compliance
>   requirements
> - [Testing Guidelines](./22-Testing_Guidelines.md): Testing requirements and quality assurance
> - [AI Integration](./18-AI_Integration.md): AI/ML code review considerations
> - [Error Handling](./20-Error_Handling.md): Error handling standards
> - `.cursorrules`: Core security and quality coding standards for the project

## Code Review by Service Domain

### Review Assignment by Service

**Core Financial Services:**

- **Authentication & Security (`auth-service`):** Senior security engineers, authentication
  specialists
- **BNPL Payment Processing (`bnpl-service`):** Payment systems experts, financial logic specialists
- **Credit Assessment (`credit-service`):** Risk management specialists, AI/ML engineers
- **KYC Verification (`kyc-service`):** Compliance specialists, Ethiopian regulation experts

**Marketplace & Commerce Services:**

- **Merchant Marketplace (`marketplace-service`):** E-commerce specialists, merchant integration
  experts
- **Product Catalog (`products-service`):** Product management specialists, search optimization
  experts
- **Order Management (`orders-service`):** Fulfillment specialists, logistics experts
- **Settlement Processing (`settlements-service`):** Financial operations specialists, merchant
  payment experts

**Customer Experience Services:**

- **Rewards & Loyalty (`rewards-service`):** Loyalty program specialists, gamification experts
- **Premium Features (`premium-service`):** Subscription specialists, customer success experts
- **Analytics & Insights (`analytics-service`):** Data scientists, privacy specialists
- **Virtual Cards (`virtual-cards-service`):** Card payment specialists, security experts
- **QR Payments (`qr-payments-service`):** Payment UX specialists, mobile payment experts

**Cross-Service & Foundational Concerns:**

- **Shared Libraries (`shared`):** Architecture specialists, senior engineers
- **API Gateway:** Backend specialists, integration experts
- **UI/UX Components:** Frontend specialists, design system experts

### Service-Specific Review Criteria

Each service should maintain specialized review criteria while adhering to common standards:

```
services/[service-name]/
├── REVIEWERS.md          # Service-specific reviewer assignments
└── REVIEW_CHECKLIST.md   # Service-specific review criteria (e.g., payment logic checks)
```

## Comprehensive Code Review Process

### 1. Pre-Review Automated Checks

**Feature-Sliced Architecture Validation:**

- Verify proper feature boundaries and no cross-feature imports
- Validate dependency direction (app → pages → widgets → features → entities → shared)
- Check feature public API compliance
- Ensure proper error handling isolation

**Financial Logic Validation (All Payment Options):**

- Interest calculation accuracy for Pay Over Time options (6-24 months)
- Payment schedule generation for all four payment options
- Currency handling and ETB precision (2 decimal places)
- Financing terms compliance and disclosure requirements

**Ethiopian Market Compliance:**

- Fayda National ID format validation and processing
- NBE regulation compliance checks
- Ethiopian payment method integration (Telebirr, M-Pesa, etc.)
- Amharic language support and localization

**Security & Privacy Checks:**

- Sensitive data handling across all features
- API security and authentication
- Data encryption and secure storage
- Cross-feature data access controls

### 2. Feature-Specific Review Focus Areas

**Authentication & Security Review:**

- Multi-factor authentication implementation
- Session management and token security
- Password policies and secure storage
- Ethiopian phone number validation
- Fayda National ID security handling

**BNPL Payment Processing Review:**

- Payment plan calculation accuracy (all four options)
- Interest rate application and disclosure
- Installment scheduling and processing
- Payment method integration security
- Transaction state management
- Refund and dispute handling

**Marketplace & E-commerce Review:**

- Merchant onboarding and verification
- Product catalog management and search
- Order processing and fulfillment
- Inventory management and availability
- Merchant settlement calculations
- Commission and fee processing

**Rewards & Loyalty Review:**

- Cashback calculation accuracy
- Loyalty tier progression logic
- Meqenet Balance management
- Redemption process security
- Fraud prevention in rewards
- Cross-feature reward attribution

**Premium Features Review:**

- Subscription billing accuracy
- Feature access control
- Premium benefit calculation
- Churn prevention logic
- Usage analytics and insights
- Billing cycle management

**Virtual Cards Review:**

- Card generation and security
- Spending limit enforcement
- Merchant restriction implementation
- Transaction authorization logic
- Fraud detection integration
- Card lifecycle management

**QR Payments Review:**

- QR code generation security
- Payment processing accuracy
- Merchant matching logic
- Transaction verification
- Fraud prevention measures
- User experience optimization

**Analytics & Insights Review:**

- Data privacy and anonymization
- Spending pattern analysis accuracy
- AI recommendation logic
- Performance optimization
- Data retention policies
- Cross-feature data integration

### 3. Comprehensive Review Checklist

**Financial Accuracy & Compliance:**

- [ ] All payment calculations are accurate and tested
- [ ] Interest rates and fees are correctly applied and disclosed
- [ ] Currency handling follows Ethiopian standards (ETB precision)
- [ ] NBE regulatory requirements are met
- [ ] Financing terms are clearly disclosed and compliant
- [ ] Tax calculations and reporting are accurate
- [ ] Merchant commission calculations are correct

**Security & Privacy:**

- [ ] Sensitive data is properly encrypted and stored
- [ ] API endpoints have appropriate authentication and authorization
- [ ] Cross-feature data access is properly controlled
- [ ] PII handling follows Ethiopian data protection laws
- [ ] Fayda National ID data is securely processed
- [ ] Payment method data is properly secured
- [ ] Audit logging is comprehensive and secure

**Microservice Architecture & Integration:**

- [ ] Service boundaries and bounded contexts are respected.
- [ ] API contracts (OpenAPI for REST, `.proto` for gRPC) are clear, versioned, and
      backward-compatible.
- [ ] Inter-service communication uses appropriate patterns (e.g., events for async, gRPC for sync).
- [ ] Resilience patterns (timeouts, retries, circuit breakers) are correctly implemented.
- [ ] Database schema changes are managed via migrations and are backward-compatible within a
      service's deployment.
- [ ] Shared libraries are used appropriately and updated with care.

**Ethiopian Market Adaptation:**

- [ ] Ethiopian phone number formats are supported
- [ ] Local payment methods are properly integrated
- [ ] Amharic language support is implemented
- [ ] Cultural considerations are addressed
- [ ] Local business practices are accommodated
- [ ] Regulatory compliance is maintained

**Performance & Scalability:**

- [ ] Database queries are optimized
- [ ] API response times meet requirements
- [ ] Cross-feature data access is efficient
- [ ] Caching strategies are implemented
- [ ] Resource usage is monitored
- [ ] Scalability considerations are addressed

**Testing & Quality:**

- [ ] Unit tests cover all business logic
- [ ] Integration tests validate cross-feature interactions
- [ ] End-to-end tests cover critical user journeys
- [ ] Security tests validate authentication and authorization
- [ ] Performance tests validate response times
- [ ] Accessibility tests ensure inclusive design

### 4. Review Approval Requirements

**Critical Financial Features (Requires 2+ Approvals):**

- Core payment processing (`bnpl-service`)
- Credit assessment (`credit-service`)
- Settlement processing (`settlements-service`)
- Interest calculation and disclosure
- Merchant commission calculations

**Security-Sensitive Features (Requires Security Specialist Approval):**

- Authentication and authorization (`auth-service`)
- KYC verification (`kyc-service`)
- Virtual card management (`virtual-cards-service`)
- Fraud detection and prevention
- Data encryption and privacy

**Cross-Feature Integration (Requires Architecture Review):**

- Shared utilities and APIs
- Feature boundary changes
- Database schema modifications
- API contract changes
- Performance-critical components

**Ethiopian Compliance Features (Requires Compliance Specialist Approval):**

- NBE regulation implementation
- Fayda National ID processing
- Ethiopian payment method integration
- Regulatory reporting and auditing
- Data protection compliance

### 5. Specialized Review Types

**Financial Logic Review:**

- Payment calculation accuracy
- Interest rate application
- Currency conversion and precision
- Tax calculation and reporting
- Commission and fee processing
- Refund and dispute handling

**Security Review:**

- Threat modeling and risk assessment
- Penetration testing recommendations
- Vulnerability assessment
- Compliance validation
- Incident response procedures
- Security monitoring and alerting

**Performance Review:**

- Load testing and scalability
- Database optimization
- API performance monitoring
- Resource utilization analysis
- Caching strategy evaluation
- Infrastructure scaling recommendations

**Compliance Review:**

- NBE regulation adherence
- Ethiopian data protection laws
- AML/KYC compliance
- Financial reporting requirements
- Audit trail completeness
- Regulatory change impact assessment

### 6. Review Quality Metrics

**Feature-Specific Metrics:**

- Code coverage by feature
- Security vulnerability count by feature
- Performance benchmarks by feature
- Compliance score by feature
- Cross-feature integration quality

**Overall Quality Metrics:**

- Review completion time
- Defect detection rate
- Security issue resolution time
- Compliance audit results
- Customer satisfaction scores
- System reliability metrics

### 7. Continuous Improvement

**Review Process Enhancement:**

- Regular review process retrospectives
- Reviewer training and certification
- Tool and automation improvements
- Best practice documentation
- Knowledge sharing sessions
- Cross-feature collaboration workshops

**Ethiopian Market Adaptation:**

- Regular compliance updates
- Local market research integration
- Cultural sensitivity training
- Regulatory change monitoring
- Customer feedback integration
- Market trend analysis

This comprehensive code review process ensures that all features of the Meqenet.et ecosystem
maintain high quality, security, and compliance standards while serving the unique needs of the
Ethiopian market across all four payment options and comprehensive feature set.
