#!/usr/bin/env node

/**
 * Financial Security Check for Meqenet.et FinTech
 * Enterprise-grade security validation for financial code
 */

const fs = require('fs');
const path = require('path');

// Get staged files from command line arguments
const stagedFiles = process.argv.slice(2);

if (stagedFiles.length === 0) {
  console.log('ℹ️  No financial files to check');
  process.exit(0);
}

let hasErrors = false;
const errors = [];

// Security patterns to check for
const DANGEROUS_PATTERNS = [
  // Code injection patterns
  {
    pattern: /eval\s*\(/g,
    message: 'Use of eval() detected - high security risk',
  },
  {
    pattern: /new\s+Function\s*\(/g,
    message: 'Dynamic Function constructor detected - high security risk',
  },
  {
    pattern: /setTimeout\s*\(\s*.*eval/g,
    message: 'setTimeout with eval detected - high security risk',
  },
  {
    pattern: /setInterval\s*\(\s*.*eval/g,
    message: 'setInterval with eval detected - high security risk',
  },

  // Global object manipulation
  {
    pattern: /global\s*\[/g,
    message: 'Direct global object manipulation detected',
  },
  {
    pattern: /window\s*\[/g,
    message: 'Direct window object manipulation detected',
  },

  // SQL injection patterns
  {
    pattern: /\$\{.*\}.*SELECT/i,
    message: 'Potential SQL injection via template literals',
  },
  {
    pattern: /\$\{.*\}.*INSERT/i,
    message: 'Potential SQL injection via template literals',
  },
  {
    pattern: /\$\{.*\}.*UPDATE/i,
    message: 'Potential SQL injection via template literals',
  },
  {
    pattern: /\$\{.*\}.*DELETE/i,
    message: 'Potential SQL injection via template literals',
  },

  // Hardcoded secrets (basic patterns)
  {
    pattern: /password\s*[:=]\s*['"][^'"]*['"]/gi,
    message: 'Potential hardcoded password detected',
  },
  {
    pattern: /secret\s*[:=]\s*['"][^'"]*['"]/gi,
    message: 'Potential hardcoded secret detected',
  },
  {
    pattern: /api[_-]?key\s*[:=]\s*['"][^'"]*['"]/gi,
    message: 'Potential hardcoded API key detected',
  },

  // Financial calculation issues
  {
    pattern: /0\.1\s*\+\s*0\.2/g,
    message:
      'Floating point arithmetic detected in financial calculations - use Decimal/BigInt',
  },
  {
    pattern: /parseFloat\s*\(/g,
    message: 'parseFloat detected - use Decimal for financial calculations',
  },
  {
    pattern: /toFixed\s*\(\s*\d+\s*\)/g,
    message: 'toFixed without proper rounding strategy detected',
  },
];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    DANGEROUS_PATTERNS.forEach(({ pattern, message }) => {
      const matches = content.match(pattern);
      if (matches) {
        hasErrors = true;
        errors.push({
          file: relativePath,
          pattern: pattern.toString(),
          message,
          occurrences: matches.length,
        });
      }
    });

    // Additional financial-specific checks
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // Check for missing error handling in financial operations
      if (
        line.includes('transfer') ||
        line.includes('payment') ||
        line.includes('transaction')
      ) {
        const nextLines = lines.slice(index, index + 5).join('\n');
        if (
          !nextLines.includes('try') &&
          !nextLines.includes('catch') &&
          !nextLines.includes('throw')
        ) {
          hasErrors = true;
          errors.push({
            file: relativePath,
            line: index + 1,
            message:
              'Financial operation without proper error handling detected',
          });
        }
      }
    });
  } catch (error) {
    console.error(`❌ Error reading file ${filePath}: ${error.message}`);
  }
}

console.log('🔐 Running financial security checks...');

// Check each staged file
stagedFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    checkFile(filePath);
  }
});

// Report results
if (hasErrors) {
  console.log('\n❌ FINANCIAL SECURITY VIOLATIONS DETECTED!');
  console.log('=====================================');

  errors.forEach(error => {
    console.log(`📁 File: ${error.file}`);
    if (error.line) {
      console.log(`📍 Line: ${error.line}`);
    }
    console.log(`🚨 Issue: ${error.message}`);
    if (error.occurrences) {
      console.log(`🔢 Occurrences: ${error.occurrences}`);
    }
    console.log('---');
  });

  console.log('\n🔧 Required Actions:');
  console.log(
    '   • Replace eval() and dynamic code execution with secure alternatives'
  );
  console.log('   • Use parameterized queries for database operations');
  console.log(
    '   • Store secrets in AWS Secrets Manager or environment variables'
  );
  console.log('   • Use Decimal.js or BigInt for financial calculations');
  console.log(
    '   • Implement proper error handling for all financial operations'
  );
  console.log('   • Add input validation and sanitization');
  console.log('');
  console.log('🔒 COMMIT BLOCKED FOR FINANCIAL SECURITY COMPLIANCE');
  console.log('   • Fix all security issues before committing');
  console.log('   • Contact security team: security@meqenet.et');

  process.exit(1);
} else {
  console.log('✅ Financial security checks passed');
  console.log('🇪🇹 Financial code meets enterprise security standards');
}
