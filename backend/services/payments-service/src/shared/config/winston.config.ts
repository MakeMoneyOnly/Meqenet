import { WinstonModuleAsyncOptions } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

/**
 * Winston Configuration Factory
 * Enterprise FinTech compliant logging configuration
 * Supports structured logging with security considerations
 */
export const winstonConfig: WinstonModuleAsyncOptions = {
  useFactory: () => {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const logDir = process.env.LOG_DIR || './logs';

    const customFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(
        ({ timestamp, level, message, context, stack, ...meta }) => {
          // Sanitize sensitive data from logs
          const sanitizedMeta = sanitizeLogData(meta);

          return JSON.stringify({
            timestamp,
            level,
            message,
            context: context || 'Application',
            stack,
            ...sanitizedMeta,
          });
        }
      )
    );

    return {
      level: logLevel,
      format: customFormat,
      defaultMeta: { service: 'payments-service' },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),

        // Daily rotate file for general logs
        new winston.transports.DailyRotateFile({
          filename: `${logDir}/payments-service-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: customFormat,
        }),

        // Separate file for errors
        new winston.transports.DailyRotateFile({
          filename: `${logDir}/payments-service-error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          format: customFormat,
        }),

        // Security events log (PCI DSS compliance)
        new winston.transports.DailyRotateFile({
          filename: `${logDir}/payments-service-security-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: 'warn',
          maxSize: '20m',
          maxFiles: '90d', // 90 days retention for security logs
          format: customFormat,
        }),
      ],
    };
  },
  inject: [],
};

/**
 * Sanitize sensitive data from log entries
 * Enterprise FinTech requirement: Prevent sensitive data leakage
 */
function sanitizeLogData(meta: any): any {
  if (!meta || typeof meta !== 'object') {
    return meta;
  }

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'key',
    'api_key',
    'credit_card',
    'cvv',
    'ssn',
    'social_security',
    'bank_account',
    'routing_number',
  ];

  const sanitized = { ...meta };

  // Recursively sanitize object properties
  const sanitizeObject = (obj: any): any => {
    if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        if (
          sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
        ) {
          obj[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          obj[key] = sanitizeObject(value);
        }
      }
    }
    return obj;
  };

  return sanitizeObject(sanitized);
}
