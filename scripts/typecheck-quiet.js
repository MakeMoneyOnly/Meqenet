#!/usr/bin/env node

/**
 * Quiet typecheck wrapper
 * Runs vitest typecheck with suppressed experimental warnings
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Suppress specific warnings
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(' ');

  // Filter out specific warnings we want to suppress
  if (
    message.includes(
      'Testing types with tsc and vue-tsc is an experimental feature'
    ) ||
    message.includes('Breaking changes might not follow SemVer') ||
    message.includes('npm warn Unknown env config')
  ) {
    return; // Suppress these warnings
  }

  // Allow other warnings through
  originalConsoleWarn.apply(console, args);
};

// Run the vitest command
const vitestArgs = [
  'vitest',
  '--config',
  'apps/app/vitest.config.mjs',
  '--typecheck',
  '--run',
];

const child = spawn('npx', vitestArgs, {
  cwd: resolve(__dirname, '../frontend'),
  stdio: 'inherit',
  env: {
    ...process.env,
    // Clear problematic npm config vars
    npm_config_ignore_workspace_root_check: '',
    npm_config_recursive: '',
    npm_config_verify_deps_before_run: '',
  },
});

child.on('exit', code => {
  process.exit(code || 0);
});

child.on('error', error => {
  console.error('Failed to start typecheck:', error);
  process.exit(1);
});
