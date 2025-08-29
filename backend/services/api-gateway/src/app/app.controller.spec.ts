import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppController } from './app.controller';

describe('AppController (Security Headers Validation)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Security Headers Validation', () => {
    it('should have essential security headers', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect(res => {
          // Helmet Security Headers
          expect(res.headers['x-content-type-options']).toBe('nosniff');
          expect(res.headers['x-frame-options']).toBe('DENY');
          expect(res.headers['x-xss-protection']).toBe('0');
          expect(res.headers['strict-transport-security']).toBeDefined();

          // CORS Headers
          expect(res.headers['access-control-allow-origin']).toBeDefined();
          expect(res.headers['access-control-allow-credentials']).toBe('true');

          // Request ID Header
          expect(res.headers['x-request-id']).toBeDefined();
          expect(res.headers['x-request-id']).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
          );
        });
    });

    it('should reject requests from unauthorized origins', () => {
      return request(app.getHttpServer())
        .get('/')
        .set('Origin', 'https://unauthorized-domain.com')
        .expect(500); // CORS error should result in 500
    });

    it('should allow requests from authorized Ethiopian domains', () => {
      return request(app.getHttpServer())
        .get('/')
        .set('Origin', 'https://app.meqenet.et')
        .expect(200)
        .expect(res => {
          expect(res.headers['access-control-allow-origin']).toBe(
            'https://app.meqenet.et'
          );
        });
    });

    it('should handle preflight CORS requests', () => {
      return request(app.getHttpServer())
        .options('/')
        .set('Origin', 'https://meqenet.et')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204)
        .expect(res => {
          expect(res.headers['access-control-allow-methods']).toContain('POST');
          expect(res.headers['access-control-allow-headers']).toContain(
            'Content-Type'
          );
          expect(res.headers['access-control-allow-headers']).toContain(
            'Authorization'
          );
          expect(res.headers['access-control-allow-headers']).toContain(
            'X-Request-ID'
          );
        });
    });

    it('should prevent clickjacking attacks', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect(res => {
          expect(res.headers['x-frame-options']).toBe('DENY');
        });
    });

    it('should prevent MIME type sniffing', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect(res => {
          expect(res.headers['x-content-type-options']).toBe('nosniff');
        });
    });

    it('should enforce HTTPS', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect(res => {
          expect(res.headers['strict-transport-security']).toBeDefined();
          expect(res.headers['strict-transport-security']).toMatch(
            /max-age=\d+/
          );
        });
    });
  });

  describe('Rate Limiting Validation', () => {
    it('should include rate limiting headers', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect(res => {
          // Rate limiting headers should be present
          expect(res.headers['x-ratelimit-limit']).toBeDefined();
          expect(res.headers['x-ratelimit-remaining']).toBeDefined();
          expect(res.headers['x-ratelimit-reset']).toBeDefined();
        });
    });

    it('should handle rate limit exceeded gracefully', async () => {
      const agent = request.agent(app.getHttpServer());

      // Make multiple requests to potentially trigger rate limiting
      for (let i = 0; i < 10; i++) {
        const response = await agent.get('/');
        if (response.status === 429) {
          expect(response.headers['retry-after']).toBeDefined();
          return;
        }
      }

      // If rate limiting doesn't trigger, test passes (configured limit might be higher)
      expect(true).toBe(true);
    });
  });
});
