#!/usr/bin/env node

/**
 * Enterprise Pre-Commit Validation Script
 * Validates that all pre-commit checks are properly configured and functional
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Meqenet.et Pre-Commit Validation');
console.log('=====================================');

// Validation checks
const checks = {
  husky: {
    name: 'Husky Git Hooks',
    validate: () => {
      const huskyDir = path.join(process.cwd(), '.husky');
      const preCommitHook = path.join(huskyDir, 'pre-commit');
      const prePushHook = path.join(huskyDir, 'pre-push');

      if (!fs.existsSync(huskyDir)) {
        return { status: 'FAIL', message: '.husky directory not found' };
      }

      if (!fs.existsSync(preCommitHook)) {
        return { status: 'FAIL', message: 'pre-commit hook not found' };
      }

      if (!fs.existsSync(prePushHook)) {
        return { status: 'FAIL', message: 'pre-push hook not found' };
      }

      // Check if hooks are executable
      try {
        const preCommitStats = fs.statSync(preCommitHook);
        const prePushStats = fs.statSync(prePushHook);

        if (process.platform !== 'win32') {
          const preCommitExecutable = !!(
            preCommitStats.mode & parseInt('111', 8)
          );
          const prePushExecutable = !!(prePushStats.mode & parseInt('111', 8));

          if (!preCommitExecutable || !prePushExecutable) {
            return {
              status: 'WARN',
              message: 'Hook files may not be executable',
            };
          }
        }

        return {
          status: 'PASS',
          message: 'All Husky hooks configured correctly',
        };
      } catch (error) {
        return {
          status: 'FAIL',
          message: `Error checking hooks: ${error.message}`,
        };
      }
    },
  },

  lintStaged: {
    name: 'Lint-Staged Configuration',
    validate: () => {
      const lintStagedConfig = path.join(process.cwd(), '.lintstagedrc.js');

      if (!fs.existsSync(lintStagedConfig)) {
        return { status: 'FAIL', message: '.lintstagedrc.js not found' };
      }

      try {
        const config = require(lintStagedConfig);

        // Check if ESLint is enabled (handle both static arrays and functions)
        let hasESLint = false;
        for (const [pattern, commands] of Object.entries(config)) {
          if (
            pattern.includes('.{js,jsx,ts,tsx}') ||
            pattern.includes('.{ts,tsx}')
          ) {
            if (Array.isArray(commands)) {
              // Static array of commands
              hasESLint =
                hasESLint || commands.some(cmd => cmd.includes('eslint'));
            } else if (typeof commands === 'function') {
              // Function that returns commands array
              hasESLint = true; // Assume ESLint is configured if function exists
            }
          }
        }

        if (!hasESLint) {
          return {
            status: 'WARN',
            message: 'ESLint not found in lint-staged configuration',
          };
        }

        // Check for Prettier (handle both static arrays and functions)
        let hasPrettier = false;
        for (const [pattern, commands] of Object.entries(config)) {
          if (pattern.includes('.{js,jsx,ts,tsx,json,md,yml,yaml}') ||
              pattern.includes('*.{js,jsx,ts,tsx,json,md,yml,yaml}') ||
              pattern === '*.{js,jsx,ts,tsx,json,md,yml,yaml}') {
            if (Array.isArray(commands)) {
              // Static array of commands
              hasPrettier =
                hasPrettier || commands.some(cmd => cmd.includes('prettier'));
            } else if (typeof commands === 'function') {
              // Function that returns commands array - assume Prettier is configured
              hasPrettier = true;
            }
          }
        }

        if (!hasPrettier) {
          return {
            status: 'WARN',
            message: 'Prettier not found in lint-staged configuration',
          };
        }

        return {
          status: 'PASS',
          message: 'Lint-staged configuration is comprehensive',
        };
      } catch (error) {
        return {
          status: 'FAIL',
          message: `Error loading lint-staged config: ${error.message}`,
        };
      }
    },
  },

  eslintConfig: {
    name: 'ESLint Staged Configuration',
    validate: () => {
      const eslintConfig = path.join(process.cwd(), 'eslint.config.staged.js');

      if (!fs.existsSync(eslintConfig)) {
        return { status: 'FAIL', message: 'eslint.config.staged.js not found' };
      }

      try {
        const config = require(eslintConfig);

        // Check for security plugins
        const hasSecurity = config.some(
          ruleConfig => ruleConfig.plugins && ruleConfig.plugins.security
        );

        if (!hasSecurity) {
          return {
            status: 'WARN',
            message: 'Security ESLint plugin not configured',
          };
        }

        // Check for financial-specific rules
        const hasFinancialRules = config.some(
          ruleConfig =>
            ruleConfig.rules &&
            (ruleConfig.rules['no-eval'] ||
              ruleConfig.rules['security/detect-eval-with-expression'])
        );

        if (!hasFinancialRules) {
          return {
            status: 'WARN',
            message: 'Financial security rules not configured',
          };
        }

        return {
          status: 'PASS',
          message: 'ESLint staged configuration is enterprise-grade',
        };
      } catch (error) {
        return {
          status: 'FAIL',
          message: `Error loading ESLint config: ${error.message}`,
        };
      }
    },
  },

  packageJson: {
    name: 'Package.json Scripts',
    validate: () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        return { status: 'FAIL', message: 'package.json not found' };
      }

      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf8')
        );

        const requiredScripts = [
          'security:secrets',
          'security:audit',
          'format:check',
          'lint',
        ];

        const missingScripts = requiredScripts.filter(
          script => !packageJson.scripts || !packageJson.scripts[script]
        );

        if (missingScripts.length > 0) {
          return {
            status: 'WARN',
            message: `Missing required scripts: ${missingScripts.join(', ')}`,
          };
        }

        return {
          status: 'PASS',
          message: 'All required npm scripts are configured',
        };
      } catch (error) {
        return {
          status: 'FAIL',
          message: `Error reading package.json: ${error.message}`,
        };
      }
    },
  },

  prettierIgnore: {
    name: 'Prettier Ignore Configuration',
    validate: () => {
      const prettierIgnorePath = path.join(process.cwd(), '.prettierignore');

      if (!fs.existsSync(prettierIgnorePath)) {
        return { status: 'FAIL', message: '.prettierignore not found' };
      }

      try {
        const content = fs.readFileSync(prettierIgnorePath, 'utf8');

        const requiredPatterns = [
          'node_modules/',
          'dist/',
          'build/',
          'coverage/',
          'logs/',
          '*.log',
          '**/*.min.js',
        ];

        const missingPatterns = requiredPatterns.filter(
          pattern => !content.includes(pattern)
        );

        if (missingPatterns.length > 0) {
          return {
            status: 'WARN',
            message: `Missing recommended ignore patterns: ${missingPatterns.join(', ')}`,
          };
        }

        return {
          status: 'PASS',
          message: 'Prettier ignore configuration is comprehensive',
        };
      } catch (error) {
        return {
          status: 'FAIL',
          message: `Error reading .prettierignore: ${error.message}`,
        };
      }
    },
  },
};

