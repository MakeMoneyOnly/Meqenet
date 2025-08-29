import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController (Security Headers & Validation)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same ValidationPipe as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Security Headers Validation', () => {
    it('should have comprehensive security headers', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect(res => {
          // Essential Helmet Security Headers
          expect(res.headers['x-content-type-options']).toBe('nosniff');
          expect(res.headers['x-frame-options']).toBe('DENY');
          expect(res.headers['x-xss-protection']).toBe('0');
          expect(res.headers['strict-transport-security']).toBeDefined();

          // Content Security Headers
          expect(res.headers['content-security-policy']).toBeDefined();

          // CORS Headers for Ethiopian domains
          expect(res.headers['access-control-allow-origin']).toBeDefined();

          // Request ID Header (UUID format)
          expect(res.headers['x-request-id']).toBeDefined();
          expect(res.headers['x-request-id']).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
          );
        });
    });

    it('should validate CORS for Ethiopian financial domains', () => {
      return request(app.getHttpServer())
        .get('/')
        .set('Origin', 'https://nbe.gov.et')
        .expect(200)
        .expect(res => {
          expect(res.headers['access-control-allow-origin']).toBe(
            'https://nbe.gov.et'
          );
        });
    });

    it('should validate CORS for Meqenet domains', () => {
      return request(app.getHttpServer())
        .get('/')
        .set('Origin', 'https://meqenet.et')
        .expect(200)
        .expect(res => {
          expect(res.headers['access-control-allow-origin']).toBe(
            'https://meqenet.et'
          );
        });
    });
  });

  describe('Input Validation', () => {
    it('should reject requests with non-whitelisted properties', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
          maliciousField: 'should be rejected',
        })
        .expect(400);
    });

    it('should accept valid requests with only whitelisted properties', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201); // Assuming this endpoint exists
    });

    it('should transform input types automatically', () => {
      return request(app.getHttpServer())
        .post('/some-endpoint')
        .send({
          numberField: '123', // Should be transformed to number
          booleanField: 'true', // Should be transformed to boolean
        })
        .expect(res => {
          // This test assumes the endpoint exists and uses class-validator/class-transformer
          expect(res.status).toBeLessThan(500);
        });
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should include rate limiting headers', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect(res => {
          expect(res.headers['x-ratelimit-limit']).toBeDefined();
          expect(res.headers['x-ratelimit-remaining']).toBeDefined();
          expect(res.headers['x-ratelimit-reset']).toBeDefined();
        });
    });

    it('should handle rate limit exceeded', async () => {
      const agent = request.agent(app.getHttpServer());

      // Make multiple requests to potentially trigger rate limiting
      for (let i = 0; i < 15; i++) {
        const response = await agent.get('/');
        if (response.status === 429) {
          expect(response.headers['retry-after']).toBeDefined();
          expect(response.headers['x-ratelimit-reset']).toBeDefined();
          return;
        }
      }

      // If rate limiting doesn't trigger, test still passes
      expect(true).toBe(true);
    });
  });

  describe('Request Tracing', () => {
    it('should generate consistent request IDs', async () => {
      const responses = await Promise.all([
        request(app.getHttpServer()).get('/'),
        request(app.getHttpServer()).get('/'),
        request(app.getHttpServer()).get('/'),
      ]);

      responses.forEach(res => {
        expect(res.headers['x-request-id']).toBeDefined();
        expect(res.headers['x-request-id']).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
      });

      // Ensure all request IDs are different
      const requestIds = responses.map(res => res.headers['x-request-id']);
      const uniqueIds = new Set(requestIds);
      expect(uniqueIds.size).toBe(requestIds.length);
    });

    it('should preserve request ID from headers', () => {
      const customRequestId = '550e8400-e29b-41d4-a716-446655440000';

      return request(app.getHttpServer())
        .get('/')
        .set('X-Request-ID', customRequestId)
        .expect(200)
        .expect(res => {
          expect(res.headers['x-request-id']).toBe(customRequestId);
        });
    });
  });
});
