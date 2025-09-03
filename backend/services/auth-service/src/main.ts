import { Logger, ValidationPipe, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { PinoLogger } from 'nestjs-pino';
import { context as otContext, trace as otTrace, ROOT_CONTEXT, Span, SpanKind } from '@opentelemetry/api';
import { randomUUID } from 'crypto';

import { AppModule } from './app/app.module';
import { initializeOpenTelemetry } from './shared/observability/otel';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { LatencyMetricsInterceptor } from './shared/interceptors/latency-metrics.interceptor';

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
    app.useLogger(app.get(PinoLogger));

    // Initialize OpenTelemetry with centralized config (non-blocking). Fulfills APM instrumentation requirement.
    const otelConfig: Record<string, string> = {
      nodeEnv: configService.get<string>('NODE_ENV') || 'development',
      serviceName:
        configService.get<string>('OTEL_SERVICE_NAME') || 'auth-service',
    };

    const jaegerEndpoint = configService.get<string>(
      'OTEL_EXPORTER_JAEGER_ENDPOINT'
    );
    if (jaegerEndpoint) {
      otelConfig.jaegerEndpoint = jaegerEndpoint;
    }

    initializeOpenTelemetry(otelConfig);

    // Request ID middleware and OTel correlation
    app.use((req, res, next) => {
      const incoming = req.headers['x-request-id'] as string | undefined;
      const requestId = incoming || randomUUID();
      res.setHeader('X-Request-ID', requestId);
      // Create a span context scope if none
      const tracer = otTrace.getTracer('meqenet-auth');
      const span: Span = tracer.startSpan('http.request', { kind: SpanKind.SERVER });
      const ctx = otTrace.setSpan(otContext.active() || ROOT_CONTEXT, span);
      // Attach requestId on response finish and end span
      res.on('finish', () => {
        span.setAttribute('http.request_id', requestId);
        span.setAttribute('http.status_code', res.statusCode);
        span.end();
      });
      otContext.with(ctx, next);
    });

    // Express hardening
    const http = app.getHttpAdapter().getInstance();
    http.disable('x-powered-by');

    // Security middleware - central Helmet configuration
    app.use(
      helmet({
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false,
        },
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
          },
        },
        referrerPolicy: { policy: 'no-referrer' },
        crossOriginEmbedderPolicy: false,
      })
    );
    app.use(compression());

    // Global class-validator ValidationPipe with bilingual errors
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        exceptionFactory: validationErrors => {
          const messages = validationErrors.map(err => {
            const constraints = err.constraints || {};
            const firstMessage = Object.values(constraints)[0] as string | undefined;
            if (firstMessage) {
              try {
                const parsed = JSON.parse(firstMessage) as { en?: string; am?: string };
                return {
                  en: parsed.en || 'Validation failed',
                  am: parsed.am || 'ማረጋገጥ አልተሳካም።',
                };
              } catch {
                return {
                  en: firstMessage,
                  am: 'የማረጋገጫ ስህተት ተፈጥሯል።',
                };
              }
            }
            return {
              en: 'Validation failed',
              am: 'ማረጋገጥ አልተሳካም።',
            };
          });
          return new BadRequestException({ message: messages });
        },
      })
    );

    // Global exception filter for bilingual error responses (NBE compliance)
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Global latency metrics interceptor
    app.useGlobalInterceptors(new LatencyMetricsInterceptor());

    // Centralized CORS configuration
    const corsOriginsEnv =
      configService.get<string>('CORS_ORIGINS') ||
      'https://nbe.gov.et,https://cbe.com.et,https://meqenet.et';
    const allowedOrigins = corsOriginsEnv
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);

    app.enableCors({
      origin: (origin, callback) => {
        // Allow no origin (e.g., curl) and explicit allowlist
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('CORS blocked'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Accept-Language', // Bilingual support
        'X-Request-ID',
      ],
      exposedHeaders: ['X-Request-ID'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    // Add Vary: Origin for CORS cache correctness
    app.use((req, res, next) => {
      res.vary('Origin');
      next();
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
