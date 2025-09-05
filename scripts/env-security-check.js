#!/usr/bin/env node

/**
 * Environment Security Check for Meqenet.et FinTech
 * Security validation for environment and configuration files
 */

const fs = require('fs');
const path = require('path');

// Get staged files from command line arguments
const stagedFiles = process.argv.slice(2);

if (stagedFiles.length === 0) {
  console.log('ℹ️  No environment files to check');
  process.exit(0);
}

let hasErrors = false;
const errors = [];

// Security patterns to check for in environment files
const ENV_SECURITY_PATTERNS = [
  // Real secrets (not placeholder values)
  {
    pattern: /PASSWORD\s*=\s*[^#$\n]{8,}/i,
    message: 'Potential real password detected (not a placeholder)',
  },
  {
    pattern: /SECRET\s*=\s*[^#$\n]{10,}/i,
    message: 'Potential real secret detected (not a placeholder)',
  },
  {
    pattern: /KEY\s*=\s*[^#$\n]{15,}/i,
    message: 'Potential real cryptographic key detected',
  },
  {
    pattern: /TOKEN\s*=\s*[^#$\n]{10,}/i,
    message: 'Potential real token detected (not a placeholder)',
  },

  // Database credentials
  {
    pattern: /DB_PASSWORD\s*=\s*[^#$\n]+/i,
    message: 'Database password should not be committed',
  },
  {
    pattern: /DATABASE_URL\s*=\s*[^\s;]*password/i,
    message: 'Database URL contains password - should be in secrets manager',
  },

  // AWS credentials
  {
    pattern: /AWS_ACCESS_KEY_ID\s*=\s*[^#$\n]+/i,
    message: 'AWS Access Key ID should not be committed',
  },
  {
    pattern: /AWS_SECRET_ACCESS_KEY\s*=\s*[^#$\n]+/i,
    message: 'AWS Secret Access Key should not be committed',
  },

  // API keys
  {
    pattern: /API_KEY\s*=\s*[^#$\n]{10,}/i,
    message: 'API key detected - should be in secrets manager',
  },
  {
    pattern: /STRIPE_SECRET_KEY\s*=\s*[^#$\n]+/i,
    message: 'Stripe secret key should not be committed',
  },
  {
    pattern: /PAYPAL_SECRET\s*=\s*[^#$\n]+/i,
    message: 'PayPal secret should not be committed',
  },

  // Private keys
  {
    pattern: /-----BEGIN\sRSA?\sPRIVATE\sKEY-----/,
    message: 'Private key detected in environment file',
  },

  // JWT secrets
  {
    pattern: /JWT_SECRET\s*=\s*[^#$\n]{10,}/i,
    message: 'JWT secret should be in secrets manager',
  },
];

function checkEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    // Check if this looks like an example/template file
    const isExample =
      relativePath.includes('example') ||
      relativePath.includes('template') ||
      relativePath.includes('.example') ||
      relativePath.includes('.template');

    ENV_SECURITY_PATTERNS.forEach(({ pattern, message }) => {
      const matches = content.match(pattern);
      if (matches) {
        // Allow in example files if they contain placeholder values
        if (
          isExample &&
          (content.includes('# Placeholder') ||
            content.includes('# Replace with') ||
            content.includes('# TODO') ||
            content.includes('your-') ||
            content.includes('CHANGE_ME') ||
            content.includes('REPLACE_ME'))
        ) {
          // Allow placeholders in example files
          return;
        }

        hasErrors = true;
        errors.push({
          file: relativePath,
          pattern: pattern.toString(),
          message,
          occurrences: matches.length,
          isExample,
        });
      }
    });
  } catch (error) {
    console.error(
      `❌ Error reading environment file ${filePath}: ${error.message}`
    );
  }
}

console.log('🔐 Running environment security checks...');

// Check each staged environment file
stagedFiles.forEach(filePath => {
  if (
    fs.existsSync(filePath) &&
    (filePath.endsWith('.env') ||
      filePath.endsWith('.environment') ||
      path.basename(filePath).startsWith('.env'))
  ) {
    checkEnvFile(filePath);
  }
});

// Report results
if (hasErrors) {
  console.log('\n❌ ENVIRONMENT SECURITY VIOLATIONS DETECTED!');
  console.log('============================================');

  errors.forEach(error => {
    console.log(`📁 File: ${error.file}`);
    console.log(`🚨 Issue: ${error.message}`);
    if (error.occurrences) {
      console.log(`🔢 Occurrences: ${error.occurrences}`);
    }
    if (error.isExample) {
      console.log(
        `ℹ️  Note: This appears to be an example file but contains real credentials`
      );
    }
    console.log('---');
  });

  console.log('\n🔧 Required Actions:');
  console.log('   • Move all secrets to AWS Secrets Manager');
  console.log('   • Use environment variables for configuration only');
  console.log('   • Never commit real credentials to version control');
  console.log('   • Use placeholder values in .env.example files');
  console.log('   • Implement proper secret rotation policies');
  console.log('');
  console.log('🔒 COMMIT BLOCKED FOR ENVIRONMENT SECURITY COMPLIANCE');
  console.log('   • Remove all sensitive data before committing');
  console.log('   • Contact security team: security@meqenet.et');

  process.exit(1);
} else {
  console.log('✅ Environment security checks passed');
  console.log('🇪🇹 Environment files meet enterprise security standards');
}
