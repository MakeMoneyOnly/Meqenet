import request from 'supertest';
import { randomUUID } from 'node:crypto';

// This assumes the API Gateway is running on localhost:3000
const api = request('http://localhost:3000');

describe('Auth Service via API Gateway', () => {
  it('should register a new user', async () => {
    const response = await api
      .post('/auth/register')
      .send({
      email: `testuser_${Date.now()}@meqenet.com`,
      password: 'password123',
    });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'User registered successfully');
    expect(response.body).toHaveProperty('userId', 'test-user-123');
  });

  it('should login an existing user', async () => {
    const email = `testuser_${Date.now()}@meqenet.com`;

    // Register first
    await api
      .post('/auth/register')
      .send({
      email,
      password: 'password123',
    });

    // Then login
    const response = await api
      .post('/auth/login')
      .send({
      email,
      password: 'password123',
    });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken', 'mock-jwt-token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('id', 'test-user-123');
    expect(response.body.user).toHaveProperty('email', 'test@meqenet.com');
  });
});
