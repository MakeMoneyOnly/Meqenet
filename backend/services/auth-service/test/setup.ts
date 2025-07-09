/**
 * NestJS Test Setup for Vitest
 *
 * This file ensures proper NestJS functionality by importing reflect-metadata
 * which is required for dependency injection to work.
 */

// Critical: Import reflect-metadata first for NestJS dependency injection
import 'reflect-metadata';

// Configure test environment
process.env.NODE_ENV = 'test';

// Configure test-specific environment variables
process.env.FAYDA_ENCRYPTION_KEY = 'test-encryption-key-32-characters-long-key';
process.env.FAYDA_HASH_SALT = 'test-hash-salt-for-fayda-id-hashing-32-chars';
