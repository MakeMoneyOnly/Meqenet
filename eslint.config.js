const globals = require('globals');
const tseslint = require('typescript-eslint');
const js = require('@eslint/js');
const security = require('eslint-plugin-security');
const importPlugin = require('eslint-plugin-import');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = tseslint.config(
  {
    // Global ignores
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '*.min.js',
      'public/',
      '.next/',
      '.cache/',
      'templates/',
    ],
  },

  // Base configurations
  js.configs.recommended,
  ...tseslint.configs.recommended,
  security.configs.recommended,

  // Global rules for all files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
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
      import: importPlugin,
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
      '@typescript-eslint/no-unused-vars': 'error',
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
    },
  },

  // Overrides for specific file patterns
  {
    files: ['services/**/*.ts', 'packages/api/**/*.ts'],
    rules: {
      'no-process-env': 'warn',
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
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: [
      '*.config.js',
      '*.config.ts',
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
    files: ['*.config.js', '*.config.cjs', '.prettierrc.cjs'],
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
      parserOptions: {
        project: ['./backend/services/auth-service/tsconfig.eslint.json'],
      },
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
      parserOptions: {
        project: ['./backend/services/api-gateway/tsconfig.json'],
      },
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
  }
);
