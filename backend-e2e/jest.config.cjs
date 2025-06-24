/* eslint-disable */
/** Jest configuration for backend e2e tests */
module.exports = {
  displayName: 'backend-e2e',
  preset: '../jest.preset.ts',
  globalSetup: '<rootDir>/src/support/global-setup.cjs',
  globalTeardown: '<rootDir>/src/support/global-teardown.cjs',
  setupFiles: ['<rootDir>/src/support/test-setup.ts'],
  testEnvironment: 'node',
  coverageDirectory: '../coverage/backend-e2e',
}; 