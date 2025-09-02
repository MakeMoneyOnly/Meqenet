import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

// Temporary configuration without import plugin due to compatibility issues
export default [
  {
    ignores: [
      'node_modules/',
      '**/dist/**',
      'dist/',
      '**/build/**',
      'build/',
      '**/coverage/**',
      'coverage/',
      '**/*.min.js',
      '**/*.html',
      'public/',
      '.next/',
      '.cache/',
      '.venv/**',
      '**/.venv/**',
      '.pip-audit-deps-temp/**',
      '**/.pip-audit-deps-temp/**',
      '.pip-audit-deps/**',
      '**/.pip-audit-deps/**',
      'templates/',
      '**/templates/**',
      'eslint.config.js',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
      '**/.prettierrc.js',
      '**/.prettierrc.cjs',
      '**/jest.preset.js',
      '**/jest.preset.ts',
      '**/vitest.config.mjs',
      '**/webpack.config.js',
      '**/metro.config.js',
      '**/.babelrc.js',
      'tools/**/*.cjs',
      'tools/**/*.js',
      'scripts/**/*.js',
      '.security/**/*.js',
      'backend/services/api-gateway/dist/**',
      'backend/services/auth-service/dist/**',
      'backend/dist/**',
      '.turbo/',
      '**/.turbo/**',
      'out/',
      'tmp/',
      'logs/',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Basic TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',

      // Security rules
      'no-console': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'error',
      'no-undef': 'error',
    },
  },
  // Test files - more lenient configuration for Vitest
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.tsx', '**/*.test.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: false, // Disable project for test files
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        // Vitest globals (primary testing framework)
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        vitest: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Relax some rules for tests
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'no-unused-expressions': 'off',
    },
  },
];
