# Git Branch Protection Rules Setup

## Overview

This document defines the branch protection rules that must be configured for the Meqenet 2.0
repository to ensure code quality, security, and compliance with our development governance
framework.

**Task Reference**: FND-GIT-02 - Define and enforce branch protection rules for 'main' and 'develop'
**Personas**: FinTech DevOps Engineer, Financial Software Architect, Financial QA Specialist

## Branch Protection Strategy

### Main Branch Protection (Production)

The `main` branch represents production-ready code and must be protected with the highest level of
security:

#### Required Settings:

- **Restrict pushes to matching branches**: ✅ Enabled
- **Require pull request reviews before merging**: ✅ Enabled
  - Required approving reviews: **2** (minimum)
  - Dismiss stale reviews: ✅ Enabled
  - Require review from code owners: ✅ Enabled
  - Require approval of most recent reviewable push: ✅ Enabled

#### Status Checks:

- **Require status checks to pass before merging**: ✅ Enabled
- **Require branches to be up to date before merging**: ✅ Enabled
- **Required status checks**:
  - `ci/lint` - ESLint and Prettier checks
  - `ci/test` - Unit and integration tests
  - `ci/security-scan` - Security vulnerability scanning
  - `ci/build` - Build verification
  - `ci/type-check` - TypeScript compilation

#### Additional Restrictions:

- **Restrict pushes that create files**: ✅ Enabled
- **Require linear history**: ✅ Enabled (no merge commits)
- **Allow force pushes**: ❌ Disabled
- **Allow deletions**: ❌ Disabled

### Develop Branch Protection (Staging)

The `develop` branch serves as integration branch for feature development:

#### Required Settings:

- **Restrict pushes to matching branches**: ✅ Enabled
- **Require pull request reviews before merging**: ✅ Enabled
  - Required approving reviews: **1** (minimum)
  - Dismiss stale reviews: ✅ Enabled
  - Require review from code owners: ✅ Enabled

#### Status Checks:

- **Require status checks to pass before merging**: ✅ Enabled
- **Required status checks**:
  - `ci/lint` - ESLint and Prettier checks
  - `ci/test` - Unit tests (minimum)
  - `ci/security-scan` - Security vulnerability scanning
  - `ci/build` - Build verification

#### Additional Restrictions:

- **Allow force pushes**: ❌ Disabled
- **Allow deletions**: ❌ Disabled

## Implementation Steps

### 1. GitHub Repository Setup

After creating the repository on GitHub, navigate to: `Settings > Branches > Add rule`

### 2. Configure Main Branch Protection

1. Branch name pattern: `main`
2. Enable all required settings listed above
3. Add required status checks (will be available after CI setup)

### 3. Configure Develop Branch Protection

1. Branch name pattern: `develop`
2. Enable required settings listed above
3. Add required status checks

### 4. Create Develop Branch

```bash
git checkout -b develop
git push -u origin develop
```

## Compliance Requirements

### NBE (National Bank of Ethiopia) Compliance

- All financial logic changes require **mandatory code review**
- KYC/AML related code requires **security team approval**
- Payment processing changes require **architecture team approval**

### Security Requirements

- **No direct commits** to protected branches
- **Mandatory security scanning** before merge
- **Audit trail** for all production changes
- **Vulnerability scanning** in CI pipeline

### Quality Gates

- **100% passing tests** required
- **No linting errors** allowed
- **TypeScript compilation** must succeed
- **Security scan** must pass

## Emergency Procedures

### Hotfix Process

1. Create hotfix branch from `main`
2. Implement critical fix
3. Create PR with `hotfix` label
4. Require **2 approvals** (including security team for security fixes)
5. Merge to `main` and `develop`

### Override Procedures

- Repository administrators can override branch protection
- **Must document** override reason in PR
- **Must notify** security team for security-related overrides
- **Must create** follow-up task for proper fix

## Monitoring and Compliance

### Audit Requirements

- **Monthly review** of branch protection compliance
- **Quarterly security audit** of protection rules
- **Annual compliance** review for NBE requirements

### Reporting

- **Weekly reports** on failed protection attempts
- **Monthly metrics** on code review coverage
- **Quarterly assessment** of protection effectiveness

---

**Important**: These rules are mandatory for compliance with Ethiopian financial regulations and
internal security standards. Any exceptions must be approved by the Security Team and documented in
the Architecture Decision Records (ADRs).
