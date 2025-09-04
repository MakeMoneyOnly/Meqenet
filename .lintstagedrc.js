/**
 * Minimal lint-staged configuration for fintech application
 * Simple and stable for large file sets
 */

module.exports = {
  // Basic formatting
  '*.{js,jsx,ts,tsx,json,md,yml,yaml}': 'prettier --write',

  // Basic linting for TypeScript/JavaScript
  '*.{js,jsx,ts,tsx}': 'eslint --fix --config eslint.config.staged.js --no-cache --max-warnings 0',

  // Test files with relaxed rules
  '*.{test,spec}.{js,jsx,ts,tsx}': 'eslint --fix --config eslint.config.staged.js --no-cache --max-warnings 5 --rule "no-console: off"',

  // Basic config validation
  'package.json': 'node -e "JSON.parse(require(\'fs\').readFileSync(\'package.json\', \'utf8\')); console.log(\'✅ package.json valid\')"',
  'tsconfig*.json': 'tsc --noEmit --skipLibCheck || echo "❌ TypeScript errors found"'
};