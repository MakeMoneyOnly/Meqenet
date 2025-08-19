import { ConfigService } from '@nestjs/config';
import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig = {
  useFactory: (configService: ConfigService): WinstonModuleOptions => {
    const logLevel = configService.get<string>('LOG_LEVEL') ?? 'info';
    const nodeEnv = configService.get<string>('NODE_ENV');

    return {
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        ...(nodeEnv === 'production'
          ? [
              new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
              }),
              new winston.transports.File({ filename: 'logs/combined.log' }),
            ]
          : []),
      ],
    };
  },
  inject: [ConfigService],
};
