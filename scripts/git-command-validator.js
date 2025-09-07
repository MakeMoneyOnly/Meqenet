#!/usr/bin/env node

/**
 * Git Command Validator for Meqenet.et
 * Enterprise-Grade Git Command Security Gate
 *
 * Prevents dangerous git operations that bypass security controls
 * Specifically targets --no-verify flag usage and destructive operations
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

// Enterprise security configuration
const SECURITY_CONFIG = {
  blockedFlags: [
    '--no-verify',
    '--no-verify-signatures',
    '--allow-empty',
    '--force-with-lease',
    '--force',
  ],

  blockedCommands: [
    'git reset --hard',
    'git reset.*--hard',
    'git push.*--force',
    'git push.*-f',
    'git clean.*-fd',
    'git clean.*--force',
  ],

  allowedCommands: [
    'git status',
    'git log',
    'git diff',
    'git show',
    'git branch',
    'git checkout',
    'git merge',
    'git pull',
    'git fetch',
    'git add',
    'git rm',
    'git mv',
    'git stash',
  ],
};

/**
 * Validate git command arguments for security violations
 */
function validateGitCommand(args) {
  const commandLine = args.join(' ').toLowerCase();

  // Check for blocked flags
  for (const flag of SECURITY_CONFIG.blockedFlags) {
    if (commandLine.includes(flag.toLowerCase())) {
      throw new Error(`🚨 SECURITY VIOLATION: ${flag} flag detected!

❌ FORBIDDEN: Using ${flag} bypasses critical enterprise security controls
🔒 This violates Ethiopian FinTech regulatory compliance requirements

📋 BLOCKED FLAGS:
${SECURITY_CONFIG.blockedFlags.map(flag => `   • ${flag}`).join('\n')}

✅ REQUIRED: All git operations must pass enterprise security validation
🏛️ Contact security team: security@meqenet.et

🇪🇹 Ethiopian FinTech Security Compliance Enforced`);
    }
  }

  // Check for destructive command patterns
  for (const pattern of SECURITY_CONFIG.blockedCommands) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
    if (regex.test(commandLine)) {
      throw new Error(`🚨 DESTRUCTIVE OPERATION DETECTED!

❌ FORBIDDEN: ${pattern} command permanently destroys work
💀 This violates enterprise development standards and audit requirements

📋 BLOCKED PATTERNS:
${SECURITY_CONFIG.blockedCommands.map(cmd => `   • ${cmd}`).join('\n')}

✅ REQUIRED: Use safe alternatives that preserve work history
🔄 Safe alternatives: git reset --soft, git stash, git branch
🏛️ Contact development team for destructive operations: dev@meqenet.et

🇪🇹 Ethiopian FinTech Development Standards Enforced`);
    }
  }

  return true;
}

/**
 * Execute validated git command
 */
function executeGitCommand(args) {
  try {
    // Validate the command first
    validateGitCommand(args);

    // Execute the git command
    const result = execSync(`git ${args.join(' ')}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    return result;
  } catch (error) {
    if (
      error.message.includes('SECURITY VIOLATION') ||
      error.message.includes('DESTRUCTIVE OPERATION')
    ) {
      console.error('\n' + '='.repeat(80));
      console.error(error.message);
      console.error('='.repeat(80));
      process.exit(1);
    } else {
      // Re-throw other git errors
      throw error;
    }
  }
}

/**
 * Main execution function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Meqenet.et Git Command Validator v1.0.0');
    console.log('Enterprise-Grade Git Security Gate');
    console.log('Usage: git <command> [options]');
    process.exit(0);
  }

  // Validate and execute the git command
  executeGitCommand(args);
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  validateGitCommand,
  SECURITY_CONFIG,
};
