# Code Review Checklist - {{SERVICE_NAME}}

## 1. Formal Sign-off (Mandatory)

This section serves as a formal, auditable sign-off by the reviewer. By checking these boxes, the
reviewer attests that the changes meet our core enterprise-grade standards.

- `[ ]` **Security:** No hardcoded secrets are present. All inputs are validated. Sensitive data is
  not logged or improperly exposed. The changes adhere to our secure coding practices.
- `[ ]` **Compliance:** The change adheres to all relevant NBE data handling, consumer protection,
  and financial logic requirements.
- `[ ]` **API Contract:** The code correctly implements and adheres to the agreed-upon
  `openapi.yaml` or `gRPC` contract. Any changes are versioned correctly.
- `[ ]` **Testing:** The change is accompanied by meaningful unit and integration tests that cover
  critical paths and edge cases, achieving sufficient coverage.
- `[ ]` **Observability:** Logs are structured, correlated with a request ID, and provide sufficient
  context for debugging production issues without exposing sensitive data.
- `[ ]` **Readability:** The code is clear, well-documented, follows our project's style guide, and
  is maintainable by the rest of the team.

---

## 2. Service Information

**Service**: `{{service_slug}}`  
**Domain**: {{service_domain}}  
**Reviewer**: {{reviewer_name}}  
**PR Number**: {{pr_number}}  
**Review Date**: {{review_date}}

## 3. Pre-Review Automated Checks

### CI/CD Pipeline Status

- [ ] All automated tests pass
- [ ] Build completes successfully
- [ ] Security scans pass (SAST/DAST)
- [ ] Dependency vulnerability scans pass
- [ ] Code quality metrics meet thresholds
- [ ] Ethiopian compliance checks pass

### Feature-Sliced Architecture Validation

- [ ] Proper feature boundaries maintained
- [ ] No cross-feature imports (features can only import from shared/entities)
- [ ] Dependency direction respected (app → pages → widgets → features → entities → shared)
- [ ] Feature public API compliance via index.ts
- [ ] Error handling isolation maintained

## Financial Logic Review (Critical for BNPL Platform)

### Payment Processing Accuracy

- [ ] **Pay in 4**: Interest-free installment calculations correct
- [ ] **Pay in 30**: Interest-free 30-day payment logic accurate
- [ ] **Pay Over Time**: 15-22% APR calculations verified
- [ ] **Pay in Full**: Buyer protection logic implemented
- [ ] Currency handling follows ETB precision (2 decimal places)
- [ ] Rounding follows Ethiopian banking standards

### Interest and Fee Calculations

- [ ] Interest rate application is mathematically correct
- [ ] Compound vs. simple interest properly implemented
- [ ] Late fee calculations follow business rules
- [ ] Early payment discounts calculated correctly
- [ ] Commission calculations for merchants accurate
- [ ] Tax calculations and reporting correct

### Financial Compliance & NBE Regulatory Requirements

