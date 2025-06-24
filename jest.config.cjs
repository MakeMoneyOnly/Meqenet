/** Root Jest configuration: restrict projects to maintained test suites */
module.exports = {
  // Run ONLY the child projects listed below; the aggregator itself has no tests.
  projects: [
    '<rootDir>/backend/services/auth-service',
    '<rootDir>/backend-e2e',
  ],
  // Disable test discovery at the repo root so stray specs aren't picked up.
  testMatch: [],
  testPathIgnorePatterns: ['.*'],
}; 