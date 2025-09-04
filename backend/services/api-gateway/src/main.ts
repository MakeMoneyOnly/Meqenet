import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';

import { AppModule } from './app/app.module';

const DEFAULT_PORT = 3000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  // Remove global helmet middleware to allow controller-specific headers
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

  // Remove global CORS to allow controller-specific CORS handling

  const port = configService.get<number>('app.port') ?? DEFAULT_PORT;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`API Gateway listening on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Auth proxy disabled for E2E testing - using mock endpoints`);
}

bootstrap();
