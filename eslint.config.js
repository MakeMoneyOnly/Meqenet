const globals = require('globals');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const security = require('eslint-plugin-security');
const importPlugin = require('eslint-plugin-import');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const jsxA11y = require('eslint-plugin-jsx-a11y');

// Internal plugin: restrict process.env usage to files under **/shared/config/** only
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
            // Match process.env or process["env"]
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

module.exports = [
  {
    // Global ignores
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
      'governance/reports/**',
      'governance/owasp-data/**',
      'governance/owasp-reports/**',
      'governance/logs/**',
      // Explicit service build artifacts
      'backend/services/api-gateway/dist/**',
      'backend/services/auth-service/dist/**',
      'backend/dist/**',
      // Misc cache/output dirs
      '.turbo/',
      '**/.turbo/**',
      'out/',
      'tmp/',
      'logs/',
      // Configuration files that use CommonJS or have special parsing needs
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
      '**/tailwind.config.js',
      '**/next.config.js',
      '**/next.config.mjs',
      '**/.babelrc.js',
      'tools/**/*.cjs',
      'tools/**/*.js',
      'scripts/**/*.js',
      '.security/**/*.js',
    ],
  },

  // Base configurations
  security.configs.recommended,

  // TypeScript/JavaScript source files - Strict for Enterprise
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
        allowDefaultProject: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
      internal: internalSecurityPlugin,
      react,
      'react-hooks': reactHooks,
      security,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      'import/resolver': {
        oxc: {
          // Modern TypeScript resolver without deprecated dependencies
        },
        node: true,
      },
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Security Rules - Critical for FinTech
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',

      // TypeScript Rules - Strict for Enterprise
      'no-unused-vars': 'off', // Disable base rule, use TS-aware version
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
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/no-require-imports': 'error',

      // Import Rules - Strict for Enterprise
      'import/no-unresolved': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // React Rules - Strict for Enterprise
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react/prop-types': 'error',
      'react/jsx-no-bind': [
        'error',
        { allowArrowFunctions: true, allowBind: false, ignoreRefs: true },
      ],
      'react/jsx-no-leaked-render': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-curly-brace-presence': 'error',
      'react/self-closing-comp': 'error',

      // General Code Quality - Strict for Enterprise
      'no-console': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'error',
      'no-undef': 'error',

      // FinTech Specific Rules - Critical for Financial Applications
      'no-floating-decimal': 'error',
      'no-implicit-coercion': 'error',
      'no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, -1, 100],
          ignoreArrayIndexes: true,
          enforceConst: true,
          detectObjects: false,
        },
      ],

      // Ethiopian/Localization Rules
      'no-template-curly-in-string': 'error',

      // Enforce centralized environment access
      'internal/no-process-env-outside-config': 'error',
    },
  },

  // Test files - More lenient but still secure
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/test/**/*.ts',
      '**/test/**/*.tsx',
      '**/test/setup.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      // Allow magic numbers in tests for test data
      'no-magic-numbers': 'off',
      // Allow console in tests for debugging
      'no-console': 'off',
      // Allow any types in tests for mocking
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow process.env in tests for environment setup
      'internal/no-process-env-outside-config': 'off',
      // Relax function return types in tests
      '@typescript-eslint/explicit-function-return-type': 'warn',
    },
  },

  // JavaScript files - Strict but allow CommonJS patterns
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      import: importPlugin,
      security,
    },
    rules: {
      // Security Rules - Critical for FinTech
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',

      // General Code Quality
      'no-console': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'error',
      'no-undef': 'error',

      // FinTech Specific Rules
      'no-floating-decimal': 'error',
      'no-implicit-coercion': 'error',
      'no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, -1, 100],
          ignoreArrayIndexes: true,
          enforceConst: true,
          detectObjects: false,
        },
      ],

      // Import Rules
      'import/no-unresolved': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
];
