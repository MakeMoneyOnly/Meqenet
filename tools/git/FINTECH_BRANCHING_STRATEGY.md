# Meqenet.et Fintech Branching Strategy

**Enterprise-Grade Git Workflow for Ethiopian BNPL Platform**

## 🏦 Overview

This document defines the Git branching strategy for Meqenet.et, an Ethiopian Buy Now Pay Later
(BNPL) fintech platform. This strategy ensures NBE compliance, audit traceability, and
enterprise-grade security standards.

## 📋 Branch Hierarchy

```
main (production)
├── develop (integration/staging)
│   ├── release/v[major].[minor].[patch] (release preparation)
│   ├── feature/[TASK-ID]-[description] (new features)
│   ├── hotfix/[SEC|CRIT]-[ID]-[description] (urgent fixes)
│   └── bugfix/[BUG-ID]-[description] (non-critical fixes)
└── hotfix/[SEC|CRIT]-[ID]-[description] (emergency production fixes)
```

## 🏷️ Branch Naming Convention

### **Production Branch**

- **`main`**: Production-ready code deployed to live environment
  - Protected branch with strict merge policies
  - Requires signed commits for audit compliance
  - All code must pass security scans and NBE compliance checks

### **Integration Branch**

- **`develop`**: Integration branch for testing and staging
  - Code deployed to staging environment
  - All features merged here before release
  - Continuous integration and automated testing

### **Feature Branches**

- **`feature/[TASK-ID]-[description]`**: New feature development
  - **Format**: `feature/FND-BE-DB-01-integrate-prisma-orm`
  - **Source**: Created from `develop`
  - **Target**: Merged back to `develop`
  - **Examples**:
    - `feature/FND-BE-AUTH-01-implement-fayda-id-verification`
    - `feature/FND-FE-UI-02-create-dashboard-components`
    - `feature/FND-BE-PAY-03-integrate-cbe-payment-gateway`

### **Security/Critical Hotfixes**

- **`hotfix/[SEC|CRIT]-[ID]-[description]`**: Urgent security or critical fixes
  - **Format**: `hotfix/SEC-01-update-vitest-esbuild-vulnerability`
  - **Source**: Created from `main` (production fixes) or `develop` (pre-production)
  - **Target**: Merged to both `main` and `develop`
  - **Examples**:
    - `hotfix/SEC-01-fix-authentication-bypass`
    - `hotfix/CRIT-02-resolve-payment-gateway-timeout`
    - `hotfix/SEC-03-patch-dependency-vulnerabilities`

### **Bug Fixes**

- **`bugfix/[BUG-ID]-[description]`**: Non-critical bug fixes
  - **Format**: `bugfix/BUG-01-fix-user-profile-validation`
  - **Source**: Created from `develop`
  - **Target**: Merged back to `develop`

### **Release Branches**

- **`release/v[major].[minor].[patch]`**: Release preparation
  - **Format**: `release/v1.2.0`
  - **Source**: Created from `develop`
  - **Target**: Merged to both `main` and `develop`

## 🔄 Workflow Processes

### **1. Feature Development Workflow**

```bash
# 1. Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/FND-BE-AUTH-01-implement-fayda-verification

# 2. Development work
# ... code changes ...

# 3. Regular sync with develop
git checkout develop
git pull origin develop
git checkout feature/FND-BE-AUTH-01-implement-fayda-verification
git rebase develop

# 4. Complete feature
git push origin feature/FND-BE-AUTH-01-implement-fayda-verification
# Create PR: feature branch → develop
```

### **2. Security Hotfix Workflow**

```bash
# 1. Create hotfix from main (for production issues)
git checkout main
git pull origin main
git checkout -b hotfix/SEC-01-fix-authentication-vulnerability

# 2. Apply security fix
# ... security patches ...

# 3. Deploy hotfix
git push origin hotfix/SEC-01-fix-authentication-vulnerability
# Create PR: hotfix → main (emergency production deployment)
# Create PR: hotfix → develop (ensure fix is in next release)
```

