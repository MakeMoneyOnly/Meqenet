export default {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  rules: {
    // Security rules (keep strict)
    'no-console': 'warn', // Allow console for development, warn instead of error
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // TypeScript rules (more lenient for development)
    '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error
    '@typescript-eslint/no-unused-vars': 'warn', // Warn instead of error
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    
    // React rules (more lenient)
    'react/no-unescaped-entities': 'warn',
    'react/no-danger': 'error', // Keep strict for security
    'react/no-danger-with-children': 'error',
    'react/jsx-no-script-url': 'error',
    'react/jsx-no-target-blank': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Next.js rules (more lenient for development)
    '@next/next/no-img-element': 'warn',
    '@next/next/no-html-link-for-pages': 'warn',
    
    // Import rules
    'import/no-anonymous-default-export': 'warn',
    
    // General rules
    'prefer-const': 'warn',
    'no-var': 'error',
  },
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
}; 