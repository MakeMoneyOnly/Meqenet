import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { AppModule } from './app/app.module';

const DEFAULT_PORT = 3000;
const DEFAULT_TIMEOUT_MS = 5000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ): void => {
      if (!origin) return callback(null, true);
      try {
        let allowed: boolean = false;
        if (
          origin.startsWith('http://localhost') ||
          origin.startsWith('https://localhost')
        ) {
          allowed = true;
        } else {
          try {
            const url = new URL(origin);
            const host = url.hostname.toLowerCase();
            allowed =
              host.endsWith('meqenet.et') || host.endsWith('meqenet.com');
          } catch {
            allowed = false;
          }
        }
        return allowed
          ? callback(null, true)
          : callback(new Error('CORS blocked'));
      } catch {
        return callback(new Error('CORS error'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Request-ID'],
    credentials: true,
  });
  // Swagger for gateway (non-prod only)
  const nodeEnv = configService.get<string>('NODE_ENV');
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Meqenet API Gateway')
      .setDescription('Gateway routes and proxy contract')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, doc);
  }
  const authServiceUrl =
    configService.get<string>('app.authServiceUrl') ?? 'http://localhost:3001';

  app.use(
    '/api/auth',
    createProxyMiddleware({
      target: authServiceUrl,
      changeOrigin: true,
      proxyTimeout: DEFAULT_TIMEOUT_MS,
      timeout: DEFAULT_TIMEOUT_MS,
      pathRewrite: {
        '^/api/auth': '/', // rewrite path
      },
    })
  );

  const port = configService.get<number>('app.port') ?? DEFAULT_PORT;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`API Gateway listening on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Proxying /api/auth to ${authServiceUrl}`);
  if (nodeEnv !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`Gateway docs: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