### **3. Release Workflow**

```bash
# 1. Create release branch
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Finalize release (version bumps, documentation)
# ... release preparation ...

# 3. Deploy release
git push origin release/v1.2.0
# Create PR: release → main (production deployment)
# Create PR: release → develop (merge back any release fixes)
```

## 🛡️ Security & Compliance Requirements

### **Branch Protection Rules**

#### **Main Branch Protection**

- Require pull request reviews (minimum 2 reviewers)
- Require signed commits for audit trail
- Require status checks to pass:
  - Security scan (no vulnerabilities)
  - All tests passing
  - Code coverage > 80%
  - NBE compliance validation
- Dismiss stale reviews when new commits are pushed
- Restrict pushes to users with write permissions

#### **Develop Branch Protection**

- Require pull request reviews (minimum 1 reviewer)
- Require status checks to pass:
  - All tests passing
  - Linting and formatting checks
  - Security scan (no critical vulnerabilities)
- Allow force pushes from administrators only

### **Commit Requirements**

- **Signed Commits**: All commits must be GPG signed for audit compliance
- **Conventional Commits**: Follow conventional commit format for automated changelog generation
- **Security Scanning**: All commits scanned for secrets and vulnerabilities

### **Merge Strategies**

- **Main**: Squash and merge (clean history for production)
- **Develop**: Merge commit (preserve feature branch history)
- **Hotfix**: Fast-forward merge when possible

## 📝 Task Integration

### **Task-to-Branch Mapping**

All branches must correspond to tasks in `tasks/tasks.yaml`:

```yaml
# Example task structure
- id: 'FND-BE-AUTH-01'
  name: 'Implement Fayda ID Verification'
  branch: 'feature/FND-BE-AUTH-01-implement-fayda-verification'
  status: 'In Progress'
  assignee: 'developer@meqenet.et'
  security_review_required: true
  nbe_compliance_check: true
```

### **Automated Branch Creation**

Use Git automation tools to ensure compliance:

```bash
# Automated feature start
python tools/git/git-automation.py start-task FND-BE-AUTH-01

# Automated hotfix creation
python tools/git/git-automation.py start-hotfix SEC-01-authentication-vulnerability
```

## 🚨 Emergency Procedures

### **Critical Security Incident Response**

1. **Immediate Response**: Create hotfix branch from `main`
2. **Rapid Development**: Apply minimum viable fix
3. **Security Review**: Mandatory security team review
4. **Emergency Deployment**: Deploy to production immediately
5. **Post-Incident**: Full security audit and documentation

### **Production Rollback Procedure**

1. **Identify Issue**: Monitor alerts and user reports
2. **Create Rollback Branch**: `hotfix/ROLLBACK-[incident-id]`
3. **Revert Changes**: Git revert problematic commits
4. **Emergency Deploy**: Fast-track through approval process
5. **Root Cause Analysis**: Full incident post-mortem

## 📊 Metrics & Monitoring

### **Branch Health Metrics**

- Branch lifetime (features should be < 2 weeks)
- Number of commits per branch
- Code review coverage
- Security scan results
- Time to merge ratio

### **Compliance Tracking**

- Audit trail completeness
- Signed commit percentage
- Security review coverage
- NBE regulation compliance status

## 🔧 Git Automation Integration

The Git automation tools (`tools/git/git-automation.py`) enforce this branching strategy:

- **Automatic branch naming validation**
- **Task status synchronization**
- **Security check enforcement**
- **NBE compliance validation**
- **Automated PR creation with proper reviewers**

## 📚 References

- [Ethiopian NBE Regulations](https://nbe.gov.et/)
- [Git Flow Documentation](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Signed Commits Guide](https://docs.github.com/en/authentication/managing-commit-signature-verification)

---

**Document Version**: v1.0  
**Last Updated**: 2025-01-10  
**Approved By**: CTO, Security Team, Compliance Officer  
**Next Review**: 2025-04-10
