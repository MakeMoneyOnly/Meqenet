import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';

export const pinoConfig = {
  useFactory: (configService: ConfigService): Params => {
    const logLevel = configService.get<string>('LOG_LEVEL') ?? 'info';
    const nodeEnv = configService.get<string>('NODE_ENV');

    return {
      pinoHttp: {
        level: logLevel,
        formatters: {
          level: (label: string): { level: string } => {
            return { level: label };
          },
          log: (obj: Record<string, unknown>): Record<string, unknown> => {
            return {
              ...obj,
              timestamp: new Date().toISOString(),
              correlationId:
                (obj as { correlationId?: string }).correlationId ?? 'unknown',
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
          _req: unknown,
          _res: unknown
        ): { correlationId: string } => {
          return {
            correlationId: 'unknown',
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
                  messageFormat: '[{correlationId}] {levelLabel} {msg}',
                },
              },
            }),
      },
    };
  },
  inject: [ConfigService],
};
