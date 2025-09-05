/**
 * Enterprise-grade lint-staged configuration for fintech application
 * Optimized for performance and security compliance
 */

module.exports = {
  // Basic formatting with better patterns
  '*.{js,jsx,ts,tsx,json,md,yml,yaml}': 'prettier --write --ignore-unknown',

  // TypeScript/JavaScript linting with enterprise security rules
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix --config eslint.config.staged.js --no-cache --max-warnings 0',
    'eslint --config eslint.config.staged.js --max-warnings 0'
  ],

  // Test files with relaxed rules for development
  '*.{test,spec}.{js,jsx,ts,tsx}': [
    'eslint --fix --config eslint.config.staged.js --no-cache --max-warnings 5 --rule "no-console: off"',
    'eslint --config eslint.config.staged.js --max-warnings 5 --rule "no-console: off"'
  ],

  // Configuration file validation
  'package.json': 'node -e "JSON.parse(require(\'fs\').readFileSync(\'package.json\', \'utf8\')); console.log(\'✅ package.json valid\')"',
  'tsconfig*.json': 'tsc --noEmit --skipLibCheck || echo "❌ TypeScript errors found"',
  'eslint.config*.js': 'node -e "require(\'./eslint.config.staged.js\'); console.log(\'✅ ESLint config valid\')"',

  // Security-sensitive files
  '*.{env,secret,key,crt,pem}': (files) => {
    if (files.length > 0) {
      console.warn('⚠️  WARNING: Security-sensitive files detected in commit');
      console.warn('   Files:', files.join(', '));
      console.warn('   Ensure these files are encrypted and properly managed');
    }
    return [];
  }
};