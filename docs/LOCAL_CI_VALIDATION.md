# Local CI/CD Validation for Meqenet.et

This document describes the comprehensive local validation tools available to catch CI/CD issues
before pushing to the remote repository. These tools help ensure code quality, security compliance,
and Ethiopian NBE regulatory requirements.

## Overview

The local validation suite includes multiple tools to replicate our GitHub Actions CI/CD pipeline
locally:

- **Comprehensive Python Validator** (`governance/local_ci_validator.py`)
- **Git Automation Integration** (`tools/git/git-automation.py`)
- **Convenient Shell Scripts** (for quick validation)

## Quick Start

### Windows Users

```bash
# Full validation
scripts\validate-before-push.bat

# Quick validation (essential checks only)
scripts\validate-before-push.bat --quick

# Auto-fix issues and validate
scripts\validate-before-push.bat --auto-fix

# Security-only checks
scripts\validate-before-push.bat --security-only
```

### Unix/Linux/macOS Users

```bash
# Full validation
./scripts/validate-before-push.sh

# Quick validation (essential checks only)
./scripts/validate-before-push.sh --quick

# Auto-fix issues and validate
./scripts/validate-before-push.sh --auto-fix

# Security-only checks
./scripts/validate-before-push.sh --security-only
```

## Advanced Validation

### Python Comprehensive Validator

For detailed validation with progress tracking and comprehensive reporting:

```bash
# Full comprehensive validation
python governance/local_ci_validator.py

# Quick validation (essential checks only)
python governance/local_ci_validator.py --quick

# Security-focused validation
python governance/local_ci_validator.py --security-only

# Parallel execution for faster validation
python governance/local_ci_validator.py --parallel
```

### Git Automation Integration

```bash
# Run local CI validation through git automation
python tools/git/git-automation.py validate-ci

# Quick validation
python tools/git/git-automation.py validate-ci --quick

# Complete pre-push check with auto-fixes
python tools/git/git-automation.py pre-push-check --auto-fix
```

## Validation Categories

### 1. Code Quality

- **ESLint**: TypeScript/JavaScript linting
- **TypeScript Compilation**: Build verification
- **Code Formatting**: Prettier formatting checks

### 2. Security Analysis

- **Dependency Audit**: Vulnerability scanning
- **Secrets Scanning**: Credential exposure checks
- **OWASP Compliance**: Advanced security analysis

### 3. Testing Suite

- **Unit Tests**: Individual component testing
- **Integration Tests**: Database and service integration
- **E2E Tests**: End-to-end functionality validation

### 4. Ethiopian Fintech Compliance

- **NBE Compliance**: Ethiopian banking regulations
- **Fayda ID Validation**: National ID integration security
- **AML/KYC Requirements**: Anti-money laundering compliance

### 5. Build & Deployment

- **Docker Builds**: Container build validation
- **Prisma Schema**: Database schema verification
- **Infrastructure**: Terraform validation

### 6. Documentation

- **Link Validation**: Documentation integrity
- **License Compliance**: Open source license compatibility

## Validation Modes

### Quick Mode (`--quick`)

Runs essential checks only (faster execution):

- Code formatting and linting
- Security audit
- Basic unit tests
- TypeScript compilation

**Use when**: Making frequent small commits or in development iterations.

### Security-Only Mode (`--security-only`)

Focuses on security and compliance:

- Dependency vulnerability scanning
- Secrets detection
- NBE compliance validation
- Fayda ID integration security

**Use when**: Before security-sensitive changes or compliance reviews.

### Full Mode (default)

Comprehensive validation including all categories:

- All code quality checks
- Complete security analysis
- Full test suite execution
- Compliance validation
- Build verification

**Use when**: Before pushing feature branches or preparing for production.

## Auto-Fix Capabilities

The validation tools can automatically fix common issues:

```bash
# Auto-fix with shell script
./scripts/validate-before-push.sh --auto-fix

# Auto-fix with git automation
python tools/git/git-automation.py pre-push-check --auto-fix
```

**Auto-fixes include**:

- Code formatting (Prettier)
- Linting issues (ESLint --fix)
- Import organization
- Basic TypeScript issues

## Reports and Logging

### Detailed Reports

All validation runs generate detailed JSON reports:

