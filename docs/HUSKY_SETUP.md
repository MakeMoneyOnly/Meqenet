# Husky Git Hooks Setup for Meqenet.et

## Overview

This document describes the Git hooks implementation for the Meqenet.et BNPL platform using Husky.
These hooks ensure **FinTech security standards**, **Ethiopian compliance requirements**, and **code
quality** before code reaches our repositories.

## 🔒 Security Philosophy

Our Git hooks implement a **"Security-First" approach** with multiple layers of validation:

1. **Pre-Commit**: Fast security and quality checks on staged files
2. **Pre-Push**: Comprehensive validation before code reaches remote repository
3. **Ethiopian FinTech Compliance**: NBE regulatory requirements validation
4. **Financial Code Protection**: Special validation for payment/credit logic

## 📋 Hook Configuration

### Pre-Commit Hook (`.husky/pre-commit`)

**Purpose**: Fast, focused checks on staged files only. This is the first line of defense.

#### Checks Performed:

1. **Lint-Staged**: Runs Prettier to format code and ESLint to enforce style.
2. **Static Security Analysis**: Utilizes `eslint-plugin-security` to detect insecure coding
   patterns _before_ they are committed. This is a mandatory check.
3. **Sensitive Data Scan**: Scans for hardcoded secrets, API keys, or credentials.
4. **NBE Compliance**: Checks for unresolved compliance `TODOs` in comments.
5. **Fayda ID Protection**: Prevents real Ethiopian National ID data patterns from being committed.
6. **Financial Precision**: Warns against using floating-point arithmetic in financial calculations.

#### Example Output:

```bash
🔒 Meqenet.et Pre-Commit Security & Quality Checks
==================================================
📝 Running lint-staged on modified files...
🛡️  Running security audit...
🔍 Scanning for sensitive data patterns...
🇪🇹 Checking Ethiopian FinTech compliance...
🆔 Validating Fayda ID patterns...
💰 Checking financial calculation patterns...
✅ Pre-commit checks completed successfully!
🚀 Ready to commit to Meqenet.et
```

### Pre-Push Hook (`.husky/pre-push`)

**Purpose**: A comprehensive validation gate to prevent pushing broken or insecure code to the
repository, even on feature branches.

#### Checks Performed:

1. **Unit Tests**: **Must** run all relevant unit tests for the changed files. Pushing code that
   breaks existing tests is prohibited.
2. **Dependency Vulnerability Scan**: **Must** run a dependency check using `pnpm audit`. Pushing
   code with known critical vulnerabilities in its dependencies is prohibited.
3. **Build Validation**: Ensures the service or application compiles successfully.
4. **Commit Message Format**: Enforces conventional commit standards for clean, automated
   changelogs.
5. **Ethiopian FinTech Validation**:
   - Financial logic changes must be accompanied by corresponding tests.
   - Fayda ID data handling must use approved encryption utilities.
6. **Dependency Integrity**: Validates that the `pnpm-lock.yaml` file is not tampered with.

#### Example Output:

```bash
🚀 Meqenet.et Pre-Push Comprehensive Checks
=============================================
🌿 Current branch: feature/payment-integration
🛡️  Running comprehensive security audit...
🧪 Running all tests...
🏗️  Running build check...
📜 Checking license compliance...
🔍 Checking for critical vulnerabilities...
🇪🇹 Running Ethiopian FinTech compliance checks...
💰 Financial code changes detected - validating test coverage...
📝 Validating commit message format for protected branch...
📦 Final dependency validation...
✅ All pre-push checks passed!
🎉 Ready to push to Meqenet.et remote repository!
🇪🇹 Contributing to Ethiopia's financial future!
```

## 🛠️ Installation & Setup

### 1. Automatic Setup (Recommended)

The hooks are automatically installed when you run:

```bash
pnpm install
```

This triggers the `prepare` script which runs `husky install`.

### 2. Manual Setup

If you need to set up manually:

```bash
# Install Husky
pnpm add --save-dev husky

# Initialize Husky
npx husky install

# Add hooks (already done in our repo)
npx husky add .husky/pre-commit "npm run pre-commit:security"
npx husky add .husky/pre-push "npm run pre-push:full"
```

### 3. Verification

Test the hooks are working:

```bash
# Test pre-commit hook
git add .
git commit -m "test: verify pre-commit hook"

# Test pre-push hook
git push origin feature-branch
```

## ⚙️ Configuration

### Package.json Scripts

