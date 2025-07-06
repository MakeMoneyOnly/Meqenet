import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { AppModule } from './app/app.module';

const DEFAULT_PORT = 3000;
const DEFAULT_AUTH_SERVICE_URL = 'http://localhost:3001';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const authServiceUrl =
    configService.get<string>('AUTH_SERVICE_URL') ?? DEFAULT_AUTH_SERVICE_URL;

  app.use(
    '/api/auth',
    createProxyMiddleware({
      target: authServiceUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/api/auth': '/', // rewrite path
      },
    })
  );

  const port = configService.get<number>('PORT') ?? DEFAULT_PORT;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`API Gateway listening on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Proxying /api/auth to ${authServiceUrl}`);
}

bootstrap();
