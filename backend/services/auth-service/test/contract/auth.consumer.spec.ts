import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { describe, it } from 'vitest';
import axios from 'axios';

const { like, eachLike } = MatchersV3;

describe('Auth Service Consumer Contract', () => {
  const provider = new PactV3({
    consumer: 'api-gateway',
    provider: 'auth-service',
    port: 3001,
    host: 'localhost',
    dir: './pacts',
    logLevel: 'info',
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      // Arrange
      const userRegistrationRequest = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const expectedResponse = {
        accessToken: like('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
      };

      await provider.addInteraction({
        states: [{ description: 'User does not exist' }],
        uponReceiving: 'A request to register a new user',
        withRequest: {
          method: 'POST',
          path: '/auth/register',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: userRegistrationRequest,
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      });

      await provider.executeTest(async (mockserver) => {
        const response = await axios.post(
          `${mockserver.url}/auth/register`,
          userRegistrationRequest,
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        );

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('accessToken');
        expect(typeof response.data.accessToken).toBe('string');
      });
    });

    it('should return conflict when user already exists', async () => {
      const userRegistrationRequest = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
      };

      await provider.addInteraction({
        states: [{ description: 'User already exists' }],
        uponReceiving: 'A request to register an existing user',
        withRequest: {
          method: 'POST',
          path: '/auth/register',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: userRegistrationRequest,
        },
        willRespondWith: {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            statusCode: 409,
            message: 'User with this email already exists',
            error: 'Conflict',
          },
        },
      });

      await provider.executeTest(async (mockserver) => {
        try {
          await axios.post(
            `${mockserver.url}/auth/register`,
            userRegistrationRequest,
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            }
          );
          fail('Expected request to fail with 409');
        } catch (error: any) {
          expect(error.response.status).toBe(409);
          expect(error.response.data.message).toBe('User with this email already exists');
        }
      });
    });
  });

  describe('POST /auth/login', () => {
    it('should authenticate user with valid credentials', async () => {
      const loginRequest = {
        email: 'user@example.com',
        password: 'ValidPass123!',
      };

      const expectedResponse = {
        accessToken: like('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
      };

      await provider.addInteraction({
        states: [{ description: 'User exists and credentials are valid' }],
        uponReceiving: 'A valid login request',
        withRequest: {
          method: 'POST',
          path: '/auth/login',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: loginRequest,
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      });

      await provider.executeTest(async (mockserver) => {
        const response = await axios.post(
          `${mockserver.url}/auth/login`,
          loginRequest,
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        );

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('accessToken');
        expect(typeof response.data.accessToken).toBe('string');
      });
    });

    it('should return unauthorized for invalid credentials', async () => {
      const loginRequest = {
        email: 'user@example.com',
        password: 'InvalidPass123!',
      };

      await provider.addInteraction({
        states: [{ description: 'User exists but credentials are invalid' }],
        uponReceiving: 'A login request with invalid credentials',
        withRequest: {
          method: 'POST',
          path: '/auth/login',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: loginRequest,
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            statusCode: 401,
            message: 'Invalid credentials',
            error: 'Unauthorized',
          },
        },
      });

      await provider.executeTest(async (mockserver) => {
        try {
          await axios.post(
            `${mockserver.url}/auth/login`,
            loginRequest,
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            }
          );
          fail('Expected request to fail with 401');
        } catch (error: any) {
          expect(error.response.status).toBe(401);
          expect(error.response.data.message).toBe('Invalid credentials');
        }
      });
    });
  });
});