```json
{
  "scripts": {
    "prepare": "husky install",
    "pre-commit:security": "pnpm run security:audit && pnpm run lint",
    "pre-push:full": "pnpm run security:full-scan && pnpm run test && pnpm run build",
    "security:audit": "pnpm audit --audit-level moderate",
    "security:full-scan": "pnpm run security:audit && pnpm run security:licenses && pnpm run security:outdated"
  }
}
```

### Lint-Staged Configuration

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"],
    "package*.json": ["pnpm audit --audit-level moderate"]
  }
}
```

## 🇪🇹 Ethiopian FinTech Specific Features

### 1. Fayda National ID Protection

```bash
# Detects patterns like:
fayda_id: "1234567890123"  # ❌ BLOCKED
national_id: "9876543210"  # ❌ BLOCKED

# Allows test patterns:
fayda_id: "TEST_ID_123"    # ✅ ALLOWED
national_id: "MOCK_ID"     # ✅ ALLOWED
```

### 2. NBE Compliance Validation

```bash
# Blocks commits with unresolved compliance issues:
// TODO: Fix NBE compliance issue    # ❌ BLOCKED
// FIXME: compliance violation       # ❌ BLOCKED
// hack: financial calculation       # ❌ BLOCKED
```

### 3. Financial Code Protection

```bash
# Warns about precision issues:
const amount = parseFloat(price);     # ⚠️  WARNING
const total = Number(userInput);      # ⚠️  WARNING

# Recommends:
import Decimal from 'decimal.js';
const amount = new Decimal(price);    # ✅ RECOMMENDED
```

### 4. Telebirr Integration Checks

Validates secure handling of Ethiopian mobile money integrations.

## 🚫 Bypassing Hooks (Emergency Only)

### Skip Pre-Commit (Not Recommended)

```bash
git commit --no-verify -m "emergency: skip pre-commit"
```

### Skip Pre-Push (Not Recommended)

```bash
git push --no-verify origin branch-name
```

**⚠️ WARNING**: Bypassing hooks should only be done in genuine emergencies and requires immediate
follow-up to address the skipped validations.

## 🔧 Troubleshooting

### Common Issues

#### 1. Hook Not Running

```bash
# Check if Husky is installed
ls -la .husky/

# Reinstall hooks
rm -rf .husky
pnpm run prepare
```

#### 2. Permission Denied (Linux/Mac)

```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

#### 3. Windows Compatibility

- Hooks work with Git Bash, WSL, or PowerShell
- Ensure Node.js and pnpm are in PATH

#### 4. Audit Failures

```bash
# Fix audit issues
pnpm audit fix

# Check for unfixable issues
pnpm audit --audit-level high
```

### Debug Mode

Enable debug output:

```bash
export HUSKY_DEBUG=1
git commit -m "test with debug"
```

## 📊 Performance Optimization

### Pre-Commit Optimization

- **Lint-staged**: Only processes modified files
- **Incremental checks**: Skips unchanged code
- **Fast security scan**: Basic audit only

### Pre-Push Optimization

- **Conditional checks**: Different rules for different branches
- **Parallel execution**: Multiple checks run simultaneously
- **Smart caching**: Reuses build artifacts when possible

## 🔄 Continuous Improvement

### Monthly Review Process

1. **Analyze hook performance**: Check execution times
2. **Review security patterns**: Update for new threats
3. **Ethiopian compliance updates**: Incorporate new NBE requirements
4. **Developer feedback**: Adjust based on team input

### Metrics Tracked

- Hook execution time
- False positive rate
- Security issues caught
- Developer satisfaction

## 📚 Related Documentation

- [Security Framework](./Stage%201%20-%20Foundation/07-Security.md)
- [Code Review Guidelines](./Stage%202%20-Development/21-Code_Review.md)
- [Branch Protection Setup](./GIT_BRANCH_PROTECTION_SETUP.md)
- [Ethiopian Compliance Framework](./Stage%201%20-%20Foundation/05-Compliance_Framework.md)

## 🆘 Support

### Internal Support

- **Technical Issues**: Create issue with `bug` label
- **Security Concerns**: Email security@meqenet.et
- **Ethiopian Compliance**: Contact compliance@meqenet.et

### External Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [Lint-staged Documentation](https://github.com/okonet/lint-staged)
- [ESLint Security Plugin](https://github.com/nodesecurity/eslint-plugin-security)

---

**🇪🇹 Built for Ethiopia's Financial Future**

_These Git hooks ensure every line of code meets the highest standards of security, quality, and
regulatory compliance for Ethiopia's leading BNPL platform._
