# Meqenet.et Fintech Git Automation Script

🏦 **Enterprise-Grade Git Automation for Ethiopian BNPL Platform**

This directory contains a powerful Python script, `git-automation.py`, designed to automate the
entire development workflow with **NBE compliance**, **security-first approach**, and **audit
traceability** for Ethiopia's fintech industry standards.

## 🇪🇹 NBE Compliance & Governance

**CRITICAL**: This project enforces **National Bank of Ethiopia (NBE)** compliance requirements and
enterprise-grade security standards for financial software development.

📋 **Governance Documents**:

- [`FINTECH_BRANCHING_STRATEGY.md`](./FINTECH_BRANCHING_STRATEGY.md) - Complete branching strategy
- [`GIT_BRANCH_PROTECTION_SETUP.md`](../docs/GIT_BRANCH_PROTECTION_SETUP.md) - Branch protection
  rules

### 🛡️ Security & Compliance Features

- ✅ **GPG Signed Commits** - Mandatory for audit trails
- ✅ **Security Scanning** - Automated vulnerability detection
- ✅ **Branch Protection** - Enforced protection rules for main/develop
- ✅ **NBE Audit Tags** - Permanent security incident records
- ✅ **Conventional Commits** - Standardized commit message format
- ✅ **Email Domain Validation** - @meqenet.et compliance
- ✅ **Status Check Enforcement** - ci/lint, ci/test, ci/security-scan, ci/build, ci/type-check

## 🏗️ Architecture & Branch Strategy

```
main (production) 🔒 NBE Protected
├── develop (integration/staging) 🔒 NBE Protected
│   ├── feature/[TASK-ID]-[description] (new features)
│   ├── hotfix/[SEC|CRIT]-[ID]-[description] (urgent fixes)
│   ├── bugfix/[BUG-ID]-[description] (non-critical fixes)
│   └── release/v[major].[minor].[patch] (release preparation)
└── hotfix/[SEC|CRIT]-[ID]-[description] (emergency production fixes)
```

### Branch Naming Patterns (Enforced)

| Type            | Pattern                          | Example                                               | Base Branch |
| --------------- | -------------------------------- | ----------------------------------------------------- | ----------- |
| Feature         | `feature/[XXX-XX-XXX-NN]-[desc]` | `feature/FND-BE-AUTH-01-implement-fayda-verification` | develop     |
| Security Hotfix | `hotfix/SEC-[NN]-[desc]`         | `hotfix/SEC-01-fix-authentication-vulnerability`      | main        |
| Critical Hotfix | `hotfix/CRIT-[NN]-[desc]`        | `hotfix/CRIT-02-resolve-payment-gateway-timeout`      | main        |
| Bug Fix         | `bugfix/BUG-[NN]-[desc]`         | `bugfix/BUG-01-fix-user-profile-validation`           | develop     |
| Release         | `release/v[x.y.z]`               | `release/v1.2.0`                                      | develop     |

## Prerequisites

### Required Software

1. **Python 3.8+** with required packages (see requirements.txt)
2. **Git** with GPG signing configured
3. **GitHub CLI (`gh`)** authenticated with your account
4. **Node.js & pnpm** for quality checks and security scanning

### Required Configuration

```bash
# Git user configuration (mandatory)
git config --global user.name "Your Full Name"
git config --global user.email "your.email@meqenet.et"

# GPG signing (NBE compliance requirement)
git config --global user.signingkey <your-gpg-key-id>
git config --global commit.gpgsign true

# GitHub CLI authentication
gh auth login
```

## Installation

```bash
# Install Python dependencies
pip install -r tools/git/requirements.txt

# Verify installation
python tools/git/git-automation.py --help
```

## Commands Reference

### 🚀 Core Development Commands

#### 1. `start-task` - Start New Feature Development

Initializes work on a new task with full fintech compliance validation.

```bash
python tools/git/git-automation.py start-task <TASK_ID> [--base develop]
```

**Example:**

```bash
python tools/git/git-automation.py start-task FND-BE-AUTH-01
```

**What it does:**

- ✅ Validates task ID format (XXX-XX-XXX-NN)
- ✅ Creates feature branch with compliant naming
- ✅ Runs NBE compliance checks for critical tasks
- ✅ Updates task status to "In Progress" in tasks.yaml
- ✅ Sets up proper branch tracking

