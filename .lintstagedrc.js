/**
 * Enterprise-grade lint-staged configuration for Meqenet.et FinTech
 * FinTech-specific pre-commit quality gates and security checks
 */

module.exports = {
  // JavaScript/TypeScript files - Core linting and formatting
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix --config eslint.config.staged.js --no-cache --max-warnings 0',
    'prettier --write',
  ],

  // Configuration and documentation files
  '*.{json,md,yml,yaml}': ['prettier --write'],

  // TypeScript-specific type checking
  '*.{ts,tsx}': ['tsc --noEmit --skipLibCheck'],
};
