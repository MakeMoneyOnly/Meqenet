import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { context, trace } from '@opentelemetry/api';

export const pinoConfig = {
  useFactory: (configService: ConfigService): Params => {
    const logLevel = configService.get<string>('LOG_LEVEL') ?? 'info';
    const nodeEnv = configService.get<string>('NODE_ENV');

    return {
      pinoHttp: {
        level: logLevel,
        // Do not log request/response bodies by default for PII safety
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers.set-cookie',
            'req.headers.x-api-key',
            'req.headers.x-auth-token',
          ],
          censor: '[REDACTED]',
        },
        formatters: {
          level: (label: string): { level: string } => {
            return { level: label };
          },
          log: (obj: Record<string, unknown>): Record<string, unknown> => {
            const span = trace.getSpan(context.active());
            const spanContext = span?.spanContext();
            return {
              ...obj,
              timestamp: new Date().toISOString(),
              correlationId:
                (obj as { correlationId?: string }).correlationId ?? 'unknown',
              traceId: spanContext?.traceId,
              spanId: spanContext?.spanId,
            };
          },
        },
        serializers: {
          req: (req: {
            method: string;
            url: string;
            headers: Record<string, string | string[] | undefined>;
          }) => ({
            method: req.method,
            url: req.url,
            headers: {
              'user-agent': req.headers['user-agent'],
              'x-request-id':
                req.headers['x-request-id'] ?? req.headers['X-Request-ID'],
              authorization: req.headers['authorization']
                ? '[REDACTED]'
                : undefined,
            },
          }),
          res: (res: {
            statusCode: number;
            headers?: Record<string, string | string[] | undefined>;
          }) => ({
            statusCode: res.statusCode,
            headers: {
              'x-request-id':
                res.headers?.['x-request-id'] ?? res.headers?.['X-Request-ID'],
            },
          }),
        },
        customProps: (
          req:
            | { headers?: Record<string, string | string[] | undefined> }
            | undefined,
          _res: unknown
        ): { correlationId: string; traceId?: string; spanId?: string } => {
          const span = trace.getSpan(context.active());
          const spanContext = span?.spanContext();
          const requestId = req?.headers?.['x-request-id'] as
            | string
            | undefined;
          return {
            correlationId: requestId ?? 'unknown',
            ...(spanContext?.traceId && { traceId: spanContext.traceId }),
            ...(spanContext?.spanId && { spanId: spanContext.spanId }),
          };
        },
        ...(nodeEnv === 'production'
          ? {
              transport: {
                targets: [
                  {
                    target: 'pino/file',
                    options: {
                      destination: 'logs/combined.log',
                    },
                    level: 'info',
                  },
                  {
                    target: 'pino/file',
                    options: {
                      destination: 'logs/error.log',
                    },
                    level: 'error',
                  },
                ],
              },
            }
          : {
              transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                  messageFormat:
                    '[{correlationId} {traceId}:{spanId}] {levelLabel} {msg}',
                },
              },
            }),
      },
    } as Params;
  },
  inject: [ConfigService],
};
