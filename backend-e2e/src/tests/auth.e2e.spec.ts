import request from 'supertest';

import { describe, it, expect } from 'vitest';

// This assumes the API Gateway is running on localhost:3000
const api = request('http://localhost:3000');

describe('Auth Service via API Gateway', () => {
  it('should register a new user', async () => {
    const response = await api.post('/auth/register').send({
      email: `testuser_${Date.now()}@meqenet.com`,
      password: 'password123',
    });
    expect(response.status).toBe(201);
  });

  it('should login an existing user', async () => {
    const email = `testuser_${Date.now()}@meqenet.com`;
    await api.post('/auth/register').send({
      email,
      password: 'password123',
    });

    const response = await api.post('/auth/login').send({
      email,
      password: 'password123',
    });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
  });
});
