import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { PerformanceMiddleware } from './monitoring/middleware/performance.middleware';
import { PerformanceMonitoringService } from './monitoring/services/performance-monitoring.service';
import { RequestLoggingInterceptor } from './logging/interceptors/request-logging.interceptor';
import { ErrorLoggingInterceptor } from './logging/interceptors/error-logging.interceptor';
import { LoggingService } from './logging/services/logging.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Performance monitoring middleware
  if (configService.get<boolean>('ENABLE_PERFORMANCE_MONITORING', true)) {
    const performanceMonitoringService = app.get(PerformanceMonitoringService);
    app.use(new PerformanceMiddleware(performanceMonitoringService).use);
  }

  // Global interceptors
  const interceptors = [];

  // Add cache interceptor if enabled
  if (configService.get<boolean>('ENABLE_CACHE', true)) {
    const cacheManager = app.get('CACHE_MANAGER');
    const reflector = app.get('Reflector');
    interceptors.push(new CacheInterceptor(cacheManager, reflector));
  }

  // Add logging interceptors
  interceptors.push(
    new RequestLoggingInterceptor(),
    new ErrorLoggingInterceptor()
  );

  // Apply all interceptors
  app.useGlobalInterceptors(...interceptors);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix(apiPrefix);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Meqenet BNPL API')
    .setDescription('API documentation for Meqenet Buy Now Pay Later service - Ethiopian Market')
    .setVersion('1.0')
    .addTag('auth', 'Authentication and user verification endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('credit', 'Credit assessment and management endpoints')
    .addTag('payment-gateways', 'Payment gateway integration endpoints')
    .addTag('payment-webhooks', 'Payment gateway webhook endpoints')
    .addTag('transactions', 'Transaction management endpoints')
    .addTag('verification', 'Email and phone verification endpoints')
    .addTag('merchants', 'Merchant integration endpoints')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Enter JWT token',
      in: 'header',
    })
    .addApiKey({
      type: 'apiKey',
      name: 'x-api-key',
      in: 'header',
      description: 'API key for merchant integration',
    })
    .setContact('Meqenet Support', 'https://meqenet.et/support', 'support@meqenet.et')
    .setLicense('Proprietary', 'https://meqenet.et/terms')
    .setExternalDoc('Additional Documentation', 'https://meqenet.et/docs')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    operationIdFactory: (
      controllerKey: string,
      methodKey: string,
    ) => methodKey,
  });

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
    },
  });

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
}
bootstrap();