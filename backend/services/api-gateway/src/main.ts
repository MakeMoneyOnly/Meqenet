import { NestFactory } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app/app.module';

// Default port for API Gateway service
const DEFAULT_PORT = 3000;
// Default auth service URL for local development
const DEFAULT_AUTH_SERVICE_URL = 'http://localhost:3001';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? DEFAULT_AUTH_SERVICE_URL;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(
    '/api/auth',
    createProxyMiddleware({
      target: AUTH_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api/auth': '/', // rewrite path
      },
    }),
  );

  const port = process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API Gateway listening on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Proxying /api/auth to ${AUTH_SERVICE_URL}`);
}

bootstrap();
