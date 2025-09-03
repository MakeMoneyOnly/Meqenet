const baseConfig = require('../eslint.config.js');
const globals = require('globals');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.e2e-spec.ts', '**/*.e2e.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        test: 'readonly',
      },
    },
    rules: {
      // Allow magic numbers in e2e tests
      'no-magic-numbers': 'off',
      // Allow console in e2e tests for debugging
      'no-console': 'off',
      // Allow any types in e2e tests for mocking
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow process.env in e2e tests
      'internal/no-process-env-outside-config': 'off',
      // Relax function return types in e2e tests
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
