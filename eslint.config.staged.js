/**
 * Optimized ESLint configuration for lint-staged
 * Performance-optimized for pre-commit hooks to prevent memory issues
 * Follows fintech enterprise-grade security standards
 */

import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import security from 'eslint-plugin-security';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

// Internal plugin for process.env security
const internalSecurityPlugin = {
  rules: {
    'no-process-env-outside-config': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Disallow process.env usage outside of shared/config gateway files',
          recommended: true,
        },
        schema: [],
        messages: {
          forbidden:
            "Direct access to process.env is forbidden outside of 'shared/config'. Use the centralized ConfigService gateway.",
        },
      },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        const isAllowedGateway = /\/shared\/config\//.test(filename);
        const isTest =
          /\.(test|spec)\.[tj]sx?$/.test(filename) || /\/test\//.test(filename);
        if (isAllowedGateway || isTest) {
          return {};
        }
        return {
          MemberExpression(node) {
            const isProcess = node.object && node.object.name === 'process';
            const isEnvIdentifier =
              node.property &&
              node.property.type === 'Identifier' &&
              node.property.name === 'env';
            const isEnvLiteral =
              node.property &&
              node.property.type === 'Literal' &&
              node.property.value === 'env';
            if (isProcess && (isEnvIdentifier || isEnvLiteral)) {
              context.report({ node, messageId: 'forbidden' });
            }
          },
        };
      },
    },
  },
};

export default [
  {
    // Global ignores - extensive list for performance
    ignores: [
      'node_modules/',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.min.js',
      '**/*.html',
      'public/',
      '.next/',
      '.cache/',
      '.venv/**',
      '.eslintcache',
      'templates/',
      '**/templates/**',
      'governance/reports/**',
      'logs/',
      '.turbo/',
      'out/',
      'tmp/',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
      '**/jest.preset.js',
      '**/jest.preset.ts',
      '**/vitest.config.mjs',
      '**/webpack.config.js',
      '**/metro.config.js',
      '**/tailwind.config.js',
      '**/next.config.js',
      '**/next.config.mjs',
      '**/.storybook/**',
      'tools/**/*.cjs',
      'tools/**/*.js',
      'scripts/**/*.js',
      '.security/**/*.js',
      // Temporary: Skip auth service due to TypeScript 5.8.3 compatibility issue
      'backend/services/auth-service/src/features/auth/auth.service.ts',
    ],
  },

  // Base security configuration
  security.configs.recommended,

  // TypeScript/JavaScript files - Optimized for performance
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
        // Additional DOM types
        EventListener: 'readonly',
        EventListenerObject: 'readonly',
      },
      parserOptions: {
        // IMPORTANT: No project reference for performance
        // This avoids loading the entire TypeScript project
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        // allowDefaultProject helps with performance
        allowDefaultProject: true,
        // No project reference to avoid memory issues
        project: false,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      internal: internalSecurityPlugin,
      react,
      'react-hooks': reactHooks,
      security,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Critical Security Rules for FinTech
      'security/detect-non-literal-regexp': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'off', // Requires type info, disabled for performance
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',

      // Disable problematic security rules that cause false positives
      'security/detect-object-injection': 'off',
      'security/detect-unsafe-regex': 'off',

      // TypeScript Rules - Essential only for performance
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error for gradual improvement
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',

      // Disable type-aware rules that require project reference
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',

      // React Rules - Essential
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'jsx-a11y/accessible-emoji': 'off', // Deprecated rule
      'react/react-in-jsx-scope': 'off', // React 17+ JSX transform
      'react/prop-types': 'off', // Not needed with TypeScript
      'react/jsx-no-bind': 'off', // Performance optimization, but not critical
      'react/jsx-no-leaked-render': 'warn',
      'react/jsx-no-useless-fragment': 'warn',
      'react/jsx-curly-brace-presence': 'warn',
      'react/self-closing-comp': 'warn',

      // Essential Code Quality Rules
      'no-console': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
      'no-undef': 'error',

      // FinTech Specific Rules
      'no-floating-decimal': 'error',
      'no-implicit-coercion': 'error',
      'no-magic-numbers': 'off', // Too noisy for staged files
      'no-template-curly-in-string': 'error',

      // Environment security
      'internal/no-process-env-outside-config': 'error',
    },
  },

  // Test files - More lenient
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.e2e-spec.ts',
      '**/backend-e2e/**/*.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'internal/no-process-env-outside-config': 'off',
      'no-magic-numbers': 'off',
    },
  },

  // Files that need direct process.env access for legitimate reasons
  {
    files: [
      'backend/services/api-gateway/src/app/app.module.ts',
      'backend/services/auth-service/setup.ts',
      'scripts/seed.ts',
      'playwright.e2e.config.ts', // CI detection for Playwright configuration
      'frontend/apps/website/src/lib/config.ts', // Frontend config gateway
      'frontend/apps/app/src/features/bnpl/services/bnplApi.ts', // BNPL API service needs env access
    ],
    rules: {
      'internal/no-process-env-outside-config': 'off',
    },
  },

  // Logger utilities that need console and process.env access
  {
    files: ['frontend/apps/website/src/lib/security/index.ts'],
    rules: {
      'internal/no-process-env-outside-config': 'off',
      'no-console': 'off',
    },
  },

  // Temporary overrides for problematic files
  {
    files: [
      'frontend/libs/shared/src/i18n/index.ts',
      'frontend/libs/shared/src/i18n/useI18n.tsx',
      'backend/shared/src/i18n/i18n.service.ts',
      'backend/shared/src/i18n/i18n.module.ts',
      'backend/shared/src/i18n/i18n.interceptor.ts',
      'backend/shared/src/i18n/i18n.middleware.ts',
    ],
    rules: {
      'internal/no-process-env-outside-config': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