- [ ] **NBE Directive No. SBB/102/2024 compliance** (Ethiopian BNPL regulations)
- [ ] **NBE institutional licensing** verification and compliance checks
- [ ] **Consumer credit disclosure** in both Amharic and English (required by law)
- [ ] **Interest rate caps enforced** (22% maximum as per NBE regulations)
- [ ] **Ethiopian Birr (ETB) precision handling** (2 decimal places, banker's rounding)
- [ ] **Transaction reporting to NBE** within required timeframes (24-48 hours)
- [ ] **AML/CFT compliance** with Ethiopian financial intelligence laws
- [ ] **Consumer protection measures** per NBE consumer protection directives
- [ ] **Islamic finance compliance** (Sharia-compliant alternatives available)
- [ ] **Audit trail for financial calculations** maintained for NBE inspection
- [ ] **Data residency compliance** (Ethiopian financial data must remain in-country)
- [ ] **Cross-border transaction reporting** for forex compliance
- [ ] **KYC/eKYC using Fayda National ID only** (no other ID types accepted)
- [ ] **Financial reporting accuracy** verified against NBE reporting standards

## Security & Privacy Review

### Authentication & Authorization

- [ ] JWT tokens properly validated and secured
- [ ] Role-based access control (RBAC) correctly implemented
- [ ] Session management follows security best practices
- [ ] Multi-factor authentication (MFA) properly integrated
- [ ] Password policies enforced
- [ ] Account lockout mechanisms implemented

### Data Protection

- [ ] Sensitive data encrypted at rest and in transit
- [ ] Fayda National ID data properly secured and encrypted
- [ ] Payment method data follows PCI DSS standards
- [ ] PII handling complies with Ethiopian data protection laws
- [ ] Data retention policies implemented
- [ ] Secure data deletion procedures followed

### API Security

- [ ] Input validation and sanitization implemented
- [ ] Output encoding prevents XSS attacks
- [ ] SQL injection protection in place
- [ ] Rate limiting configured appropriately
- [ ] CORS policies properly configured
- [ ] API versioning and deprecation handled securely

### Ethiopian-Specific Security

- [ ] Fayda eKYC integration follows security protocols
- [ ] Ethiopian payment provider integrations secured
- [ ] Local phone number validation implemented
- [ ] Cultural security considerations addressed
- [ ] NBE security requirements met

## Microservice Architecture & Integration

### Service Boundaries

- [ ] Service boundaries and bounded contexts respected
- [ ] Single responsibility principle maintained
- [ ] Database per service pattern followed
- [ ] No direct database sharing between services
- [ ] Event-driven communication properly implemented

### API Contracts

- [ ] OpenAPI 3.0 specification updated (for REST APIs)
- [ ] gRPC Protocol Buffers defined (for internal APIs)
- [ ] API versioning strategy followed
- [ ] Backward compatibility maintained
- [ ] Breaking changes properly versioned

### Inter-Service Communication

- [ ] Synchronous calls use gRPC with proper error handling
- [ ] Asynchronous communication uses event bus (SNS/SQS)
- [ ] Circuit breaker patterns implemented
- [ ] Timeout and retry policies configured
- [ ] Idempotency ensured for critical operations

### Resilience Patterns

- [ ] Graceful degradation implemented
- [ ] Bulkhead pattern for resource isolation
- [ ] Health checks properly configured
- [ ] Monitoring and alerting in place
- [ ] Disaster recovery procedures documented

## Ethiopian Market Adaptation

### Localization & Cultural Considerations

- [ ] Amharic language support implemented
- [ ] Ethiopian date/time formats supported
- [ ] Local currency formatting (ETB) correct
- [ ] Cultural business practices accommodated
- [ ] Ethiopian phone number formats supported
- [ ] Local address formats handled

### Payment Method Integration

- [ ] Telebirr integration properly implemented
- [ ] M-Pesa integration follows security protocols
- [ ] CBE Birr integration tested and verified
- [ ] HelloCash integration secure and functional
- [ ] ArifPay integration properly configured
- [ ] SantimPay integration tested
- [ ] Chapa payment gateway integration verified

### Regulatory Compliance

- [ ] NBE payment service regulations followed
- [ ] AML/KYC requirements implemented
- [ ] Consumer protection laws complied with
- [ ] Data protection regulations followed
- [ ] Financial reporting requirements met
- [ ] Audit trail completeness verified

## Performance & Scalability

### Database Optimization

- [ ] Database queries optimized and indexed
- [ ] N+1 query problems avoided
- [ ] Connection pooling properly configured
- [ ] Database migrations backward compatible
- [ ] Data archiving strategies implemented
- [ ] Query performance monitoring in place

### API Performance

- [ ] Response times meet SLA requirements
- [ ] Pagination implemented for large datasets
- [ ] Caching strategies appropriate and effective
- [ ] Resource usage optimized
- [ ] Load testing performed and passed
- [ ] Performance monitoring configured

### Scalability Considerations

- [ ] Horizontal scaling patterns implemented
- [ ] Auto-scaling policies configured
- [ ] Resource limits and quotas set
- [ ] Performance bottlenecks identified and addressed
- [ ] Capacity planning documented
- [ ] Monitoring and alerting for scalability metrics

## Testing & Quality Assurance

### Test Coverage

- [ ] Unit tests cover all business logic (minimum 80%)
- [ ] Integration tests validate service interactions
- [ ] End-to-end tests cover critical user journeys
- [ ] Security tests validate authentication/authorization
- [ ] Performance tests validate response times
- [ ] Ethiopian-specific scenarios tested

### Test Quality

- [ ] Tests are deterministic and reliable
- [ ] Test data is realistic and representative
- [ ] Edge cases and error conditions covered
- [ ] Mocking strategies appropriate
- [ ] Test documentation clear and comprehensive
- [ ] Continuous testing pipeline configured

### Quality Metrics

- [ ] Code coverage thresholds met
- [ ] Code quality metrics acceptable
- [ ] Security vulnerability count acceptable
- [ ] Performance benchmarks met
- [ ] Accessibility standards followed (WCAG 2.1 AA)
- [ ] Documentation completeness verified

## Documentation & Communication

### Code Documentation

- [ ] Code is self-documenting with clear naming
- [ ] Complex business logic properly commented
- [ ] API documentation updated and accurate
- [ ] README files comprehensive and current
- [ ] Architecture decisions documented (ADRs)
- [ ] Security considerations documented

### Ethiopian Context Documentation

- [ ] Local business rules documented
- [ ] Regulatory requirements clearly explained
- [ ] Cultural considerations noted
- [ ] Integration specifics documented
- [ ] Compliance procedures outlined
- [ ] Support contact information provided

## Service-Specific Checks

{{#if is_payment_service}}

### Payment Service Specific

- [ ] Payment state machine correctly implemented
- [ ] Transaction idempotency ensured
- [ ] Payment reconciliation logic verified
- [ ] Refund and chargeback handling implemented
- [ ] Fraud detection integration tested
- [ ] Payment notification system functional {{/if}}

{{#if is_marketplace_service}}

### Marketplace Service Specific

- [ ] Product catalog search optimized
- [ ] Inventory management logic correct
- [ ] Merchant commission calculations accurate
- [ ] Order fulfillment workflow implemented
- [ ] Product recommendation engine functional
- [ ] Merchant settlement logic verified {{/if}}

{{#if is_auth_service}}

### Authentication Service Specific

- [ ] User registration workflow secure
- [ ] Password reset mechanism secure
- [ ] Account verification process implemented
- [ ] Social login integration secure
- [ ] Session management optimized
- [ ] User profile management functional {{/if}}

{{#if is_analytics_service}}

### Analytics Service Specific

- [ ] Data anonymization properly implemented
- [ ] Privacy-preserving analytics enabled
- [ ] Real-time data processing optimized
- [ ] Data warehouse integration functional
- [ ] Reporting accuracy verified
- [ ] ML model integration tested {{/if}}

## Deployment & Operations

### Deployment Readiness

- [ ] Containerization (Docker) properly configured
- [ ] Environment variables properly managed
- [ ] Secrets management implemented
- [ ] Health check endpoints functional
- [ ] Logging configuration appropriate
- [ ] Monitoring and metrics collection enabled

### Production Considerations

- [ ] Resource requirements documented
- [ ] Scaling policies defined
- [ ] Backup and recovery procedures documented
- [ ] Incident response procedures updated
- [ ] Rollback procedures tested
- [ ] Support documentation current

## Final Review Sign-off

### Required Approvals

- [ ] **Code Owner**: @{{code_owner}} ✅/❌
- [ ] **Financial Logic Reviewer**: @{{financial_reviewer}} ✅/❌ (if applicable)
- [ ] **Security Specialist**: @{{security_reviewer}} ✅/❌ (if applicable)
- [ ] **Architecture Reviewer**: @{{architecture_reviewer}} ✅/❌ (if applicable)
- [ ] **Compliance Officer**: @{{compliance_reviewer}} ✅/❌ (if applicable)

### Final Checklist

- [ ] All automated checks pass
- [ ] All manual review items addressed
- [ ] No outstanding security concerns
- [ ] Ethiopian compliance verified
- [ ] Documentation updated
- [ ] Deployment plan reviewed

## Comments & Recommendations

### Security Considerations

```
[Security reviewer comments and recommendations]
```

### Financial Logic Validation

```
[Financial logic reviewer comments and validation]
```

### Ethiopian Compliance Notes

```
[Compliance reviewer comments and regulatory considerations]
```

### Architecture Feedback

```
[Architecture reviewer comments and recommendations]
```

### Performance Recommendations

```
[Performance-related feedback and optimization suggestions]
```

## Review Outcome

- [ ] **APPROVED** - Ready for merge
- [ ] **APPROVED WITH CONDITIONS** - Minor issues to address
- [ ] **CHANGES REQUIRED** - Significant issues need resolution
- [ ] **REJECTED** - Major problems, requires redesign

**Overall Risk Assessment**: 🟢 Low / 🟡 Medium / 🟠 High / 🔴 Critical

**Reviewer Signature**: {{reviewer_name}}  
**Review Completed**: {{completion_date}}  
**Next Review Required**: {{next_review_date}} (if applicable)

---

**Template Version**: 1.0  
**Last Updated**: {{template_last_updated}}  
**Service Documentation**: [{{service_slug}} README](./README.md)
