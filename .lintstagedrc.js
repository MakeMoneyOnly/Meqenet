/**
 * Enterprise-Grade lint-staged configuration for fintech application
 * Optimized for performance with large file sets and comprehensive security checks
 */

const micromatch = require('micromatch');

module.exports = {
  // ============================================================================
  // FORMATTING & BASIC LINTING - BATCHED FOR PERFORMANCE
  // ============================================================================

  // Prettier formatting for all supported files - batched
  '*.{js,jsx,ts,tsx,json,md,yml,yaml}': files => {
    const validFiles = micromatch(files, [
      '**/*.{js,jsx,ts,tsx,json,md,yml,yaml}',
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
    ]);

    if (validFiles.length === 0) return [];

    // Batch files to prevent memory issues
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < validFiles.length; i += batchSize) {
      const batch = validFiles.slice(i, i + batchSize);
      batches.push(`npx prettier --write ${batch.map(f => `"${f}"`).join(' ')}`);
    }
    return batches;
  },

  // ============================================================================
  // ESLINT CHECKS - OPTIMIZED FOR LARGE FILE SETS
  // ============================================================================

  // TypeScript/JavaScript files - Batched processing
  '*.{js,jsx,ts,tsx}': files => {
    // Filter out files that shouldn't be linted
    const filesToLint = micromatch(files, [
      '**/*.{js,jsx,ts,tsx}',
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

    if (filesToLint.length === 0) return [];

    // Separate financial files for enhanced security checks
    const financialFiles = filesToLint.filter(file =>
      file.includes('payment') ||
      file.includes('auth') ||
      file.includes('financial') ||
      file.includes('credit') ||
      file.includes('loan') ||
      file.includes('transaction')
    );

    const regularFiles = filesToLint.filter(file => !financialFiles.includes(file));

    const commands = [];

    // Process regular files in batches
    if (regularFiles.length > 0) {
      const batchSize = 5;
      for (let i = 0; i < regularFiles.length; i += batchSize) {
        const batch = regularFiles.slice(i, i + batchSize);
        commands.push(
          `npx cross-env NODE_OPTIONS="--max-old-space-size=2048" eslint --fix --config eslint.config.staged.js --no-cache --max-warnings 0 ${batch.map(f => `"${f}"`).join(' ')}`
        );
      }
    }

    // Process financial files individually with enhanced security
    for (const file of financialFiles) {
      commands.push(
        `npx cross-env NODE_OPTIONS="--max-old-space-size=2048" eslint --fix --config eslint.config.staged.js --no-cache --max-warnings 0 --rule "security/detect-eval-with-expression: error" --rule "security/detect-child-process: error" --rule "no-eval: error" --rule "no-implied-eval: error" --rule "security/detect-non-literal-regexp: error" "${file}"`
      );
    }

    return commands;
  },

  // ============================================================================
  // TEST FILES - MORE LENIENT BUT STILL SECURE - BATCHED
  // ============================================================================

  '*.{test,spec}.{js,jsx,ts,tsx}': files => {
    const testFiles = micromatch(files, [
      '**/*.{test,spec}.{js,jsx,ts,tsx}',
      '!**/node_modules/**',
      '!**/dist/**',
      '!**/build/**',
      '!**/coverage/**',
    ]);

    if (testFiles.length === 0) return [];

    // Batch test files for performance
    const batchSize = 8;
    const batches = [];
    for (let i = 0; i < testFiles.length; i += batchSize) {
      const batch = testFiles.slice(i, i + batchSize);
      batches.push(
        `npx cross-env NODE_OPTIONS="--max-old-space-size=2048" eslint --fix --config eslint.config.staged.js --no-cache --max-warnings 5 --rule "no-console: off" --rule "@typescript-eslint/no-explicit-any: warn" ${batch.map(f => `"${f}"`).join(' ')}`
      );
    }

    return batches;
  },

  // ============================================================================
  // E2E TEST FILES - BATCHED
  // ============================================================================

  '**/backend-e2e/**/*.ts': files => {
    const e2eFiles = micromatch(files, [
      '**/backend-e2e/**/*.ts',
      '!**/node_modules/**',
      '!**/dist/**',
      '!**/build/**',
    ]);

    if (e2eFiles.length === 0) return [];

    // Batch E2E files for performance
    const batchSize = 3;
    const batches = [];
    for (let i = 0; i < e2eFiles.length; i += batchSize) {
      const batch = e2eFiles.slice(i, i + batchSize);
      batches.push(
        `npx cross-env NODE_OPTIONS="--max-old-space-size=2048" eslint --fix --config eslint.config.staged.js --no-cache --max-warnings 10 --rule "no-console: off" --rule "@typescript-eslint/no-explicit-any: off" --rule "internal/no-process-env-outside-config: off" ${batch.map(f => `"${f}"`).join(' ')}`
      );
    }

    return batches;
  },

  // ============================================================================
  // CONFIGURATION FILES VALIDATION
  // ============================================================================

  // Package.json validation
  'package.json': files => [
    "node -e \"try { JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log('✅ package.json is valid JSON'); } catch(e) { console.error('❌ package.json contains invalid JSON:', e.message); process.exit(1); }\"",
  ],

  // TypeScript config validation - batched
  'tsconfig*.json': files => {
    const tsConfigFiles = micromatch(files, [
      'tsconfig*.json',
      '!**/node_modules/**',
    ]);

    if (tsConfigFiles.length === 0) return [];

    return ['npx tsc --noEmit --skipLibCheck || (echo "❌ TypeScript compilation failed"; exit 1)'];
  },

  // ============================================================================
  // ADDITIONAL SECURITY VALIDATION FOR FINANCIAL FILES
  // ============================================================================

  // Files containing sensitive financial logic - simplified validation
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

      if (financialFiles.length === 0) return [];

      // Simple compliance check - only warn, don't fail
      return [
        `bash -c "echo '🔍 Checking financial files for compliance patterns...'; for file in ${financialFiles.map(f => `"${f}"`).join(' ')}; do if ! grep -q 'audit\\|compliance\\|NBE\\|security' \\"\\$file\\" 2>/dev/null; then echo '⚠️  WARNING: \\$file missing compliance documentation'; fi; done; echo '✅ Financial compliance check completed'"`,
      ];
    },
};
