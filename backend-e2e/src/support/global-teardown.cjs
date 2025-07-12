/* eslint-disable */
exports = module.exports = async function () {
  if (globalThis.__TEST_API_SERVER__) {
    await new Promise(resolve => globalThis.__TEST_API_SERVER__.close(resolve));
  }
  console.log('\nMock API server stopped.\n');
};
