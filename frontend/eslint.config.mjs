// Temporarily disabled Nx configs due to ESLint 9.x compatibility issues
// import nx from '@nx/eslint-plugin';
import js from '@eslint/js';
import security from 'eslint-plugin-security';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tsparser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  // Temporarily disabled Nx configs due to ESLint 9.x compatibility issues
  // ...nx.configs['flat/base'],
  // ...nx.configs['flat/typescript'],
  // ...nx.configs['flat/javascript'],
  js.configs.recommended,
  security.configs.recommended,
  {
    plugins: {
      'jsx-a11y': jsxA11y,
      '@typescript-eslint': tsPlugin,
    },
  },
  {
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  // Environment configurations
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        URL: 'readonly',
        File: 'readonly',
        Request: 'readonly',
        alert: 'readonly',
        // React globals (when not imported)
        React: 'readonly',
        // DOM element types
        HTMLElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        SVGSVGElement: 'readonly',
        // Event types
        MouseEvent: 'readonly',
        TouchEvent: 'readonly',
        KeyboardEvent: 'readonly',
        FocusEvent: 'readonly',
        EventListener: 'readonly',
        EventListenerObject: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        // Service Worker types
        ServiceWorkerGlobalScope: 'readonly',
        // DOM APIs
        DOMRect: 'readonly',
        Node: 'readonly',
        // Node.js types for TypeScript
        NodeJS: 'readonly',
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
      },
    },
  },
  // Test environment globals
  {
    files: [
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.spec.js',
      '**/*.spec.tsx',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.test.js',
      '**/*.test.tsx',
      '**/test/**/*.ts',
      '**/test/**/*.tsx',
      '**/test/**/*.js',
      '**/test/**/*.jsx',
      '**/test-setup/**/*.{ts,tsx,js,jsx}',
      '**/vitest.setup.{ts,tsx,js,jsx}',
      '**/jest.setup.{ts,tsx,js,jsx}',
    ],
    languageOptions: {
      globals: {
        // Testing framework globals
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
        jest: 'readonly',
        // Extend browser globals for tests
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        global: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
      },
    },
  },
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      '**/metro.config.js',
      '**/babel.config.js',
      '**/.next',
      '**/.next/**/*',
      '**/public/**/*',
      'apps/website/public/**/*',
      '**/*.d.ts', // TypeScript declaration files
      'apps/website/next-env.d.ts', // Next.js generated types
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // Temporarily disable @nx/enforce-module-boundaries due to compatibility issues
      // '@nx/enforce-module-boundaries': 'off',
      // Disable base no-unused-vars rule when using TypeScript extension
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
      '@typescript-eslint/no-empty-function': [
        'error',
        {
          allow: ['constructors'],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-duplicate-enum-values': 'off', // Temporarily disabled due to TypeScript version compatibility issue
      'prefer-const': 'error',
      'no-alert': 'error',
      // Custom rule to prevent process.env usage outside of config files
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[object.name="process"][property.name="env"]',
          message: 'Do not use process.env directly outside of config files. Use environment variables through a config module.',
        },
      ],
    },
  },
  // Special override for app directory to ensure our no-unused-vars rule is respected
  {
    files: ['apps/app/**/*.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Special handling for app directory - allow unused vars in type definition files
  {
    files: ['apps/app/src/features/bnpl/types/bnpl.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    // Allow process.env in specific file patterns
    files: [
      '**/*.config.{ts,js,mjs}',
      '**/config/**/*.{ts,js,mjs}',
      '**/*config*/**/*.{ts,js,mjs}',
      '**/*.setup.{ts,js,mjs}',
      '**/next-i18next.config.{ts,js,mjs}',
      '**/vitest.setup.{ts,js,mjs}',
      '**/jest.setup.{ts,js,mjs}',
      '**/test-setup/**/*.{ts,js,mjs}',
      '**/security/**/*.{ts,js,mjs}',
      'src/lib/security/**/*.{ts,js,mjs}',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {
      // Common rules for all JS/TS files
      'no-console': 'warn',
      'prefer-const': 'error',
      // JSX accessibility rules
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/autocomplete-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/control-has-associated-label': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/lang': 'error',
      'jsx-a11y/media-has-caption': 'error',
      'jsx-a11y/mouse-events-have-key-events': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-aria-hidden-on-focusable': 'error',
      'jsx-a11y/no-autofocus': 'error',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
      'jsx-a11y/no-noninteractive-tabindex': 'error',
      'jsx-a11y/no-onchange': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/prefer-tag-over-role': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
    },
  },
  // Configuration for .mjs files and config files
  {
    files: ['*.mjs', '**/*.mjs', '*.config.js', '**/*.config.js', 'next-i18next.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js globals for ESM modules and config files
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        global: 'readonly',
      },
    },
  },
];
