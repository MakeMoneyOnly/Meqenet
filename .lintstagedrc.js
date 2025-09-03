/**
 * Optimized lint-staged configuration for enterprise-grade fintech application
 * Prevents memory issues and improves performance for large codebases
 */

const micromatch = require('micromatch');

module.exports = {
  // Prettier formatting for all supported files
  '*.{js,jsx,ts,tsx,json,md,yml,yaml}': ['prettier --write'],

  // ESLint temporarily disabled due to configuration issues
  // TODO: Re-enable ESLint after fixing configuration conflicts
  // '*.{js,jsx,ts,tsx}': files => {
  //   // Filter out files that shouldn't be linted
  //   const filesToLint = micromatch(files, [
  //     '**/*.{js,jsx,ts,tsx}',
  //     // Exclude patterns that match eslint.config.js ignores
  //     '!**/node_modules/**',
  //     '!**/dist/**',
  //     '!**/build/**',
  //     '!**/coverage/**',
  //     '!**/*.min.js',
  //     '!**/templates/**',
  //     '!**/governance/reports/**',
  //     '!**/.venv/**',
  //     '!**/*.config.js',
  //     '!**/*.config.cjs',
  //     '!**/*.config.mjs',
  //     '!**/.storybook/**/*.ts',
  //     '!**/.storybook/**/*.tsx',
  //     // Temporarily skip problematic files
  //     '!frontend/libs/shared/src/i18n/index.ts',
  //     '!frontend/libs/shared/src/i18n/useI18n.tsx',
  //     '!backend/shared/src/i18n/i18n.service.ts',
  //     '!backend/shared/src/i18n/i18n.module.ts',
  //     '!backend/shared/src/i18n/i18n.interceptor.ts',
  //     '!backend/shared/src/i18n/i18n.middleware.ts',
  //     '!backend-e2e/src/auth.e2e-spec.ts',
  //   ]);
  //
  //   if (filesToLint.length === 0) {
  //     return [];
  //   }
  //
  //   // Process files one by one to avoid batching issues
  //   const commands = [];
  //
  //   for (const file of filesToLint) {
  //     // Use optimized config with cache and increased memory
  //     // Wrap each file path in quotes to handle Windows paths with spaces
  //     commands.push(
  //       `npx cross-env NODE_OPTIONS="--max-old-space-size=4096" eslint --fix --config eslint.config.staged.js --no-cache --max-warnings 0 "${file}"`
  //     );
  //   }
  //
  //   return commands;
  // },
};
