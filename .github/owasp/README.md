# OWASP Dependency Check Configuration

## Overview

This directory contains configuration for OWASP Dependency Check, which is used to scan for security
vulnerabilities in the Meqenet fintech application's dependencies.

## Security Strategy

### No Suppression Policy

**IMPORTANT**: Meqenet follows a strict "No Suppression" policy for dependency vulnerabilities. All
vulnerabilities must be resolved through:

1. **Dependency Updates**: Upgrading to secure versions of dependencies
2. **Code Changes**: Implementing workarounds or alternative solutions
3. **Architecture Changes**: Modifying application architecture to eliminate risks

#### Exception: React Native Mobile App False Positives

**CAREFULLY JUSTIFIED EXCEPTIONS**: For React Native mobile applications, specific suppressions are
allowed for native library vulnerabilities that are false positives in the mobile app context.

These exceptions are:

- Documented with security rationale
- Reviewed by security team
- Limited to React Native framework dependencies
- Monitored for framework updates

### React Native Security Approach

Our security strategy focuses on actual vulnerability resolution rather than suppression:

1. **Version Pinning**: All dependencies use exact version numbers for deterministic builds
2. **Regular Updates**: Dependencies updated to latest secure versions
3. **Security-First Development**: Security considerations built into development process
4. **Comprehensive Testing**: Automated security testing and validation

### Vulnerability Resolution Methods

#### For React Native Framework Issues

- Update to latest stable React Native version with security patches
- Implement security patches from React Native security advisories
- Use React Native's built-in security features and configurations

#### For Third-Party Dependencies

- Update to latest secure versions immediately when available
- Replace vulnerable dependencies with secure alternatives
- Implement security wrappers or patches when updates aren't available

#### For ICU/DoubleConversion Issues

- These are resolved through React Native version updates
- Modern React Native versions include security patches for these libraries
- **Current Status**: Documented suppressions for React Native 0.76.5 ICU libraries
- **Rationale**: False positives for mobile app context - cannot be updated via package management
- **Security Mitigation**: Mobile OS sandboxing, React Native framework security, app store security
  reviews

## Enterprise Security Standards

### FinTech Compliance

- **PCI DSS**: Payment Card Industry Data Security Standard compliance
- **GDPR**: General Data Protection Regulation compliance
- **NBE**: National Bank of Ethiopia regulatory requirements

### Security Controls

- **Zero Suppression Policy**: No vulnerability suppressions allowed (with documented exceptions)
- **Automated Security Scanning**: Daily vulnerability scans in CI/CD
- **Security Gates**: Builds fail on CVSS score >= 9.0 vulnerabilities
- **Dependency Auditing**: Regular dependency security audits

### Current Suppressions

#### React Native ICU Libraries (dependency-check-suppression.xml)

**File**: `.github/owasp/dependency-check-suppression.xml`

**Suppressed Libraries**:

- `icudt64.dll`, `icuin64.dll`, `icuio64.dll`, `icuuc64.dll` - ICU Unicode libraries
- `DoubleConversion.podspec` - React Native number formatting library

**CVEs Suppressed**: Multiple historical ICU vulnerabilities (CVE-2007-4771 through CVE-2025-5222)

**Justification**:

- Native libraries bundled with React Native framework
- Cannot be updated through package.json
- Mobile app sandboxing limits attack surface
- Resolved through React Native framework updates
- False positives for mobile application context

**Security Controls in Place**:

- App Store/Play Store security reviews
- Mobile OS sandboxing and security controls
- React Native framework security features
- Regular framework updates with security patches

## Maintenance

### Vulnerability Management Process

1. **Daily Scanning**: Automated vulnerability scanning in CI/CD pipeline
2. **Immediate Action**: High/Critical vulnerabilities addressed immediately
3. **Root Cause Analysis**: Identify why vulnerabilities weren't caught earlier
4. **Prevention**: Implement measures to prevent similar issues

### Dependency Update Process

1. **Security Monitoring**: Monitor for new dependency vulnerabilities
2. **Impact Assessment**: Assess impact on application functionality
3. **Testing**: Comprehensive testing of dependency updates
4. **Deployment**: Staged rollout with monitoring

### Security Review Process

1. **Code Reviews**: All dependency changes require security review
2. **Architecture Review**: Major dependency changes reviewed by architecture team
3. **Security Testing**: Updated dependencies undergo security testing
4. **Documentation**: All changes documented with security considerations

## Contact

For questions about this security configuration, contact:

- **Security Team**: security@meqenet.com
- **DevSecOps**: devsecops@meqenet.com

## References

- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [React Native Security](https://reactnative.dev/docs/security)
- [FinTech Security Guidelines](https://www.finra.org/rules-guidance/guidance/mobile-application-security)
