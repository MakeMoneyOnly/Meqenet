import request from 'supertest';

/**
 * E2E tests for Authentication endpoints
 * Tests the complete authentication flow through the API Gateway
 */
describe('Authentication E2E Tests', () => {
  const apiUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';
  let app: any;

  beforeAll(async () => {
    // Setup test environment
    app = request(apiUrl);
  });

  it('should successfully register a new user', async () => {
    const response = await app.post('/api/v1/auth/register').send({
      email: 'test@example.com',
      password: 'SecurePassword123!',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
  });

  it('should successfully login with valid credentials', async () => {
    const response = await app.post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'SecurePassword123!',
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });
});
