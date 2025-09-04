/**
 * NestJS Test Setup for Vitest
 *
 * This file ensures proper NestJS functionality by importing reflect-metadata
 * which is required for dependency injection to work.
 */

// Critical: Import reflect-metadata first for NestJS dependency injection
import 'reflect-metadata';

// Configure test environment variables
// These are set before NestJS application starts, so we need direct access
// eslint-disable-next-line no-process-env
process.env.NODE_ENV = 'test';
// eslint-disable-next-line no-process-env
process.env.FAYDA_ENCRYPTION_KEY = 'test-encryption-key-32-characters-long-key';
// eslint-disable-next-line no-process-env
process.env.FAYDA_HASH_SALT = 'test-hash-salt-for-fayda-id-hashing-32-chars';

// Ensure Prisma client is generated before tests run
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const prismaClientPath = join(
  process.cwd(),
  'node_modules',
  '.prisma',
  'client'
);

try {
  if (!existsSync(prismaClientPath)) {
    execSync('npx prisma generate', { stdio: 'inherit' });
  }
} catch (error) {
  // Silently handle Prisma client generation errors in test setup
}

