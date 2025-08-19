# Code Review Templates Usage Guide

## Overview

This guide explains how to use the standardized code review templates (`REVIEWERS.md` and
`REVIEW_CHECKLIST.md`) for Meqenet's Ethiopian BNPL platform microservices. These templates ensure
consistent, thorough code reviews that maintain security, compliance, and quality standards across
all services.

## Template Files

### Core Templates

- **`templates/REVIEWERS.md`** - Service reviewer assignment template
- **`templates/REVIEW_CHECKLIST.md`** - Comprehensive review checklist template

### Example Implementations

- **`backend/services/auth-service/REVIEWERS.md`** - Authentication service example
- **`backend/services/auth-service/REVIEW_CHECKLIST.md`** - Authentication service example

## Quick Setup for New Services

### 1. Copy Templates to Service Directory

When creating a new microservice, copy the templates:

```bash
# For a new service (e.g., payment-service)
mkdir -p backend/services/payment-service
cp templates/REVIEWERS.md backend/services/payment-service/
cp templates/REVIEW_CHECKLIST.md backend/services/payment-service/
```

### 2. Customize Service-Specific Information

Replace template placeholders with actual service information:

#### REVIEWERS.md Customization

```markdown
# Replace these placeholders:

{{SERVICE_NAME}} → "Payment Processing Service" {{service_slug}} → "payment-service"
{{service_domain}} → "Payment & Financial Transactions" {{criticality_level}} → "Critical (Tier 1)"
{{compliance_requirements}} → "NBE Payment Regulations, PCI DSS"

# Assign actual team members:

{{lead_reviewer}} → "@john-doe-meqenet" {{backup_reviewer}} → "@jane-smith-meqenet"
{{financial_logic_reviewer}} → "@financial-expert" {{security_specialist}} → "@security-lead"
```

#### REVIEW_CHECKLIST.md Customization

```markdown
# Replace these placeholders:

{{SERVICE_NAME}} → "Payment Processing Service" {{service_slug}} → "payment-service"
{{service_domain}} → "Payment & Financial Transactions"

# Add service-specific checks in the conditional sections
```

## Service-Specific Customization Guide

### Financial Services (payment-service, bnpl-service, credit-service)

**Key Focus Areas:**

- Payment calculation accuracy
- Interest rate compliance (15-22% APR cap)
- Currency precision (ETB 2 decimal places)
- NBE regulatory compliance
- Financial audit trails

**Additional Checklist Items:**

```markdown
### Financial Service Specific

- [ ] Payment state machine correctly implemented
- [ ] Interest calculations verified with test cases
- [ ] Currency conversion accuracy tested
- [ ] NBE reporting requirements met
- [ ] Financial reconciliation logic validated
- [ ] Fraud detection patterns implemented
```

### Security Services (auth-service, kyc-service)

**Key Focus Areas:**

- Authentication security
- Fayda National ID processing
- Data encryption and privacy
- Session management
- Multi-factor authentication

**Additional Checklist Items:**

```markdown
### Security Service Specific

- [ ] JWT token security validated
- [ ] Fayda ID encryption verified
- [ ] Session management optimized
- [ ] MFA implementation tested
- [ ] Account lockout mechanisms functional
- [ ] Security audit logging enabled
```

### Marketplace Services (marketplace-service, products-service, orders-service)

**Key Focus Areas:**

- E-commerce logic
- Merchant operations
- Product catalog management
- Order fulfillment
- Search optimization

**Additional Checklist Items:**

```markdown
### Marketplace Service Specific

- [ ] Product catalog search optimized
- [ ] Merchant commission calculations accurate
- [ ] Inventory management logic correct
- [ ] Order workflow state machine validated
- [ ] Search performance benchmarks met
- [ ] Merchant settlement logic verified
```

### Analytics Services (analytics-service, rewards-service)

**Key Focus Areas:**

- Data privacy and anonymization
- ML/AI model integration
- Performance optimization
- Business intelligence
- Loyalty program logic

**Additional Checklist Items:**

```markdown
### Analytics Service Specific

- [ ] Data anonymization properly implemented
- [ ] ML model integration tested
- [ ] Privacy-preserving analytics enabled
- [ ] Reporting accuracy verified
- [ ] Performance optimization validated
- [ ] Loyalty tier calculations correct
```

## Ethiopian-Specific Customization

### Regulatory Compliance Sections

All services must include Ethiopian-specific compliance checks:

```markdown
### Ethiopian Compliance Requirements

- [ ] NBE regulations specific to service domain
- [ ] Fayda National ID integration (if applicable)
- [ ] Ethiopian payment provider integrations
- [ ] Local phone number validation (+251)
- [ ] Amharic localization support
- [ ] Cultural business practice accommodation
```

### Payment Provider Integration

For services integrating with Ethiopian payment providers:

```markdown
### Ethiopian Payment Providers

- [ ] Telebirr integration secure and functional
- [ ] M-Pesa integration tested
- [ ] CBE Birr integration verified
- [ ] HelloCash integration secure
- [ ] ArifPay integration configured
- [ ] SantimPay integration tested
- [ ] Chapa payment gateway verified
```

## Reviewer Assignment Guidelines

### Core Reviewer Roles

#### Financial Software Architect

- **Responsibilities**: Architecture decisions, cross-service integration, financial logic
  validation
- **Required for**: API contract changes, database schema modifications, financial calculations
- **Expertise**: System architecture, financial domain knowledge, Ethiopian market understanding

#### Senior Backend Developer

- **Responsibilities**: Code quality, performance, security implementation
- **Required for**: All code changes, performance-critical components
- **Expertise**: Backend development, microservices, Ethiopian technical landscape

#### Data Security Specialist

