#!/usr/bin/env node

/**
 * Enhanced Authentication Security Validation Script
 *
 * Validates the implementation of Stage 2 authentication security enhancements:
 * - JWT RS256 asymmetric signing
 * - Enhanced RBAC guard tests
 * - Advanced rate limiting
 * - Mobile certificate pinning
 *
 * Usage: node scripts/validate-enhanced-auth-security.js [--ci] [--fix]
 */

const { execSync: _execSync, spawn: _spawn } = require('child_process'); // Reserved for future command execution
const fs = require('fs');
const { fileURLToPath } = require('url');
const { dirname } = require('path');

class EnhancedAuthSecurityValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
    this.ciMode = process.argv.includes('--ci');
    this.fixMode = process.argv.includes('--fix');
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m',
    };
    console.log(`${colors[type]}[${type.toUpperCase()}]\x1b[0m ${message}`);
  }

  async validate() {
    console.log('🔐 Starting Enhanced Authentication Security Validation');

    try {
      console.log('Current working directory:', process.cwd());
      // Validate JWT RS256 Implementation
      await this.validateJWTAlgorithm();

      // Validate RBAC Security Tests
      await this.validateRBACSecurityTests();

      // Validate Rate Limiting Configuration
      await this.validateRateLimiting();

      // Validate Mobile Certificate Pinning
      await this.validateMobileCertificatePinning();

      // Validate Backend Security Configuration
      await this.validateBackendSecurityConfig();

      // Generate Report
      this.generateReport();
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async validateJWTAlgorithm() {
    this.log('Validating JWT RS256 Algorithm Implementation...', 'info');

    const jwtStrategyPath =
      'backend/services/auth-service/src/shared/strategies/jwt.strategy.ts';
    const authModulePath =
      'backend/services/auth-service/src/features/auth/auth.module.ts';
    const jwksServicePath =
      'backend/services/auth-service/src/features/jwks/jwks.service.ts';

    // Check if files exist before reading
    const checkFileExists = filePath => {
      try {
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
      } catch {
        return false;
      }
    };

    // Log file existence for debugging
    console.log('JWT Strategy exists:', checkFileExists(jwtStrategyPath));
    console.log('Auth Module exists:', checkFileExists(authModulePath));
    console.log('JWKS Service exists:', checkFileExists(jwksServicePath));

    try {
      // Check JWT strategy uses RS256
      const jwtStrategy = fs.readFileSync(jwtStrategyPath, 'utf8');
      if (!jwtStrategy.includes("algorithms: ['RS256']")) {
        this.issues.push({
          type: 'jwt_algorithm',
          severity: 'critical',
          message: 'JWT strategy does not use RS256 algorithm',
          file: jwtStrategyPath,
          fix: 'Update JWT strategy to use RS256 algorithm',
        });
      } else {
        this.passed.push('JWT strategy correctly uses RS256 algorithm');
      }

      // Check auth module uses RS256 signing
      const authModule = fs.readFileSync(authModulePath, 'utf8');
      if (!authModule.includes("algorithm: 'RS256'")) {
        this.issues.push({
          type: 'jwt_signing',
          severity: 'critical',
          message: 'Auth module does not configure RS256 signing',
          file: authModulePath,
          fix: 'Configure JWT module with RS256 algorithm',
        });
      } else {
        this.passed.push('Auth module correctly configures RS256 signing');
      }

      // Check JWKS service generates RSA keys
      const jwksService = fs.readFileSync(jwksServicePath, 'utf8');
      if (!jwksService.includes("generateKeyPair('RS256')")) {
        this.issues.push({
          type: 'jwks_keys',
          severity: 'critical',
          message: 'JWKS service does not generate RSA key pairs',
          file: jwksServicePath,
          fix: 'Update JWKS service to generate RS256 key pairs',
        });
      } else {
        this.passed.push('JWKS service correctly generates RSA key pairs');
      }
    } catch (error) {
      this.issues.push({
        type: 'file_read',
        severity: 'critical',
        message: `Failed to read JWT configuration files: ${error.message}`,
        fix: 'Ensure JWT configuration files exist and are readable',
      });
    }
  }

  async validateRBACSecurityTests() {
    this.log('Validating RBAC Security Test Coverage...', 'info');

    const rbacTestPath =
      'backend/services/auth-service/src/shared/guards/roles.guard.spec.ts';

    try {
      const testFile = fs.readFileSync(rbacTestPath, 'utf8');

      const requiredTests = [
        'malformed role values',
        'malformed user objects',
        'unexpected role values',
        'reflector returns invalid required roles',
        'case-sensitive role matching',
        'role enumeration attacks',
        'concurrent access patterns',
        'privilege escalation attempts',
        'malformed execution context',
        'large numbers of required roles',
        'rapid successive calls',
      ];

      for (const test of requiredTests) {
        if (!testFile.toLowerCase().includes(test.toLowerCase())) {
          this.issues.push({
            type: 'rbac_test_coverage',
            severity: 'high',
            message: `Missing RBAC security test: ${test}`,
            file: rbacTestPath,
            fix: `Add test case for: ${test}`,
          });
        } else {
          this.passed.push(`RBAC test coverage includes: ${test}`);
        }
      }
    } catch (error) {
      this.issues.push({
        type: 'file_read',
        severity: 'high',
        message: `Failed to read RBAC test file: ${error.message}`,
        file: rbacTestPath,
        fix: 'Ensure RBAC test file exists and is readable',
      });
    }
  }

  async validateRateLimiting() {
    this.log('Validating Advanced Rate Limiting Configuration...', 'info');

    const rateLimitPath =
      'backend/services/auth-service/src/shared/services/rate-limiting.service.ts';

    try {
      const rateLimitService = fs.readFileSync(rateLimitPath, 'utf8');

      const requiredFeatures = [
        'checkAuthenticatedEndpointRateLimit',
        'checkFinancialOperationRateLimit',
        'checkAdminOperationRateLimit',
        'getRoleBasedRateLimitConfig',
        'getFinancialOperationLimit',
        'getAdminOperationLimit',
        'hashUserAgent',
        'isSuspiciousIP',
        'getRateLimitAnalytics',
      ];

      for (const feature of requiredFeatures) {
        if (!rateLimitService.includes(feature)) {
          this.issues.push({
            type: 'rate_limiting_feature',
            severity: 'high',
            message: `Missing rate limiting feature: ${feature}`,
            file: rateLimitPath,
            fix: `Implement ${feature} method in rate limiting service`,
          });
        } else {
          this.passed.push(`Rate limiting includes: ${feature}`);
        }
      }

      // Check for role-based configuration
      if (
        !rateLimitService.includes('ADMIN:') ||
        !rateLimitService.includes('CUSTOMER:')
      ) {
        this.issues.push({
          type: 'role_based_limits',
          severity: 'medium',
          message: 'Missing role-based rate limit configurations',
          file: rateLimitPath,
          fix: 'Add role-based rate limit configurations for ADMIN, SUPPORT, MERCHANT, CUSTOMER',
        });
      } else {
        this.passed.push('Role-based rate limit configurations are present');
      }
    } catch (error) {
      this.issues.push({
        type: 'file_read',
        severity: 'high',
        message: `Failed to read rate limiting service: ${error.message}`,
        file: rateLimitPath,
        fix: 'Ensure rate limiting service file exists and is readable',
      });
    }
  }

  async validateMobileCertificatePinning() {
    this.log('Validating Mobile Certificate Pinning Implementation...', 'info');

    const mobileApiPath =
      'frontend/libs/mobile-api-client/src/lib/api-client.ts';
    const mobilePackagePath = 'frontend/apps/app/package.json';

    try {
      // Check mobile package dependencies
      const packageJson = JSON.parse(
        fs.readFileSync(mobilePackagePath, 'utf8')
      );
      const requiredDeps = ['react-native-ssl-pinning'];

      for (const dep of requiredDeps) {
        if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
          this.issues.push({
            type: 'mobile_dependency',
            severity: 'high',
            message: `Missing mobile certificate pinning dependency: ${dep}`,
            file: mobilePackagePath,
            fix: `Add ${dep} to mobile app dependencies`,
          });
        } else {
          this.passed.push(`Mobile app includes: ${dep}`);
        }
      }

      // Check API client implementation
      const apiClient = fs.readFileSync(mobileApiPath, 'utf8');

      const requiredFeatures = [
        'initializeSSLPinning',
        'CERTIFICATE_PINNING_CONFIG',
        'CERTIFICATE_PINNING_FAILED',
        'updateCertificateHashes',
        'isCertificatePinningActive',
      ];

      for (const feature of requiredFeatures) {
        if (!apiClient.includes(feature)) {
          this.issues.push({
            type: 'mobile_cert_pinning',
            severity: 'high',
            message: `Missing mobile certificate pinning feature: ${feature}`,
            file: mobileApiPath,
            fix: `Implement ${feature} in mobile API client`,
          });
        } else {
          this.passed.push(`Mobile API client includes: ${feature}`);
        }
      }

      // Check for certificate hash placeholders
      if (apiClient.includes('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=')) {
        this.warnings.push({
          type: 'cert_placeholder',
          message:
            'Certificate hash placeholders found - replace with actual hashes',
          file: mobileApiPath,
          fix: 'Replace placeholder certificate hashes with actual values',
        });
      }
    } catch (error) {
      this.issues.push({
        type: 'file_read',
        severity: 'high',
        message: `Failed to read mobile configuration files: ${error.message}`,
        fix: 'Ensure mobile configuration files exist and are readable',
      });
    }
  }

  async validateBackendSecurityConfig() {
    this.log('Validating Backend Security Configuration...', 'info');

    const sharedModulePath =
      'backend/services/auth-service/src/shared/shared.module.ts';

    try {
      const sharedModule = fs.readFileSync(sharedModulePath, 'utf8');

      // Check if guards are properly configured
      if (
        !sharedModule.includes('JwtAuthGuard') ||
        !sharedModule.includes('RolesGuard')
      ) {
        this.issues.push({
          type: 'guard_configuration',
          severity: 'high',
          message: 'Auth guards not properly configured in shared module',
          file: sharedModulePath,
          fix: 'Configure JwtAuthGuard and RolesGuard in shared module',
        });
      } else {
        this.passed.push('Auth guards are properly configured');
      }

      // Check for security monitoring
      if (!sharedModule.includes('SecurityMonitoringService')) {
        this.issues.push({
          type: 'security_monitoring',
          severity: 'medium',
          message: 'Security monitoring service not configured',
          file: sharedModulePath,
          fix: 'Configure SecurityMonitoringService in shared module',
        });
      } else {
        this.passed.push('Security monitoring service is configured');
      }
    } catch (error) {
      this.issues.push({
        type: 'file_read',
        severity: 'medium',
        message: `Failed to read backend configuration: ${error.message}`,
        file: sharedModulePath,
        fix: 'Ensure backend configuration files exist and are readable',
      });
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 ENHANCED AUTHENTICATION SECURITY VALIDATION REPORT');
    console.log('='.repeat(60));

    if (this.passed.length > 0) {
      console.log('\n✅ PASSED VALIDATIONS:');
      this.passed.forEach(item => console.log(`   ✓ ${item}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning.message}`);
        console.log(`      File: ${warning.file}`);
        console.log(`      Fix: ${warning.fix}`);
      });
    }

    if (this.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      this.issues.forEach(issue => {
        const severityColor =
          issue.severity === 'critical'
            ? '\x1b[31m'
            : issue.severity === 'high'
              ? '\x1b[33m'
              : '\x1b[36m';
        console.log(
          `   ${severityColor}${issue.severity.toUpperCase()}\x1b[0m ${issue.message}`
        );
        console.log(`      File: ${issue.file}`);
        console.log(`      Fix: ${issue.fix}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log(
      `SUMMARY: ${this.passed.length} passed, ${this.warnings.length} warnings, ${this.issues.length} issues`
    );
    console.log('='.repeat(60));

    const criticalIssues = this.issues.filter(
      i => i.severity === 'critical'
    ).length;
    const highIssues = this.issues.filter(i => i.severity === 'high').length;

    if (criticalIssues > 0) {
      console.log('\n🚨 CRITICAL ISSUES MUST BE FIXED BEFORE DEPLOYMENT');
      process.exit(1);
    } else if (highIssues > 0) {
      console.log('\n⚠️  HIGH PRIORITY ISSUES SHOULD BE ADDRESSED');
      if (!this.ciMode) {
        process.exit(1);
      }
    } else {
      console.log(
        '\n✅ ALL ENHANCED AUTHENTICATION SECURITY VALIDATIONS PASSED'
      );
    }
  }
}

// Run validation if called directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1].includes('validate-enhanced-auth-security.js')) {
  const validator = new EnhancedAuthSecurityValidator();
  validator.validate().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

export default EnhancedAuthSecurityValidator;
