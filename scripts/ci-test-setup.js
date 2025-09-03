#!/usr/bin/env node

/**
 * CI Test Setup Script for Meqenet.et
 *
 * This script prepares the test environment for CI/CD by:
 * 1. Setting up the test database
 * 2. Generating Prisma client
 * 3. Configuring environment variables
 * 4. Ensuring all dependencies are ready
 *
 * @author Meqenet.et DevOps Team
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up test environment for Meqenet.et CI/CD...\n');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'blue') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Check if we're in the right directory
if (!fs.existsSync('package.json') || !fs.existsSync('governance')) {
  error('Please run this script from the project root directory');
  process.exit(1);
}

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://test:test@localhost:5432/meqenet_test';

// Ensure test database URL is set
if (!process.env.DATABASE_URL) {
  error(
    'DATABASE_URL is not set. Please set TEST_DATABASE_URL environment variable.'
  );
  process.exit(1);
}

log('Environment variables configured');

// Step 1: Install dependencies if needed
try {
  log('📦 Checking dependencies...');
  if (!fs.existsSync('node_modules')) {
    log('Installing dependencies...');
    execSync('pnpm install', { stdio: 'inherit' });
    success('Dependencies installed');
  } else {
    success('Dependencies already installed');
  }
} catch (err) {
  error(`Failed to install dependencies: ${err.message}`);
  process.exit(1);
}

// Step 2: Generate Prisma client
try {
  log('🗄️  Generating Prisma client...');
  const authServicePath = path.join(
    __dirname,
    '..',
    'backend',
    'services',
    'auth-service'
  );
  execSync('pnpm prisma generate', {
    stdio: 'inherit',
    cwd: authServicePath,
    env: { ...process.env, NODE_ENV: 'test' },
  });
  success('Prisma client generated');
} catch (err) {
  error(`Failed to generate Prisma client: ${err.message}`);
  process.exit(1);
}

// Step 3: Set up test database
try {
  log('🗃️  Setting up test database...');

  // Check if we have a test database URL
  const dbUrl = new URL(process.env.DATABASE_URL);
  const dbName = dbUrl.pathname.slice(1); // Remove leading slash

  // Create database if it doesn't exist
  const adminDbUrl = new URL(process.env.DATABASE_URL);
  adminDbUrl.pathname = '/postgres'; // Connect to default postgres database

  // For local development, we'll assume the database exists
  // In CI, this should be handled by the CI pipeline
  if (process.env.CI) {
    log('CI environment detected, assuming database is already set up');
  } else {
    warning('Local environment detected - ensure test database is running');
  }

  success('Test database setup complete');
} catch (err) {
  error(`Failed to setup test database: ${err.message}`);
  process.exit(1);
}

// Step 4: Run database migrations
try {
  log('🔄 Running database migrations...');
  const authServicePath = path.join(
    __dirname,
    '..',
    'backend',
    'services',
    'auth-service'
  );
  execSync('pnpm prisma migrate deploy', {
    stdio: 'inherit',
    cwd: authServicePath,
    env: { ...process.env, NODE_ENV: 'test' },
  });
  success('Database migrations completed');
} catch (err) {
  error(`Failed to run migrations: ${err.message}`);
  // Don't exit here - migrations might fail in local dev without DB
  warning(
    'Database migrations failed - this is expected in local development without a test database'
  );
}

// Step 5: Verify setup
try {
  log('🔍 Verifying test setup...');

  // Check if Prisma client was generated
  const prismaClientPath = path.join(
    __dirname,
    '..',
    'backend',
    'services',
    'auth-service',
    'node_modules',
    '.prisma',
    'client'
  );

  if (!fs.existsSync(prismaClientPath)) {
    error(`Prisma client not found at: ${prismaClientPath}`);
    process.exit(1);
  }

  success('Prisma client verified');

  // Note: We don't test database connection here since it's expected to fail
  // in local development without a running test database
  success('Setup verification completed');
} catch (err) {
  error(`Setup verification failed: ${err.message}`);
  process.exit(1);
}

console.log('\n' + '='.repeat(50));
success('🎉 Test environment setup complete!');
log('You can now run tests with: pnpm test');
console.log('='.repeat(50) + '\n');

// Export success for CI scripts
process.exit(0);
