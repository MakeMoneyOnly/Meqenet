import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app/app.module';

const DEFAULT_PORT = 3000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.use(helmet());
  app.use(compression());
  // Global Validation Pipe for Ethiopian FinTech compliance
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages:
        configService.get<string>('NODE_ENV') === 'production',
    })
  );

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
  const port = configService.get<number>('app.port') ?? DEFAULT_PORT;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`API Gateway listening on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Auth proxy disabled for E2E testing - using mock endpoints`);
}

bootstrap();
