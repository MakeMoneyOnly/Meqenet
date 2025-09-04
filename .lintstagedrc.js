/**
 * Enterprise-Grade lint-staged configuration for fintech application
 * Comprehensive security, quality, and compliance checks
 */

const micromatch = require('micromatch');

module.exports = {
  // ============================================================================
  // FORMATTING & BASIC LINTING
  // ============================================================================

  // Prettier formatting for all supported files
  '*.{js,jsx,ts,tsx,json,md,yml,yaml}': ['prettier --write'],

  // ============================================================================
  // ADVANCED ESLINT CHECKS WITH SECURITY FOCUS
  // ============================================================================

  // TypeScript/JavaScript files - Enterprise security validation
  '*.{js,jsx,ts,tsx}': files => {
    // Filter out files that shouldn't be linted
    const filesToLint = micromatch(files, [
      '**/*.{js,jsx,ts,tsx}',
      // Core exclusions
      '!**/node_modules/**',
      '!**/dist/**',
      '!**/build/**',
      '!**/coverage/**',
      '!**/*.min.js',
      '!**/templates/**',
      '!**/governance/reports/**',
      '!**/.venv/**',
      '!**/*.config.js',
      '!**/*.config.cjs',
      '!**/*.config.mjs',
      '!**/.storybook/**',
      '!**/tools/**/*.cjs',
      '!**/scripts/**/*.js',
      '!**/.security/**',
      // Test files (handled separately)
      '!**/*.test.{js,jsx,ts,tsx}',
      '!**/*.spec.{js,jsx,ts,tsx}',
      '!**/backend-e2e/**',
      // Temporarily problematic files (should be fixed)
      '!frontend/libs/shared/src/i18n/index.ts',
      '!frontend/libs/shared/src/i18n/useI18n.tsx',
      '!backend/shared/src/i18n/i18n.service.ts',
      '!backend/shared/src/i18n/i18n.module.ts',
      '!backend/shared/src/i18n/i18n.interceptor.ts',
      '!backend/shared/src/i18n/i18n.middleware.ts',
    ]);

    if (filesToLint.length === 0) {
      return [];
    }

    const commands = [];

    for (const file of filesToLint) {
      // Enterprise-grade ESLint with security focus
      commands.push(
        `npx cross-env NODE_OPTIONS="--max-old-space-size=4096" eslint --fix --config eslint.config.staged.js --no-cache --max-warnings 0 "${file}"`
      );

      // Additional security checks for financial files
      if (
        file.includes('payment') ||
        file.includes('auth') ||
        file.includes('financial') ||
        file.includes('credit')
      ) {
        commands.push(
          `npx cross-env NODE_OPTIONS="--max-old-space-size=4096" eslint --config eslint.config.staged.js --no-cache --rule "security/detect-eval-with-expression: error" --rule "security/detect-child-process: error" --rule "no-eval: error" "${file}"`
        );
      }
    }

    return commands;
  },

  // ============================================================================
  // TEST FILES - MORE LENIENT BUT STILL SECURE
  // ============================================================================

  '*.{test,spec}.{js,jsx,ts,tsx}': files => {
    const testFiles = micromatch(files, [
      '**/*.{test,spec}.{js,jsx,ts,tsx}',
      '!**/node_modules/**',
      '!**/dist/**',
      '!**/build/**',
      '!**/coverage/**',
    ]);

    if (testFiles.length === 0) {
      return [];
    }

    const commands = [];

    for (const file of testFiles) {
      // Test files get security checks but allow console and some flexibility
      commands.push(
        `npx cross-env NODE_OPTIONS="--max-old-space-size=4096" eslint --fix --config eslint.config.staged.js --no-cache --max-warnings 5 --rule "no-console: off" --rule "@typescript-eslint/no-explicit-any: warn" "${file}"`
      );
    }

    return commands;
  },

  // ============================================================================
  // E2E TEST FILES
  // ============================================================================

  '**/backend-e2e/**/*.ts': files => {
    const e2eFiles = micromatch(files, [
      '**/backend-e2e/**/*.ts',
      '!**/node_modules/**',
      '!**/dist/**',
      '!**/build/**',
    ]);

    if (e2eFiles.length === 0) {
      return [];
    }

    const commands = [];

    for (const file of e2eFiles) {
      // E2E files need security checks but allow more flexibility for testing
      commands.push(
        `npx cross-env NODE_OPTIONS="--max-old-space-size=4096" eslint --fix --config eslint.config.staged.js --no-cache --max-warnings 10 --rule "no-console: off" --rule "@typescript-eslint/no-explicit-any: off" --rule "internal/no-process-env-outside-config: off" "${file}"`
      );
    }

    return commands;
  },

  // ============================================================================
  // CONFIGURATION FILES VALIDATION
  // ============================================================================

  // Package.json validation
  'package.json': files => [
    "node -e \"try { JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log('✅ package.json is valid JSON'); } catch(e) { console.error('❌ package.json contains invalid JSON:', e.message); process.exit(1); }\"",
  ],

  // TypeScript config validation
  'tsconfig*.json': files => [
    'npx tsc --noEmit --skipLibCheck || (echo "❌ TypeScript compilation failed"; exit 1)',
  ],

  // ============================================================================
  // FINANCIAL & SECURITY CRITICAL FILES
  // ============================================================================

  // Files containing sensitive financial logic
  '**/{payment,auth,financial,credit,loan,interest,transaction}*/**/*.{ts,tsx,js,jsx}':
    files => {
      const financialFiles = micromatch(files, [
        '**/{payment,auth,financial,credit,loan,interest,transaction}*/**/*.{ts,tsx,js,jsx}',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/build/**',
        '!**/coverage/**',
        '!**/*.test.{ts,tsx,js,jsx}',
        '!**/*.spec.{ts,tsx,js,jsx}',
      ]);

      if (financialFiles.length === 0) {
        return [];
      }

      const commands = [];

      for (const file of financialFiles) {
        // Enhanced security checks for financial code
        commands.push(
          `npx cross-env NODE_OPTIONS="--max-old-space-size=4096" eslint --config eslint.config.staged.js --no-cache --max-warnings 0 --rule "no-eval: error" --rule "no-implied-eval: error" --rule "security/detect-eval-with-expression: error" --rule "security/detect-child-process: error" --rule "no-new-func: error" "${file}"`
        );

        // Check for required compliance patterns
        commands.push(
          `bash -c "if ! grep -q 'audit\|compliance\|NBE\|security' '${file}'; then echo '⚠️  WARNING: ${file} missing compliance documentation'; fi"`
        );
      }

      return commands;
    },
};
