/**
 * NestJS Test Setup for Vitest
 *
 * This file ensures proper NestJS functionality by importing reflect-metadata
 * which is required for dependency injection to work.
 */

// Critical: Import reflect-metadata first for NestJS dependency injection
import 'reflect-metadata';

// Configure test environment variables
// NODE_ENV is already handled by the config schema with defaults
// No direct process.env access needed

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
} catch (_error) {
  // Silently handle Prisma client generation errors in test setup
}
