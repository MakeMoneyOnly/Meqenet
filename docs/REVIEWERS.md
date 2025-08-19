# Code Reviewers - {{SERVICE_NAME}}

## Service Overview

**Service**: `{{service_slug}}`  
**Domain**: {{service_domain}}  
**Criticality**: {{criticality_level}}  
**Ethiopian Compliance**: {{compliance_requirements}}

## Primary Reviewers

### Code Owners (Required Approval)

- **Lead**: @{{lead_reviewer}} ({{lead_role}})
- **Backup**: @{{backup_reviewer}} ({{backup_role}})

### Domain Specialists (Required for Specific Changes)

#### Financial Logic Reviewers (Required for Financial Calculations)

- **Senior Backend Developer**: @{{financial_logic_reviewer}}
- **Financial Software Architect**: @{{financial_architect}}
- **Compliance & Risk Officer**: @{{compliance_reviewer}} (for NBE compliance)

#### Security Reviewers (Required for Security-Sensitive Changes)

- **Data Security Specialist**: @{{security_specialist}}
- **Senior Backend Developer**: @{{security_backend_reviewer}}
- **Compliance & Risk Officer**: @{{security_compliance_reviewer}}

#### Ethiopian Market Reviewers (Required for Local Integrations)

- **Senior Backend Developer**: @{{ethiopian_integration_reviewer}}
- **Compliance & Risk Officer**: @{{nbe_compliance_reviewer}}
- **Product Manager**: @{{ethiopian_market_reviewer}}

#### Architecture Reviewers (Required for Cross-Service Changes)

- **Financial Software Architect**: @{{architecture_lead}}
- **Senior Backend Developer**: @{{architecture_backend}}
- **FinTech DevOps Engineer**: @{{architecture_devops}}

## Review Requirements by Change Type

### Critical Financial Features (2+ Approvals Required)

- Payment processing logic
- Interest calculations (Pay Over Time - 15-22% APR)
- Currency handling (ETB precision)
- Commission calculations
- Settlement processing
- Refund/dispute handling

**Required Reviewers:**

- Financial Software Architect
- Senior Backend Developer
- Compliance & Risk Officer (for NBE compliance)

### Security-Sensitive Features (Security Specialist Required)

- Authentication/authorization changes
- Fayda National ID processing
- Payment method integration
- Data encryption/storage
- API security implementations
- Audit logging

**Required Reviewers:**

- Data Security Specialist
- Financial Software Architect
- Senior Backend Developer

### Ethiopian Compliance Features (Compliance Specialist Required)

- NBE regulation implementation
- Fayda eKYC integration
- Ethiopian payment providers (Telebirr, M-Pesa, CBE Birr)
- Regulatory reporting
- Data protection compliance
- AML/KYC processes

**Required Reviewers:**

- Compliance & Risk Officer
- Senior Backend Developer
- Financial Software Architect

### Cross-Service Integration (Architecture Review Required)

- API contract changes (OpenAPI/gRPC)
- Database schema modifications
- Event bus integration
- Shared library updates
- Performance-critical components
- Service boundary changes

**Required Reviewers:**

- Financial Software Architect
- Senior Backend Developer
- FinTech DevOps Engineer

## Service-Specific Expertise

### {{SERVICE_NAME}} Domain Knowledge

{{#if is_payment_service}}

- **Payment Processing**: Understanding of Ethiopian payment landscape
- **Financial Calculations**: Interest, fees, currency precision
- **Regulatory Compliance**: NBE payment service regulations
- **Integration Patterns**: Payment gateway integrations {{/if}}

{{#if is_marketplace_service}}

- **E-commerce Logic**: Product catalog, inventory management
- **Merchant Operations**: Onboarding, settlement, commission
- **Search & Discovery**: Product search optimization
- **Order Management**: Fulfillment, tracking, returns {{/if}}

{{#if is_auth_service}}

- **Identity Management**: User authentication, authorization
- **Security Protocols**: JWT, OAuth 2.0, MFA
- **Ethiopian Identity**: Fayda National ID integration
- **Session Management**: Secure token handling {{/if}}

{{#if is_analytics_service}}

- **Data Privacy**: Anonymization, GDPR compliance
- **ML/AI Integration**: Model deployment, monitoring
- **Performance Optimization**: Query optimization, caching
- **Business Intelligence**: Metrics, reporting, dashboards {{/if}}

## Review Process

### 1. Automated Checks (Pre-Review)

- [ ] CI/CD pipeline passes
- [ ] Security scans complete
- [ ] Code quality metrics met
- [ ] Ethiopian compliance checks pass

### 2. Manual Review

- [ ] Code owner approval
- [ ] Domain specialist approval (if required)
- [ ] Security review (if required)
- [ ] Architecture review (if required)

### 3. Final Approval

- [ ] All required reviewers approved
- [ ] No outstanding comments
- [ ] Documentation updated
- [ ] Tests passing

## Emergency Review Process

For critical production fixes:

1. **Immediate Review**: Lead reviewer + 1 domain specialist
2. **Post-Fix Review**: Full review process within 24 hours
3. **Documentation**: Emergency change documentation required

## Contact Information

- **Service Lead**: {{lead_contact}}
- **Architecture Team**: {{architecture_contact}}
- **Security Team**: {{security_contact}}
- **Compliance Team**: {{compliance_contact}}

## Review Metrics

Track and improve:

- Review completion time
- Defect detection rate
- Security issue resolution
- Compliance audit results
- Ethiopian market adaptation effectiveness

---

**Last Updated**: {{last_updated}}  
**Version**: {{version}}  
**Service Documentation**: [{{service_slug}} README](./README.md)
