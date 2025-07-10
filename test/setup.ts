import 'reflect-metadata';

// Global test setup for Meqenet.et fintech platform
// Note: Test environment initialized

// Mock environment variables for consistent testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/meqenet_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock Fayda ID encryption for testing
process.env.FAYDA_ENCRYPTION_KEY = 'test-fayda-encryption-key-32-chars';

// Global test utilities and mocks can be added here
