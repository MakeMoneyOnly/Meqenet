const globals = require('globals');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const js = require('@eslint/js');
const security = require('eslint-plugin-security');
const importPlugin = require('eslint-plugin-import');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');

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
    ],
  },

  // Base configurations
  js.configs.recommended,
  security.configs.recommended,

  // Global rules for all files
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
    },
    settings: {
      'import/resolver': {
        oxc: {
          // Modern TypeScript resolver without deprecated dependencies
        },
        node: true,
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
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',

      // TypeScript Rules
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
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unused-expressions': 'off',

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

      // General Code Quality
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'error',

      // FinTech Specific Rules
      'no-floating-decimal': 'error',
      'no-implicit-coercion': 'error',
      'no-magic-numbers': [
        'warn',
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

  // Overrides for specific file patterns
  {
    files: ['services/**/*.ts', 'packages/api/**/*.ts'],
    rules: {
      'security/detect-non-literal-fs-filename': 'error',
    },
  },
  {
    files: ['apps/**/*.ts', 'apps/**/*.tsx'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
    },
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Scripts can read/write arbitrary files by design
      'security/detect-non-literal-fs-filename': 'off',
      // Allow object iteration patterns in scripts without erroring CI
      'security/detect-object-injection': 'off',
      'no-unused-vars': [
        'error',
        { args: 'all', argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/test/**/*.ts',
      '**/test/setup.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-process-env': 'off', // Allow process.env in test files for environment setup
      'internal/no-process-env-outside-config': 'off', // Disable internal rule in tests as well
    },
  },
  {
    files: [
      '**/*.config.js',
      '**/*.config.ts',
      'jest.preset.ts',
      'eslint.config.js',
      '.prettierrc.js',
      '.security/audit-config.js',
    ],
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: [
      '**/webpack.config.js',
      '*.config.js',
      '*.config.cjs',
      '.prettierrc.cjs',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    files: ['backend/webpack.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['backend/services/auth-service/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './backend/services/auth-service/tsconfig.eslint.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    settings: {
      'import/resolver': {
        oxc: {
          // Modern TypeScript resolver without deprecated dependencies
        },
        node: {
          extensions: ['.js', '.ts'],
        },
      },
    },
  },
  {
    files: ['backend/services/api-gateway/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './backend/services/api-gateway/tsconfig.eslint.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    settings: {
      'import/resolver': {
        oxc: {
          // Modern TypeScript resolver without deprecated dependencies
        },
        node: {
          extensions: ['.js', '.ts'],
        },
      },
    },
  },
];
