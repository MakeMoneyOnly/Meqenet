/**
 * Test Setup for Meqenet.et Authentication Service Integration Tests
 *
 * Configures test environment for database integration testing:
 * - Test database connection setup
 * - Ethiopian timezone configuration
 * - Security settings for testing
 * - Cleanup procedures
 *
 * @author QA Specialist
 */

// Test configuration constants
const TEST_CONFIG = {
  TIMEOUT_MS: 30000, // 30 seconds for Ethiopian networks
  DATABASE_URL:
    'postgresql://test_user:test_password@localhost:5433/meqenet_auth_test?sslmode=require',
} as const;

// Set test environment variables before imports
process.env.NODE_ENV = 'test';
process.env.TZ = 'Africa/Addis_Ababa';

// Test database configuration
process.env.TEST_DATABASE_URL ??= TEST_CONFIG.DATABASE_URL;

// Test security configurations
process.env.JWT_SECRET =
  'test-jwt-secret-for-integration-tests-only-not-for-production';
process.env.JWT_REFRESH_SECRET =
  'test-refresh-secret-for-integration-tests-only';
process.env.SESSION_SECRET = 'test-session-secret-for-integration-tests-only';
process.env.FAYDA_ID_ENCRYPTION_KEY =
  'test-fayda-encryption-key-for-tests-only-64-chars-minimum-required';

// Test audit and compliance settings
process.env.AUDIT_LOG_ENABLED = 'true';
process.env.NBE_COMPLIANCE = 'true';
process.env.DB_AUDIT_LOGGING = 'true';

// Disable external services for testing
process.env.HSM_ENABLED = 'false';
process.env.MFA_ENABLED = 'false';
process.env.RISK_ASSESSMENT_ENABLED = 'false';

// Test timeout configuration for Ethiopian network conditions
 
(global as any).jest?.setTimeout?.(TEST_CONFIG.TIMEOUT_MS);

// Global test setup
 
(global as any).beforeAll?.(async () => {
  // eslint-disable-next-line no-console
  console.log(
    '🧪 Setting up Meqenet.et authentication service integration tests...'
  );
  // eslint-disable-next-line no-console
  console.log(`📅 Ethiopian timezone: ${process.env.TZ}`);
  // eslint-disable-next-line no-console
  console.log(
    `🗄️  Test database: ${process.env.TEST_DATABASE_URL?.split('@')[1]?.split('?')[0]}`
  );
});

// Global test teardown
 
(global as any).afterAll?.(async () => {
  // eslint-disable-next-line no-console
  console.log('🧹 Cleaning up integration test environment...');
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests, just log the error
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', error => {
  // eslint-disable-next-line no-console
  console.error('Uncaught Exception:', error);
  // Don't exit the process in tests, just log the error
});
