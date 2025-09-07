#!/usr/bin/env node

/**
 * Meqenet.et Enterprise Commit Message Validator
 * Validates commit messages against FinTech compliance standards
 */

import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(colors.red, `❌ ${message}`);
}

function success(message) {
  log(colors.green, `✅ ${message}`);
}

function info(message) {
  log(colors.blue, `ℹ️  ${message}`);
}

function warning(message) {
  log(colors.yellow, `⚠️  ${message}`);
}

// Enterprise FinTech validation rules
const VALID_TYPES = [
  'build',
  'chore',
  'ci',
  'docs',
  'feat',
  'fix',
  'perf',
  'refactor',
  'revert',
  'security',
  'style',
  'test',
];

const TICKET_PATTERNS = [
  'JIRA-\\d+',
  'TICKET-\\d+',
  'ISSUE-\\d+',
  'MEQ-\\d+',
  'BNPL-\\d+',
  'PAY-\\d+',
  'AUTH-\\d+',
  'SEC-\\d+',
];

function validateCommitMessage(commitMsg) {
  const errors = [];
  const warnings = [];

  if (!commitMsg || commitMsg.trim().length === 0) {
    errors.push('Commit message cannot be empty');
    return { valid: false, errors, warnings };
  }

  // Check minimum length
  if (commitMsg.length < 10) {
    warnings.push('Commit message is very short (recommended: 10+ characters)');
  }

  // Check conventional commit format
  const conventionalRegex = new RegExp(
    `^(${VALID_TYPES.join('|')})(\\([a-z0-9-]+\\))?: .+$`,
    'i'
  );
  if (!conventionalRegex.test(commitMsg)) {
    errors.push('Commit message does not follow conventional commit format');
    errors.push('Format: type(scope): description');
    errors.push(`Valid types: ${VALID_TYPES.join(', ')}`);
  }

  // Check for JIRA ticket reference
  const ticketRegex = new RegExp(
    `\\((${TICKET_PATTERNS.join('|').replace(/\\d\+/g, '\\d+')})\\)`
  );
  if (!ticketRegex.test(commitMsg)) {
    errors.push('Commit message must include a JIRA ticket reference');
    errors.push(`Supported formats: (${TICKET_PATTERNS.join('), (')})`);
  }

  // Check line length
  if (commitMsg.length > 100) {
    warnings.push(
      'Commit message is very long (recommended: under 100 characters)'
    );
  }

  // Check for Ethiopian FinTech specific patterns
  if (
    commitMsg.toLowerCase().match(/(fayda|nbe|telebirr|ethiopia|ethiopian)/)
  ) {
    info('🇪🇹 Ethiopian FinTech specific commit detected');
  }

  // Check for security-related commits
  if (
    commitMsg.toLowerCase().match(/(security|auth|encrypt|token|key|secret)/)
  ) {
    info('🔐 Security-related commit detected');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('🇪🇹 Meqenet.et Enterprise Commit Message Validator');
    console.log('=================================================');
    console.log('');
    console.log('Usage:');
    console.log(
      '  node scripts/validate-commit-message.js "your commit message"'
    );
    console.log('  node scripts/validate-commit-message.js --interactive');
    console.log('');
    console.log('Examples:');
    console.log(
      '  node scripts/validate-commit-message.js "feat(auth): add biometric login (JIRA-123)"'
    );
    console.log(
      '  node scripts/validate-commit-message.js "fix(payment): resolve timeout issue (MEQ-456)"'
    );
    process.exit(1);
  }

  let commitMsg = args.join(' ');

  if (args[0] === '--interactive') {
    console.log('🇪🇹 Meqenet.et Enterprise Commit Message Validator');
    console.log('=================================================');
    console.log('');
    console.log('Enter your commit message (press Ctrl+C to cancel):');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Commit message: ', answer => {
      commitMsg = answer.trim();
      rl.close();

      const result = validateCommitMessage(commitMsg);
      displayResults(commitMsg, result);
      process.exit(result.valid ? 0 : 1);
    });
  } else {
    const result = validateCommitMessage(commitMsg);
    displayResults(commitMsg, result);
    process.exit(result.valid ? 0 : 1);
  }
}

function displayResults(commitMsg, result) {
  console.log('');
  console.log('📝 Commit Message Validation Results');
  console.log('====================================');
  console.log(`📋 Message: "${commitMsg}"`);
  console.log('');

  if (result.errors.length > 0) {
    result.errors.forEach(err => error(err));
    console.log('');
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach(warn => warning(warn));
    console.log('');
  }

  if (result.valid) {
    success('Commit message meets enterprise FinTech standards!');
    success('Ready for commit and CI/CD pipeline');
    console.log('');
    info("🇪🇹 Meqenet.et - Ethiopia's Financial Future");
  } else {
    error('Commit message validation FAILED');
    error('Please fix the issues above before committing');
    console.log('');
    info('💡 Use: node scripts/validate-commit-message.js --interactive');
  }
}

// Run if called directly
main();

export { validateCommitMessage };
