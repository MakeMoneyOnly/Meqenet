/* eslint-disable */

module.exports = async function () {
  // Start services that that the app needs to run (e.g. database, docker-compose, etc.).
  console.log('\nSetting up...\n');

  // Hint: Use `globalThis` to pass variables to global teardown.
  (globalThis as any).__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
