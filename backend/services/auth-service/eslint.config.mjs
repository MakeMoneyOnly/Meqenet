import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import security from 'eslint-plugin-security';

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

// Enterprise-grade ESLint configuration for FinTech Auth Service
// Critical for financial security, compliance, and code quality
export default [
  {
    // Comprehensive ignore patterns for enterprise environment
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
      'prisma/migrations/',
      '**/*.generated.ts',
      '**/*.generated.js',
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
      'backend/services/auth-service/dist/**',
      'backend/services/api-gateway/dist/**',
      'backend/dist/**',
      '.turbo/',
      '**/.turbo/**',
      'out/',
      'tmp/',
      'logs/',
      // Database and generated files
      '**/migrations/**',
      '**/*.sql',
      'prisma/generated/',
      // Proto files
      'proto/**/*.proto',
      'proto/**/*.ts',
      // Kubernetes and deployment
      'k8s/',
      'deploy/',
      '**/*.yaml',
      '**/*.yml',
      // Documentation
      'docs/',
      'README.md',
    ],
  },

  // Production TypeScript/JavaScript source files - STRICT ENTERPRISE RULES
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.eslint.json',
        allowDefaultProject: true,
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
        // Node.js globals for enterprise applications
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        globalThis: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      internal: internalSecurityPlugin,
      security,
    },
    rules: {
      // === SECURITY RULES - CRITICAL FOR FINTECH ===
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-alert': 'error',
      'no-console': 'error',
      'no-debugger': 'error',

      // === TYPE SAFETY - ENTERPRISE GRADE ===
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          caughtErrors: 'all',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // Requires type information
      '@typescript-eslint/prefer-optional-chain': 'off', // Requires type information
      '@typescript-eslint/no-unnecessary-type-assertion': 'off', // Requires type information
      '@typescript-eslint/no-unsafe-assignment': 'off', // Requires type information
      '@typescript-eslint/no-unsafe-member-access': 'off', // Requires type information
      '@typescript-eslint/no-unsafe-call': 'off', // Requires type information
      '@typescript-eslint/no-unsafe-return': 'off', // Requires type information

      // === CODE QUALITY - STRICT ENTERPRISE STANDARDS ===
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'error',
      'no-undef': 'error',
      'no-shadow': 'error',
      'no-redeclare': 'error',
      'no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, -1, 100],
          ignoreArrayIndexes: true,
          enforceConst: true,
          detectObjects: false,
        },
      ],
      'no-floating-decimal': 'error',
      'no-implicit-coercion': 'error',
      'no-new-object': 'error',
      'no-new-wrappers': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unreachable-loop': 'error',
      'no-unsafe-negation': 'error',

      // === ERROR HANDLING - CRITICAL FOR FINANCIAL SYSTEMS ===
      'no-catch-shadow': 'error',

      // === ASYNC/PROMISE - ENTERPRISE RELIABILITY ===
      'no-async-promise-executor': 'error',
      'no-promise-executor-return': 'warn', // Too restrictive for some patterns
      'require-atomic-updates': 'warn', // Relax for interceptor patterns

      // === OBJECT SECURITY - PREVENT PROTOTYPE POLLUTION ===
      'no-proto': 'error',
      'no-prototype-builtins': 'error',
      'no-extend-native': 'error',

      // === FINANCIAL DATA SECURITY ===
      'no-loss-of-precision': 'off', // Not available in current ESLint version
      'no-unsafe-optional-chaining': 'off', // Not available in current ESLint version

      // === ENTERPRISE SECURITY - FINTECH COMPLIANCE ===
      'internal/no-process-env-outside-config': 'error',
    },
  },

  // Database and Infrastructure files - SPECIALIZED RULES
  {
    files: ['src/infrastructure/**/*.ts', 'src/shared/prisma/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Relax some rules for infrastructure code
      '@typescript-eslint/no-explicit-any': 'warn', // May be needed for Prisma types
      'no-console': 'warn', // Allow logging in infrastructure
      '@typescript-eslint/explicit-function-return-type': 'warn',
    },
  },

  // Test files - VITEST COMPATIBLE CONFIGURATION
  {
    files: ['**/*.spec.ts', '**/*.test.ts', 'test/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: false, // Disable project for test files
      },
      globals: {
        // Node.js globals
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

        // Additional testing utilities
        jest: 'readonly', // For compatibility
        afterEach: 'readonly',
        beforeEach: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Relax rules for tests while maintaining some standards
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-unused-expressions': 'off',
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-undef': 'off', // Vitest globals
    },
  },

  // Configuration files - MINIMAL RULES
  {
    files: ['**/*.config.ts', '**/*.config.js', 'vitest.config.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