#### 2. `complete-task` - Finalize Development with Security Validation

Finalizes your work with comprehensive security and compliance checks.

```bash
python tools/git/git-automation.py complete-task
```

**What it does:**

- 🛡️ Runs mandatory security scanning (pnpm audit)
- ✅ Validates conventional commit message format
- 🔐 Creates GPG signed commit for audit compliance
- 📤 Pushes to remote with proper tracking
- 📝 Updates task status to "In Review"
- 📋 Provides next steps for PR creation

#### 3. `sync-task` - Sync with Latest Changes

Updates your feature branch with security validation.

```bash
python tools/git/git-automation.py sync-task [--target develop]
```

**What it does:**

- 🔍 Validates current branch name compliance
- 🛡️ Runs security checks for protected target branches
- 🔄 Performs clean rebase onto target branch
- 📥 Fetches latest changes from remote

### 🔄 Pull Request & Merge Commands

#### 4. `merge-task` - Merge with Branch Protection Enforcement

Merges approved PRs with full compliance validation.

```bash
python tools/git/git-automation.py merge-task <PR_NUMBER> [--target develop] [--skip-approval]
```

**Example:**

```bash
python tools/git/git-automation.py merge-task 123 --target develop
```

**What it does:**

- 🛡️ Enforces branch protection rules
- ✅ Validates required reviewers (2 for main, 1 for develop)
- 🔍 Checks all required status checks passed
- 🔄 Uses squash merge for clean history
- 🗑️ Automatically deletes merged branch

### 🔒 Security & Emergency Commands

#### 5. `close-security-branch` - NBE-Compliant Security Closure

Closes security branches with permanent audit trail.

```bash
python tools/git/git-automation.py close-security-branch <BRANCH_NAME> <INCIDENT_ID> "<DESCRIPTION>" [--skip-audit-tag]
```

**Example:**

```bash
python tools/git/git-automation.py close-security-branch \
  "hotfix/SEC-01-fix-authentication-vulnerability" \
  "SEC-01" \
  "Authentication vulnerability patched - CVE-2024-XXXX resolved"
```

**What it does:**

- 🔍 Validates security incident ID format (SEC-XX or CRIT-XX)
- 🛡️ Runs comprehensive security verification
- 📋 Creates NBE compliance audit tag with Ethiopian context
- ⬆️ Pushes permanent audit record to remote
- 🗑️ Performs clean branch deletion
- 📊 Provides mandatory next steps for compliance

#### 6. `emergency-rollback` - Production Emergency Procedures

Initiates emergency production rollback following NBE procedures.

```bash
python tools/git/git-automation.py emergency-rollback <TARGET> "<INCIDENT_DESCRIPTION>"
```

**Example:**

```bash
python tools/git/git-automation.py emergency-rollback v1.2.0 "Critical payment gateway failure affecting transactions"
```

**What it does:**

- 🚨 Creates emergency rollback branch with incident ID
- 📋 Provides step-by-step rollback guidance
- 🔍 Validates Git environment for emergency procedures
- 📝 Documents incident for compliance reporting

## 🔄 Complete Workflow Examples

### Standard Feature Development Workflow

```bash
# 1. Start new feature (with NBE compliance checks)
python tools/git/git-automation.py start-task FND-BE-AUTH-01

# 2. Development work...
# Write code, tests, documentation

# 3. Sync with latest develop (with security validation)
python tools/git/git-automation.py sync-task

# 4. Complete task (with security scanning & signed commits)
python tools/git/git-automation.py complete-task

# 5. Create PR on GitHub (manual step)
# - Ensure proper reviewers assigned
# - All status checks must pass

# 6. Merge after approval (with branch protection enforcement)
python tools/git/git-automation.py merge-task 123
```

### Security Incident Management Workflow

```bash
# 1. Create security hotfix branch manually or via emergency procedures
git checkout main
git checkout -b hotfix/SEC-01-fix-critical-vulnerability

# 2. Implement security fix...
# Apply patches, update dependencies, add tests

# 3. Complete security fix (with enhanced security validation)
python tools/git/git-automation.py complete-task

# 4. Emergency merge process (if critical)
python tools/git/git-automation.py merge-task 124 --target main

# 5. Close security branch with NBE audit trail
python tools/git/git-automation.py close-security-branch \
  "hotfix/SEC-01-fix-critical-vulnerability" \
  "SEC-01" \
  "Critical authentication vulnerability resolved - all systems secure"
```

