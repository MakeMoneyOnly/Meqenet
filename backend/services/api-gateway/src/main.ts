import { NestFactory } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app/app.module';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

async function bootstrap() {
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

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`API Gateway listening on http://localhost:${port}`);
  console.log(`Proxying /api/auth to ${AUTH_SERVICE_URL}`);
}

bootstrap();