- `governance/logs/local_ci_validation_report.json` - Comprehensive validation results
- `governance/logs/local_ci_validation.log` - Execution logs

### Report Contents

- Validation summary with success rates
- Category-wise breakdown
- Failed check details with error messages
- Performance metrics and duration
- Recommendations for fixes

## Integration with Development Workflow

### Recommended Workflow

1. **During Development**:

   ```bash
   # Quick validation for rapid iteration
   python governance/local_ci_validator.py --quick
   ```

2. **Before Committing**:

   ```bash
   # Auto-fix and validate
   ./scripts/validate-before-push.sh --auto-fix
   ```

3. **Before Pushing**:
   ```bash
   # Comprehensive validation
   python tools/git/git-automation.py pre-push-check
   ```

### Git Hooks Integration

You can integrate these tools with Git hooks for automatic validation:

#### Pre-commit Hook (`.git/hooks/pre-commit`)

```bash
#!/bin/bash
# Run quick validation before each commit
python governance/local_ci_validator.py --quick
```

#### Pre-push Hook (`.git/hooks/pre-push`)

```bash
#!/bin/bash
# Run comprehensive validation before push
python tools/git/git-automation.py pre-push-check
```

## Troubleshooting

### Common Issues

#### Dependency Vulnerabilities

```bash
# Update dependencies
pnpm update --latest

# Check for remaining vulnerabilities
pnpm audit --audit-level moderate
```

#### Formatting Issues

```bash
# Auto-fix formatting
pnpm run format:write

# Check formatting
pnpm run format:check
```

#### Test Failures

```bash
# Run specific test file
pnpm test path/to/test.spec.ts

# Run with coverage
pnpm test --coverage
```

#### TypeScript Errors

```bash
# Check TypeScript errors
pnpm run build

# Check specific service
pnpm run --filter=backend/services/auth-service build
```

### Performance Optimization

#### Parallel Execution

Use `--parallel` flag for faster validation:

```bash
python governance/local_ci_validator.py --parallel
```

#### Skip Non-Essential Checks

For development iterations:

```bash
./scripts/validate-before-push.sh --quick --skip-tests
```

## Environment Requirements

### Required Tools

- **Node.js** (LTS version)
- **pnpm** (package manager)
- **Python 3.8+**
- **Git**

### Optional Tools

- **Docker** (for container build validation)
- **Terraform** (for infrastructure validation)

### Dependencies

All Python dependencies are included in the main project. The validation tools use:

- Standard library modules (no external dependencies)
- Project's existing pnpm/npm ecosystem

## Security Considerations

### Sensitive Data Protection

- All validation tools are designed to avoid logging sensitive information
- Fayda National ID data is handled with encryption
- Security scan results are logged securely

### Compliance Validation

- NBE (National Bank of Ethiopia) regulatory requirements
- Ethiopian data protection laws
- Financial services security standards
- AML/KYC compliance checks

## Support and Maintenance

### Updates

The validation tools are automatically updated with the project. No separate maintenance required.

### Customization

You can customize validation checks by modifying:

- `governance/local_ci_validator.py` - Add/remove validation checks
- `tools/git/git-automation.py` - Modify security scanning
- Shell scripts - Adjust workflow for team preferences

### Issue Reporting

If validation tools report false positives or miss important checks:

1. Review the detailed JSON report
2. Check the execution logs
3. Update the validation rules as needed
4. Document any Ethiopian-specific requirements

## Examples

### Complete Pre-Push Workflow

```bash
# 1. Auto-fix common issues
python tools/git/git-automation.py pre-push-check --auto-fix

# 2. Run comprehensive validation
python governance/local_ci_validator.py

# 3. If all passes, push
git add -A
git commit -m "feat: implement secure payment processing"
git push origin feature/payment-processing
```

### Continuous Integration Simulation

```bash
# Simulate exact CI/CD pipeline locally
python governance/local_ci_validator.py --parallel

# Check the detailed report
cat governance/logs/local_ci_validation_report.json | jq '.validation_summary'
```

This comprehensive local validation ensures that your code meets all quality, security, and
compliance requirements before it reaches the remote repository, reducing CI/CD failures and
maintaining the high standards required for Ethiopian fintech applications.
