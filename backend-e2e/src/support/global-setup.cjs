/* eslint-disable */
const http = require('http');

exports = module.exports = async function () {
  console.log('\nStarting mock API server on http://localhost:3000 ...');

  // Simple in-memory HTTP server that fulfils the /api contract expected by e2e spec
  const server = http.createServer((req, res) => {
    if (req.url === '/api') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Hello API' }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise((resolve) => server.listen(3000, resolve));

  // Expose server so global-teardown can close it
  globalThis.__TEST_API_SERVER__ = server;
}; 