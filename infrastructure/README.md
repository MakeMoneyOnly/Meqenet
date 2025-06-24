# Infrastructure as Code for Meqenet.et

## Overview

This directory contains **Infrastructure as Code (IaC)** configurations for managing Meqenet.et's
Git repository security and compliance requirements. Our implementation follows **FinTech industry
standards** and **NBE regulatory requirements**.

## 🏗️ Architecture

```mermaid
graph TB
    A[Terraform Configuration] --> B[GitHub Repository]
    B --> C[Branch Protection Rules]
    B --> D[Team Management]
    B --> E[Compliance Webhooks]

    C --> F[Main Branch: 2 Approvals]
    C --> G[Develop Branch: 1 Approval]
    C --> H[Security Branches: Enhanced]

    D --> I[Financial Architects]
    D --> J[Security Specialists]
    D --> K[Compliance Officers]

    E --> L[NBE Audit Trail]
    E --> M[Security Monitoring]
    E --> N[Change Tracking]
```

## 📁 Directory Structure

```
infrastructure/
├── github-repository-management.tf    # Main Terraform configuration
├── terraform.tfvars.example          # Example variables file
├── deploy-github-protection.sh       # Deployment script
├── gitlab-vs-github-comparison.md    # Platform comparison
└── README.md                         # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Terraform** (>= 1.0)
2. **GitHub Personal Access Token** with admin:repo permissions
3. **jq** (for JSON processing in deployment script)

### Deployment Steps

```bash
# 1. Navigate to infrastructure directory
cd infrastructure/

# 2. Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your GitHub details

# 3. Make deployment script executable (Linux/Mac)
chmod +x deploy-github-protection.sh

# 4. Deploy branch protection
./deploy-github-protection.sh

# 5. Verify deployment
terraform output branch_protection_summary
```

### Windows Deployment

```cmd
# For Windows users, run Terraform commands directly:
terraform init
terraform workspace new production
terraform plan -out=tfplan
terraform apply tfplan
```

## 🔐 Security Features

### Branch Protection Rules

| Branch        | Required Reviews | Status Checks      | Special Rules                 |
| ------------- | ---------------- | ------------------ | ----------------------------- |
| **main**      | 2 approvals      | 25+ checks         | Linear history, no force push |
| **develop**   | 1 approval       | 9 checks           | Code owner review required    |
| **staging**   | 1 approval       | 5 checks           | Emergency deployment allowed  |
| **security/** | 2 approvals      | 5+ security checks | Restricted dismissals         |
| **release/**  | 1 approval       | 4 checks           | Version validation            |

### FinTech-Specific Status Checks

**Payment & Financial Logic:**

- ✅ Payment Calculation Tests
- ✅ Interest Rate Validation
- ✅ Currency Precision Tests (ETB)
- ✅ Financial Logic Audit

**Ethiopian Compliance:**

- ✅ NBE Compliance Check
- ✅ Fayda ID Format Validation
- ✅ Ethiopian Regulations Validation
- ✅ AML/KYC Validation

**Ethiopian Payment Gateways:**

- ✅ Telebirr Integration Test
- ✅ Chapa Gateway Test
- ✅ SantimPay Integration Test
- ✅ ArifPay Integration Test

**Localization:**

- ✅ Amharic Support Validation
- ✅ Ethiopian Date Format
- ✅ Currency Display (ETB)

## 👥 Team Management

### GitHub Teams Created

| Team                              | Access Level | Responsibilities               |
| --------------------------------- | ------------ | ------------------------------ |
| **financial-software-architects** | Admin        | Core financial logic oversight |
| **data-security-specialists**     | Admin        | Security and compliance        |
| **compliance-risk-officers**      | Maintain     | NBE regulation compliance      |
| **senior-backend-developers**     | Push         | Backend microservices          |
| **senior-mobile-developers**      | Push         | React Native & frontend        |
| **fintech-devops-engineers**      | Admin        | Infrastructure & deployment    |

### CODEOWNERS Integration

Our configuration automatically integrates with the `.github/CODEOWNERS` file to ensure:

- Financial logic changes require architect approval
- Security changes require security specialist review
- Payment integrations require compliance officer sign-off

## 📊 Compliance & Monitoring

### Webhook Configuration

Automatic compliance monitoring through webhooks:

```json
{
  "events": [
    "push",
    "pull_request",
    "pull_request_review",
    "branch_protection_rule",
    "security_advisory"
  ],
  "url": "https://compliance-monitor.meqenet.et/webhook"
}
```

### Audit Trail Features

- **Immutable History**: Linear history enforcement on main branch
- **Change Documentation**: All changes tracked and documented
- **Security Events**: Real-time monitoring of security-relevant events
- **Compliance Reporting**: Automated reports for NBE audits

## 🔧 Configuration

### Environment Variables

```bash
# GitHub Configuration
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
GITHUB_ORGANIZATION="meqenet-et"
REPOSITORY_NAME="meqenet"

