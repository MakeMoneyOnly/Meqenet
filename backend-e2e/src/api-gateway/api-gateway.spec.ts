import axios from 'axios';

describe('Gateway E2E', () => {
  describe('GET /api/auth', () => {
    it('should proxy to auth-service and return its name', async () => {
      const res = await axios.get('/api/auth');
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ name: 'auth-service' });
    });
  });

  describe('GET /healthz', () => {
    it('should return the gateway health status', async () => {
      const res = await axios.get('/healthz');
      expect(res.status).toBe(200);
      expect(res.data.status).toEqual('ok');
    });
  });
});