- **Responsibilities**: Security validation, encryption, privacy compliance
- **Required for**: Security-sensitive changes, data handling, authentication
- **Expertise**: Cybersecurity, data protection, Ethiopian privacy laws

#### Compliance & Risk Officer

- **Responsibilities**: Regulatory compliance, risk assessment, audit requirements
- **Required for**: Financial features, compliance-related changes, regulatory reporting
- **Expertise**: NBE regulations, Ethiopian financial law, risk management

#### Financial QA Specialist

- **Responsibilities**: Financial logic testing, calculation validation, user acceptance
- **Required for**: Payment processing, interest calculations, financial reporting
- **Expertise**: Financial testing, Ethiopian banking practices, quality assurance

### Service-Specific Assignments

#### Critical Services (Tier 1)

- **Services**: auth-service, payment-service, bnpl-service, credit-service
- **Required Reviewers**: 2+ approvals including security specialist
- **Review SLA**: 4 hours for critical fixes, 24 hours for regular changes

#### High-Priority Services (Tier 2)

- **Services**: marketplace-service, kyc-service, settlement-service
- **Required Reviewers**: Code owner + domain specialist
- **Review SLA**: 8 hours for urgent, 48 hours for regular changes

#### Standard Services (Tier 3)

- **Services**: analytics-service, rewards-service, notification-service
- **Required Reviewers**: Code owner approval
- **Review SLA**: 72 hours for regular changes

## Review Process Workflow

### 1. Pre-Review Preparation

**Developer Checklist:**

- [ ] All automated tests pass
- [ ] Security scans complete
- [ ] Documentation updated
- [ ] Ethiopian compliance verified
- [ ] Performance benchmarks met

### 2. Review Assignment

**Automatic Assignment:**

- GitHub CODEOWNERS file automatically assigns reviewers
- Service-specific REVIEWERS.md defines required specialists
- Critical changes trigger additional security/compliance reviews

### 3. Review Execution

**Reviewer Process:**

1. Use service-specific REVIEW_CHECKLIST.md
2. Focus on assigned domain expertise
3. Validate Ethiopian compliance requirements
4. Provide constructive feedback
5. Approve or request changes

### 4. Final Approval

**Approval Requirements:**

- All required reviewers approved
- No outstanding security concerns
- Ethiopian compliance verified
- Documentation complete
- Tests passing

## Continuous Improvement

### Template Updates

**Quarterly Reviews:**

- Update templates based on lessons learned
- Incorporate new Ethiopian regulatory requirements
- Add emerging security best practices
- Refine service-specific criteria

**Version Control:**

- Track template versions
- Document changes and rationale
- Communicate updates to all teams
- Provide migration guides for existing services

### Metrics and Feedback

**Track Review Quality:**

- Review completion time
- Defect detection rate
- Security issue resolution
- Ethiopian compliance scores
- Developer satisfaction

**Feedback Collection:**

- Regular retrospectives with review teams
- Developer feedback on template effectiveness
- Compliance team input on regulatory coverage
- Security team assessment of threat coverage

## Troubleshooting

### Common Issues

#### Template Placeholder Not Replaced

**Problem**: Template still shows `{{SERVICE_NAME}}` **Solution**: Search and replace all `{{}}`
placeholders with actual values

#### Missing Service-Specific Sections

**Problem**: Generic checklist doesn't cover service domain **Solution**: Add conditional sections
for service type (payment, auth, marketplace, etc.)

#### Reviewer Assignment Conflicts

**Problem**: Required reviewer unavailable **Solution**: Use backup reviewers defined in
REVIEWERS.md, escalate to architecture team

#### Ethiopian Compliance Gaps

**Problem**: Missing local regulatory requirements **Solution**: Consult compliance team, update
templates with specific NBE requirements

### Support Contacts

- **Template Issues**: architecture@meqenet.et
- **Review Process**: devops@meqenet.et
- **Ethiopian Compliance**: compliance@meqenet.et
- **Security Questions**: security@meqenet.et

## Example Service Setup

### Creating a New BNPL Service

```bash
# 1. Create service directory
mkdir -p backend/services/bnpl-service

# 2. Copy templates
cp templates/REVIEWERS.md backend/services/bnpl-service/
cp templates/REVIEW_CHECKLIST.md backend/services/bnpl-service/

# 3. Customize REVIEWERS.md
sed -i 's/{{SERVICE_NAME}}/BNPL Processing Service/g' backend/services/bnpl-service/REVIEWERS.md
sed -i 's/{{service_slug}}/bnpl-service/g' backend/services/bnpl-service/REVIEWERS.md
sed -i 's/{{service_domain}}/BNPL Payment Processing/g' backend/services/bnpl-service/REVIEWERS.md
sed -i 's/{{criticality_level}}/Critical (Tier 1)/g' backend/services/bnpl-service/REVIEWERS.md

# 4. Customize REVIEW_CHECKLIST.md
sed -i 's/{{SERVICE_NAME}}/BNPL Processing Service/g' backend/services/bnpl-service/REVIEW_CHECKLIST.md
sed -i 's/{{service_slug}}/bnpl-service/g' backend/services/bnpl-service/REVIEW_CHECKLIST.md
sed -i 's/{{service_domain}}/BNPL Payment Processing/g' backend/services/bnpl-service/REVIEW_CHECKLIST.md

# 5. Add to version control
git add backend/services/bnpl-service/REVIEWERS.md
git add backend/services/bnpl-service/REVIEW_CHECKLIST.md
git commit -m "Add code review templates for bnpl-service"
```

---

**Document Version**: 1.0  
**Last Updated**: 2024-12-28  
**Maintained by**: Financial Software Architect Team  
**Review Cycle**: Quarterly
