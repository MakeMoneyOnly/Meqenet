import kill from 'kill-port';
/* eslint-disable */

// Type declaration for global teardown message
declare global {
  var __TEARDOWN_MESSAGE__: string | undefined;
}

module.exports = async function () {
  // Put clean up logic here (e.g. stopping services, docker-compose, etc.).
  // Hint: `globalThis` is shared between setup and teardown.
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await (kill as any)(port);

  // Safe access to global teardown message
  if (globalThis.__TEARDOWN_MESSAGE__) {
    console.log(globalThis.__TEARDOWN_MESSAGE__);
  }
};