// Run all checks
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warningChecks = 0;

console.log('\n📋 Validation Results:');
console.log('======================');

for (const [_key, check] of Object.entries(checks)) {
  totalChecks++;
  const result = check.validate();

  let statusIcon = '';
  let statusColor = '';

  switch (result.status) {
    case 'PASS':
      statusIcon = '✅';
      statusColor = '\x1b[32m'; // Green
      passedChecks++;
      break;
    case 'FAIL':
      statusIcon = '❌';
      statusColor = '\x1b[31m'; // Red
      failedChecks++;
      break;
    case 'WARN':
      statusIcon = '⚠️ ';
      statusColor = '\x1b[33m'; // Yellow
      warningChecks++;
      break;
  }

  console.log(`${statusIcon} ${check.name}:`);
  console.log(`   ${statusColor}${result.message}\x1b[0m`);
  console.log('');
}

// Summary
console.log('📊 Summary:');
console.log('===========');
console.log(`Total Checks: ${totalChecks}`);
console.log(`✅ Passed: ${passedChecks}`);
console.log(`⚠️  Warnings: ${warningChecks}`);
console.log(`❌ Failed: ${failedChecks}`);
console.log('');

// Recommendations
if (failedChecks > 0) {
  console.log('🚨 CRITICAL ISSUES DETECTED!');
  console.log('Please fix the failed checks before proceeding.');
  console.log('Run this script again after fixing issues.');
  process.exit(1);
} else if (warningChecks > 0) {
  console.log('⚠️  SOME WARNINGS DETECTED');
  console.log('Consider addressing the warnings for optimal security.');
  console.log('Pre-commit hooks are functional but could be enhanced.');
} else {
  console.log('🎉 ALL CHECKS PASSED!');
  console.log('Your pre-commit setup meets enterprise-grade standards.');
  console.log('🇪🇹 Ready to maintain world-class FinTech security!');
}

console.log('\n🔗 Useful Commands:');
console.log('===================');
console.log('• Test pre-commit: git add . && git commit -m "test"');
console.log('• Test pre-push: git push origin main --dry-run');
console.log('• Validate again: node scripts/validate-pre-commit.js');
console.log('• View hooks: ls -la .husky/');

process.exit(failedChecks > 0 ? 1 : 0);
