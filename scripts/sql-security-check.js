#!/usr/bin/env node

/**
 * SQL Security Check for Meqenet.et FinTech
 * Database security validation for migration files
 */

const fs = require('fs');
const path = require('path');

// Get staged files from command line arguments
const stagedFiles = process.argv.slice(2);

if (stagedFiles.length === 0) {
  console.log('ℹ️  No SQL files to check');
  process.exit(0);
}

let hasErrors = false;
const errors = [];

// SQL security patterns to check for
const SQL_SECURITY_PATTERNS = [
  // SQL injection patterns
  {
    pattern: /SELECT\s+.*\$\{.*\}/gi,
    message: 'Potential SQL injection via template literals in SELECT',
  },
  {
    pattern: /INSERT\s+.*\$\{.*\}/gi,
    message: 'Potential SQL injection via template literals in INSERT',
  },
  {
    pattern: /UPDATE\s+.*\$\{.*\}/gi,
    message: 'Potential SQL injection via template literals in UPDATE',
  },
  {
    pattern: /DELETE\s+.*\$\{.*\}/gi,
    message: 'Potential SQL injection via template literals in DELETE',
  },
  {
    pattern: /WHERE\s+.*\$\{.*\}/gi,
    message: 'Potential SQL injection via template literals in WHERE',
  },

  // Dangerous SQL operations
  { pattern: /DROP\s+DATABASE/gi, message: 'DROP DATABASE statement detected' },
  { pattern: /DROP\s+TABLE/gi, message: 'DROP TABLE statement detected' },
  {
    pattern: /TRUNCATE\s+TABLE/gi,
    message: 'TRUNCATE TABLE statement detected',
  },

  // Hardcoded credentials in SQL
  {
    pattern: /GRANT\s+.*\s+TO\s+.*IDENTIFIED\s+BY/gi,
    message: 'Hardcoded database credentials detected',
  },
];

function checkSQLFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    SQL_SECURITY_PATTERNS.forEach(({ pattern, message }) => {
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

    // Additional checks for SQL files
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // Check for missing transaction boundaries
      if (
        (line.includes('INSERT') ||
          line.includes('UPDATE') ||
          line.includes('DELETE')) &&
        !content.includes('BEGIN') &&
        !content.includes('START TRANSACTION')
      ) {
        hasErrors = true;
        errors.push({
          file: relativePath,
          line: index + 1,
          message:
            'Database modification without explicit transaction detected',
        });
      }
    });
  } catch (error) {
    console.error(`❌ Error reading SQL file ${filePath}: ${error.message}`);
  }
}

console.log('🛡️  Running SQL security checks...');

// Check each staged SQL file
stagedFiles.forEach(filePath => {
  if (fs.existsSync(filePath) && filePath.endsWith('.sql')) {
    checkSQLFile(filePath);
  }
});

// Report results
if (hasErrors) {
  console.log('\n❌ SQL SECURITY VIOLATIONS DETECTED!');
  console.log('====================================');

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
  console.log('   • Use parameterized queries instead of string concatenation');
  console.log('   • Avoid DROP/TRUNCATE statements in application code');
  console.log('   • Use database migrations for schema changes');
  console.log('   • Implement proper transaction management');
  console.log('   • Store credentials securely, not in SQL files');
  console.log('');
  console.log('🔒 COMMIT BLOCKED FOR DATABASE SECURITY COMPLIANCE');
  console.log('   • Fix all SQL security issues before committing');
  console.log('   • Contact database team: dba@meqenet.et');

  process.exit(1);
} else {
  console.log('✅ SQL security checks passed');
  console.log('🇪🇹 Database changes meet enterprise security standards');
}
