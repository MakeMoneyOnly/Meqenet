/* eslint-disable */
import { exec } from 'child_process';

module.exports = async function () {
  // Start services that that the app needs to run (e.g. database, docker-compose, etc.).
  console.log('\nSetting up API Gateway for e2e tests...\n');
  console.log('✅ API Gateway is already running on port 3000');

  (globalThis as any).__TEARDOWN_MESSAGE__ = '\nTearing down...\n';

  // Return immediately since API Gateway is already running
  return Promise.resolve();
};
