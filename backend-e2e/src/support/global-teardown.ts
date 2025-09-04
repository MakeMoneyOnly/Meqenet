import kill from 'kill-port';
/* eslint-disable */

// Type declaration for global teardown message
declare global {
  var __TEARDOWN_MESSAGE__: string | undefined;
  var __API_GATEWAY_PROCESS__: any;
}

module.exports = async function () {
  // Put clean up logic here (e.g. stopping services, docker-compose, etc.).
  // Hint: `globalThis` is shared between setup and teardown.

  // Stop the API Gateway process if it exists
  if (globalThis.__API_GATEWAY_PROCESS__) {
    console.log('Stopping API Gateway...');
    globalThis.__API_GATEWAY_PROCESS__.kill('SIGTERM');

    // Wait for the process to exit
    await new Promise((resolve) => {
      globalThis.__API_GATEWAY_PROCESS__.on('exit', () => {
        console.log('✅ API Gateway stopped');
        resolve(void 0);
      });

      // Fallback timeout
      setTimeout(() => {
        console.log('⚠️  API Gateway did not exit gracefully, force killing...');
        globalThis.__API_GATEWAY_PROCESS__.kill('SIGKILL');
        resolve(void 0);
      }, 5000);
    });
  }

  // Also try to kill any remaining processes on port 3000
  try {
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    await (kill as any)(port);
  } catch (error) {
    // Ignore errors if port is already free
  }

  // Safe access to global teardown message
  if (globalThis.__TEARDOWN_MESSAGE__) {
    console.log(globalThis.__TEARDOWN_MESSAGE__);
  }
};