### Bug Fix Workflow

```bash
# 1. Start bug fix
python tools/git/git-automation.py start-task BUG-01

# 2. Fix the bug...

# 3. Complete with testing
python tools/git/git-automation.py complete-task

# 4. Merge to develop
python tools/git/git-automation.py merge-task 125 --target develop
```

## 📋 Quality Gates & Compliance Checks

### Automated Security Validation

The script automatically runs these security checks:

- **Dependency Scanning**: `pnpm audit --audit-level moderate`
- **GPG Signature Validation**: Ensures all commits are signed
- **Branch Name Compliance**: Validates against fintech naming patterns
- **Email Domain Check**: Ensures @meqenet.et compliance
- **Status Check Enforcement**: All CI checks must pass

### Required Status Checks (GitHub)

These checks must pass before merging to protected branches:

- `ci/lint` - ESLint and Prettier checks
- `ci/test` - Unit and integration tests
- `ci/security-scan` - Security vulnerability scanning
- `ci/build` - Build verification
- `ci/type-check` - TypeScript compilation

### NBE Compliance Requirements

- **Signed Commits**: All commits must be GPG signed
- **Audit Trail**: Security incidents have permanent Git tag records
- **Review Requirements**: 2 reviewers for main, 1 for develop
- **Documentation**: All security closures require incident documentation
- **Email Validation**: Contributors must use @meqenet.et email addresses

## 🚨 Emergency Procedures

### Production Incident Response

1. **Immediate Assessment**: Identify scope and severity
2. **Emergency Rollback**: Use `emergency-rollback` command if needed
3. **Hotfix Creation**: Create hotfix branch from main
4. **Rapid Development**: Implement minimum viable fix
5. **Security Review**: Mandatory security team validation
6. **Emergency Deployment**: Fast-track through protection rules
7. **Post-Incident**: Complete security closure with audit trail

### Compliance Violations

If compliance violations are detected:

1. **Stop Development**: Address compliance issues immediately
2. **Security Review**: Escalate to security team
3. **Documentation**: Document violation and remediation
4. **Process Update**: Update procedures to prevent recurrence

## 🔧 Configuration & Customization

### Environment Variables

```bash
# Optional: Custom audit level for security scanning
export MEQENET_AUDIT_LEVEL="high"

# Optional: Custom email domain validation
export MEQENET_EMAIL_DOMAIN="meqenet.et"
```

### Git Hooks Integration

The script works with these Git hooks for additional compliance:

- **pre-commit**: Runs linting and basic security scans
- **pre-push**: Runs comprehensive tests and vulnerability scans
- **commit-msg**: Validates conventional commit format

## 📊 Monitoring & Reporting

### Compliance Metrics

The script tracks:

- Branch lifetime and complexity
- Security scan results
- Review coverage statistics
- NBE compliance adherence
- Incident response times

### Audit Trail

All security-related actions create permanent records:

- Git tags for security incident closures
- Signed commits for audit compliance
- Documented next steps for follow-up
- Integration with compliance reporting systems

## 🆘 Troubleshooting

### Common Issues

**GPG Signing Errors:**

```bash
# Setup GPG signing
gpg --list-secret-keys --keyid-format LONG
git config --global user.signingkey <KEY_ID>
```

**Security Scan Failures:**

```bash
# Update dependencies
pnpm update
pnpm audit --fix
```

**Branch Name Violations:**

```bash
# Check current branch
git branch --show-current

# Rename if needed
git branch -m new-compliant-branch-name
```

**Email Domain Issues:**

```bash
# Update Git email
git config --global user.email "your.name@meqenet.et"
```

## 📚 References

- [Ethiopian NBE Regulations](https://nbe.gov.et/)
- [FINTECH_BRANCHING_STRATEGY.md](./FINTECH_BRANCHING_STRATEGY.md)
- [GIT_BRANCH_PROTECTION_SETUP.md](../docs/GIT_BRANCH_PROTECTION_SETUP.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GPG Signing Guide](https://docs.github.com/en/authentication/managing-commit-signature-verification)

---

**Document Version**: v2.0  
**Last Updated**: 2025-01-10  
**Compliance**: NBE Ethiopian Financial Regulations  
**Security Level**: Enterprise Fintech Standards  
**Next Review**: 2025-04-10
