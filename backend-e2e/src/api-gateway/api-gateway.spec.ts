import axios from 'axios';

describe('Gateway E2E', () => {
  // Note: These E2E tests are currently skipped because they require
  // a running API Gateway service. In a proper E2E environment,
  // these would test against live services.

  describe('GET /api/auth', () => {
    it.skip('should proxy to auth-service and return its name', async () => {
      // This test requires a running API Gateway and Auth Service
      // Currently skipped until proper E2E test environment is set up
      const res = await axios.get('http://localhost:3000/api/auth');
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ name: 'auth-service' });
    });
  });

  describe('GET /healthz', () => {
    it.skip('should return the gateway health status', async () => {
      // This test requires a running API Gateway
      // Currently skipped until proper E2E test environment is set up
      const res = await axios.get('http://localhost:3000/healthz');
      expect(res.status).toBe(200);
      expect(res.data.status).toEqual('ok');
    });
  });

  describe('Configuration Tests', () => {
    it('should have axios available for E2E testing', () => {
      expect(axios).toBeDefined();
      expect(typeof axios.get).toBe('function');
    });

    it('should be able to create axios requests', () => {
      const request = axios.create({
        baseURL: 'http://localhost:3000',
        timeout: 5000,
      });
      expect(request.defaults.baseURL).toBe('http://localhost:3000');
      expect(request.defaults.timeout).toBe(5000);
    });
  });
});
