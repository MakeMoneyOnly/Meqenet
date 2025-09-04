import 'reflect-metadata';
import { vi } from 'vitest';

// Global test setup for Meqenet.et fintech platform
// Note: Test environment initialized

// Mock environment variables for consistent testing
process.env.NODE_ENV = 'test';
// Use a mock database URL for tests that don't need real DB connectivity
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://meqenet:password@localhost:5433/staging_auth_db';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.REDIS_URL = 'redis://localhost:6380';

// Mock Fayda ID encryption for testing
process.env.FAYDA_ENCRYPTION_KEY = 'test-fayda-encryption-key-32-chars';

// Suppress ALL logging during tests for clean output
process.env.LOG_LEVEL = 'silent';
process.env.LOGGER_LEVEL = 'silent';

// Suppress Pino logger (nestjs-pino) during tests
process.env.PINO_LOG_LEVEL = 'silent';
process.env.PINO_LEVEL = 'silent';

// Suppress NestJS built-in logging
process.env.NESTJS_LOGGER = 'false';

// Temporarily enable some output for debugging
console.log = vi.fn((...args) => {
  // Allow test results and errors through
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('✓') ||
      args[0].includes('✗') ||
      args[0].includes('Test Files') ||
      args[0].includes('Tests') ||
      args[0].includes('Duration') ||
      args[0].includes('Start at') ||
      args[0].includes('RUN') ||
      args[0].includes('Error') ||
      args[0].includes('FAIL') ||
      args[0].includes('PASS'))
  ) {
    originalStdoutWrite.apply(process.stdout, args);
  }
});

// Completely suppress console output during tests
const _originalConsole = { ...console };
console.log = vi.fn();
console.info = vi.fn();
console.warn = vi.fn();
console.debug = vi.fn();
console.trace = vi.fn();
console.error = vi.fn();

// Mock process.stdout.write and process.stderr.write to suppress all output
const originalStdoutWrite = process.stdout.write;
const originalStderrWrite = process.stderr.write;

process.stdout.write = vi.fn((...args) => {
  // Only allow vitest's own output through
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('✓') ||
      args[0].includes('✗') ||
      args[0].includes('Test Files') ||
      args[0].includes('Tests') ||
      args[0].includes('Duration') ||
      args[0].includes('Start at') ||
      args[0].includes('RUN'))
  ) {
    return originalStdoutWrite.apply(process.stdout, args);
  }
  return true;
});

process.stderr.write = vi.fn((...args) => {
  // Only allow actual test failures through
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('FAILED') ||
      (args[0].includes('Error:') &&
        !args[0].includes('[Nest]') &&
        !args[0].includes('Memory test error') &&
        !args[0].includes('DLQ message') &&
        !args[0].includes('Decryption failed') &&
        !args[0].includes('Encryption failed')))
  ) {
    return originalStderrWrite.apply(process.stderr, args);
  }
  return true;
});

// Global test utilities and mocks can be added here
