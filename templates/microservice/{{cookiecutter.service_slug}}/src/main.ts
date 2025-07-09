import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
      ],
      credentials: true,
    },
  });

  const configService = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // Log service startup information
  logger.log(`Starting {{cookiecutter.service_name}} in ${configService.get('NODE_ENV', 'development')} mode`, 'Bootstrap');

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          // Ethiopian payment provider domains for secure API calls
          connectSrc: [
            "'self'",
            'https://api.telebirr.et',
            'https://api.mpesa.et',
            'https://api.cbebirr.et',
            'https://api.hellocash.et',
            'https://api.arifpay.et',
            'https://api.santimpay.et',
            'https://api.chapa.co',
            'https://api.fayda.gov.et',
            'https://report.nbe.gov.et',
          ],
          // NBE compliance reporting endpoints
          formAction: ["'self'", 'https://report.nbe.gov.et'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      // Ethiopian regulatory compliance
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // Additional security for financial services
      crossOriginEmbedderPolicy: { policy: 'require-corp' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(compression());

  // Global pipes
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

  // Global filters and interceptors can be added here when implemented

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // Metrics can be setup here when implemented

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('{{cookiecutter.service_name}} API')
      .setDescription('{{cookiecutter.service_description}}')
      .setVersion('{{cookiecutter.version}}')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'jwt-auth'
      )
      .addTag('{{cookiecutter.service_slug}}')
      .setContact(
        'Meqenet Development Team',
        'https://meqenet.et',
        '{{cookiecutter.author_email}}'
      )
      .setLicense('UNLICENSED', '')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // Graceful shutdown
  const gracefulShutdown = () => {
    logger.log('Starting graceful shutdown...', 'Bootstrap');
    app.close().then(() => {
      logger.log('Application closed successfully', 'Bootstrap');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  const port = configService.get(
    'PORT',
    parseInt('{{cookiecutter.service_port}}', 10)
  );
  const host = configService.get('HOST', '0.0.0.0');

  await app.listen(port, host);

  logger.log(
    `🚀 {{cookiecutter.service_name}} is running on: http://${host}:${port}`,
    'Bootstrap'
  );
  logger.log(
    `📚 API Documentation: http://${host}:${port}/api/docs`,
    'Bootstrap'
  );
  logger.log(`📊 Health Check: http://${host}:${port}/health`, 'Bootstrap');
  logger.log(`📈 Metrics: http://${host}:${port}/metrics`, 'Bootstrap');
}

bootstrap().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
