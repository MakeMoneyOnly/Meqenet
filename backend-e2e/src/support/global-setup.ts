/* eslint-disable */
import { exec } from 'child_process';

module.exports = async function () {
  // Start services that the app needs to run (e.g. database, docker-compose, etc.).
  console.log('\nSetting up E2E test environment...\n');
  console.log('⏳ Waiting for services to be ready...\n');

  // Wait for API Gateway to be healthy
  const waitForService = (url: string, serviceName: string): Promise<void> => {
    return new Promise(resolve => {
      const checkService = () => {
        exec(`curl -f ${url}`, error => {
          if (error) {
            console.log(`⏳ Waiting for ${serviceName}...`);
            setTimeout(checkService, 2000);
          } else {
            console.log(`✅ ${serviceName} is ready!`);
            resolve();
          }
        });
      };
      checkService();
    });
  };

  try {
    // Wait for all services to be healthy
    await Promise.all([
      waitForService('http://localhost:3000/healthz', 'API Gateway'),
      waitForService('http://localhost:3001/healthz', 'Auth Service'),
      waitForService('http://localhost:3004/health', 'Payments Service'),
    ]);

    console.log('\n🎉 All services are ready for E2E testing!\n');
  } catch (error) {
    console.error('❌ Failed to start services:', error);
    throw error;
  }

  (globalThis as any).__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