# Webhook Configuration
WEBHOOK_SECRET="your-webhook-secret-here"
```

### Terraform Workspaces

We use separate workspaces for environment isolation:

- **development**: Dev environment settings
- **staging**: Pre-production configuration
- **production**: Live environment (requires confirmation)

### Customization

To modify branch protection rules, edit `github-repository-management.tf`:

```hcl
# Example: Add new status check
resource "github_branch_protection" "main" {
  required_status_checks {
    contexts = [
      # Add your new status check here
      "CI/YourNewCheck/ValidationName"
    ]
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

**1. Authentication Errors**

```bash
# Verify GitHub token permissions
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

**2. Terraform State Issues**

```bash
# Reset Terraform state if needed
terraform workspace delete production
terraform workspace new production
```

**3. Permission Denied**

```bash
# Ensure token has admin:repo and admin:org permissions
# Verify organization membership and permissions
```

### Validation Commands

```bash
# Check Terraform configuration
terraform validate

# Preview changes
terraform plan

# Check current protection rules
terraform show

# List workspaces
terraform workspace list
```

## 📚 Benefits of Infrastructure as Code

### 1. **NBE Compliance**

- **Audit Trail**: All changes version-controlled and tracked
- **Reproducible**: Exact same configuration across environments
- **Documentation**: Configuration serves as documentation
- **Change Management**: Formal review process for all changes

### 2. **Security Benefits**

- **Consistency**: No manual configuration drift
- **Version Control**: All security rules are version-controlled
- **Rollback**: Easy rollback to previous configurations
- **Review Process**: All changes go through code review

### 3. **Operational Excellence**

- **Automation**: Reduces manual errors
- **Scalability**: Easy to apply to multiple repositories
- **Maintenance**: Centralized configuration management
- **Disaster Recovery**: Quick restoration of repository settings

### 4. **Ethiopian FinTech Requirements**

- **Regulatory Compliance**: Built-in NBE compliance checks
- **Local Validation**: Ethiopian-specific payment gateway tests
- **Cultural Considerations**: Amharic support validation
- **Legal Requirements**: Ethiopian data protection compliance

## 🌍 Ethiopian Context

### Why This Matters for Ethiopia

1. **Regulatory Environment**: Ethiopia's financial sector is highly regulated
2. **NBE Requirements**: National Bank of Ethiopia has strict audit requirements
3. **Cultural Sensitivity**: Amharic language and local customs matter
4. **Economic Development**: Supporting Ethiopia's digital transformation

### Local Compliance Features

- **Fayda ID Integration**: Validation for Ethiopian national ID system
- **Ethiopian Payment Rails**: Support for local payment providers
- **Birr Currency**: Proper ETB currency handling and display
- **Local Regulations**: Built-in checks for Ethiopian financial laws

## 🔄 Continuous Improvement

### Regular Reviews

- **Monthly**: Review team permissions and access
- **Quarterly**: Update status checks and requirements
- **Annually**: Full security audit and compliance review

### Monitoring

- **Real-time**: Webhook-based monitoring
- **Weekly**: Repository activity reports
- **Monthly**: Compliance dashboard reviews

## 📞 Support

For issues with this infrastructure configuration:

1. **Check logs**: Review Terraform output and GitHub audit logs
2. **Validate configuration**: Run `terraform validate` and `terraform plan`
3. **Review documentation**: Check this README and inline comments
4. **Team escalation**: Contact the FinTech DevOps Engineers team

## 🚨 Emergency Procedures

### Emergency Access

In case of critical issues:

1. **Emergency Team**: `meqenet-et/emergency-response-team` can bypass some restrictions
2. **Staging Branch**: Allows emergency hotfixes with relaxed rules
3. **Admin Override**: Repository admins can temporarily modify protection rules

### Disaster Recovery

```bash
# 1. Restore from backup
terraform init
terraform workspace select production

# 2. Apply last known good configuration
terraform apply

# 3. Verify all protection rules
terraform output branch_protection_summary
```

---

**Remember**: This infrastructure is critical for Meqenet.et's security and compliance. All changes
should be reviewed by the Financial Software Architects and Security Specialists teams.
