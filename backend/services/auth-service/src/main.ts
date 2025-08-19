import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app/app.module';
import { initializeOpenTelemetry } from './shared/observability/otel';

const DEFAULT_PORT = 3001;
const DEFAULT_GRPC_URL = 'localhost:5000';

/**
 * Bootstrap function for the Authentication Service
 * Implements security best practices for Ethiopian FinTech compliance
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
    });

    const configService = app.get(ConfigService);
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

    // Initialize OpenTelemetry with centralized config (non-blocking). Fulfills APM instrumentation requirement.
    initializeOpenTelemetry({
      nodeEnv: configService.get<string>('NODE_ENV'),
      jaegerEndpoint: configService.get<string>(
        'OTEL_EXPORTER_JAEGER_ENDPOINT'
      ),
      serviceName: configService.get<string>('OTEL_SERVICE_NAME'),
    });

    // Security middleware
    app.use(helmet());
    app.use(compression());

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

    app.enableCors({
      origin: [
        'https://nbe.gov.et',
        'https://cbe.com.et',
        'https://meqenet.et',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Request-ID',
      ],
    });

    if (configService.get<string>('NODE_ENV') !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Meqenet Auth Service API')
        .setDescription('Authentication service for Ethiopian FinTech platform')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
    }

    const grpcUrl = configService.get<string>('GRPC_URL') ?? DEFAULT_GRPC_URL;

    // Connect the gRPC microservice
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.GRPC,
      options: {
        package: 'auth.v1',
        protoPath: '../../../proto/registry/auth/v1/auth.proto',
        url: grpcUrl,
      },
    });

    await app.startAllMicroservices();
    const port = configService.get<number>('PORT') ?? DEFAULT_PORT;
    await app.listen(port);

    logger.log(`🚀 Auth Service is running on: http://localhost:${port}`);
    logger.log(`📡 gRPC server is running on: ${grpcUrl}`);

    if (configService.get<string>('NODE_ENV') !== 'production') {
      logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
      logger.log(`📘 OpenAPI JSON: http://localhost:${port}/api/docs-json`);
    }
  } catch (error) {
    logger.error('💥 Failed to start Auth Service:', error);
    process.exit(1);
  }
}

bootstrap();
