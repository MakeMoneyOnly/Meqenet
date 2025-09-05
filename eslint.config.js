// Minimal security linting - focus on critical issues only
const security = require('eslint-plugin-security');

module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.next/**/*',
      '**/coverage/**',
      '**/logs/**',
      '**/*.min.js',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      '**/metro.config.js',
      '**/babel.config.js',
      '**/.security/**/*.js',
      'eslint-report.json',
      'audit-results.json',
      // External dependencies and environments
      '**/.venv/**',
      '**/.venv/**/*',
      '**/share/**',
      '**/jupyter/**',
      '**/nbextensions/**',
      '**/pydeck/**',
      '**/plotly/**',
      '**/dash/**',
      // Template files with cookiecutter syntax
      '**/templates/**/*.ts',
      '**/templates/**/*.js',
      '**/templates/**/*.tsx',
      '**/templates/**/*.jsx',
      // Generated files
      'debug-prisma-import.js',
      'prisma-engines.zip',
    ],
  },
  // Very minimal security checks - only the most critical issues
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: require('@typescript-eslint/parser'),
    },
    plugins: {
      security,
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      // Only the most critical security issues
      'security/detect-eval-with-expression': 'error',
      'security/detect-child-process': 'error',
      'security/detect-unsafe-regex': 'error',

      // TypeScript essentials
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          caughtErrors: 'all',
        },
      ],
    },
  },
];
