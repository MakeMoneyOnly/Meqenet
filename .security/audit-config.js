// Meqenet.et Security Audit Configuration
// FinTech-specific security rules for Ethiopian BNPL platform

module.exports = {
  // Audit levels for different environments
  auditLevels: {
    development: 'moderate',
    staging: 'high',
    production: 'critical',
  },

  // Critical vulnerabilities that must be fixed immediately
  criticalVulnerabilities: [
    'prototype-pollution',
    'code-injection',
    'sql-injection',
    'xss',
    'csrf',
    'path-traversal',
    'arbitrary-code-execution',
  ],

  // Ethiopian FinTech specific security patterns
  ethiopianFinTechPatterns: {
    // Fayda National ID validation patterns
    faydaIdPatterns: [
      /fayda.*id.*\d{10,}/i,
      /national.*id.*\d{10,}/i,
      /ethiopian.*id.*\d{10,}/i,
    ],

    // Financial calculation patterns that need review
    financialCalculationPatterns: [
      /parseFloat\s*\(/,
      /Number\s*\(/,
      /Math\.round\s*\(/,
      /toFixed\s*\(/,
    ],

    // NBE compliance keywords
    nbeComplianceKeywords: [
      'nbe',
      'national-bank-ethiopia',
      'regulatory-compliance',
      'aml',
      'kyc',
      'cdd',
      'suspicious-transaction',
    ],

    // Telebirr integration patterns
    telebirrPatterns: [/telebirr/i, /ethio.*telecom/i, /mobile.*money/i],
  },

  // Sensitive data patterns to scan for
  sensitiveDataPatterns: [
    // API Keys and secrets
    /api[_-]?key/i,
    /secret[_-]?key/i,
    /private[_-]?key/i,
    /access[_-]?token/i,
    /refresh[_-]?token/i,

    // Database credentials
    /password/i,
    /passwd/i,
    /db[_-]?pass/i,
    /database[_-]?url/i,

    // Ethiopian specific sensitive patterns
    /fayda[_-]?secret/i,
    /telebirr[_-]?key/i,
    /nbe[_-]?token/i,

    // Financial data patterns
    /account[_-]?number/i,
    /card[_-]?number/i,
    /pin[_-]?code/i,
    /cvv/i,
    /ssn/i,
  ],

  // License compliance - allowed licenses for FinTech
  allowedLicenses: [
    'MIT',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    'CC0-1.0',
    'Unlicense',
  ],

  // Prohibited licenses for FinTech (due to copyleft requirements)
  prohibitedLicenses: [
    'GPL-2.0',
    'GPL-3.0',
    'AGPL-1.0',
    'AGPL-3.0',
    'LGPL-2.1',
    'LGPL-3.0',
    'MPL-2.0',
  ],

  // Dependencies that require special review for FinTech
  criticalDependencies: [
    'crypto',
    'bcrypt',
    'jsonwebtoken',
    'passport',
    'express-rate-limit',
    'helmet',
    'cors',
    'decimal.js',
    'big.js',
    'node-forge',
  ],

  // Ethiopian localization dependencies
  localizationDependencies: [
    'i18next',
    'react-i18next',
    'moment',
    'date-fns',
    'luxon',
  ],

  // Security headers required for FinTech
  requiredSecurityHeaders: [
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Strict-Transport-Security',
  ],

  // Compliance reporting configuration
  complianceReporting: {
    generateSBOM: true,
    includeVulnerabilityReport: true,
    includeLicenseReport: true,
    includeEthiopianSpecificChecks: true,
    outputFormat: ['json', 'pdf'],
    reportPath: './reports/security',
  },

  // Exemptions for known false positives (use sparingly)
  exemptions: {
    // Development dependencies that may have vulnerabilities
    // but are not included in production builds
    devDependencyExemptions: [
      // Add specific packages here if needed
    ],

    // Temporary exemptions with expiry dates
    temporaryExemptions: [
      // Format: { package: 'package-name', until: '2024-12-31', reason: 'explanation' }
    ],
  },
};
