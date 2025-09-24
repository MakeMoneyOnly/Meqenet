import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoggingService implements LoggerService {
  private logger: winston.Logger;
  private context: string = 'Application';
  private readonly logLevels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];
  private readonly enabledLogLevels: LogLevel[];
  private readonly enableDbLogging: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Get enabled log levels from config
    const configLogLevels = this.configService.get<string>('LOG_LEVELS', 'error,warn,log');
    this.enabledLogLevels = configLogLevels.split(',') as LogLevel[];

    // Get DB logging config
    this.enableDbLogging = this.configService.get<boolean>('ENABLE_DB_LOGGING', false);

    // Create Winston logger
    this.initializeLogger();
  }

  /**
   * Initialize Winston logger
   */
  private initializeLogger(): void {
    const logDir = this.configService.get<string>('LOG_DIR', 'logs');
    const logLevel = this.configService.get<string>('LOG_LEVEL', 'info');
    const maxFiles = this.configService.get<string>('LOG_MAX_FILES', '30d');

    // Create transports
    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            return `${timestamp} [${context || this.context}] ${level}: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            }`;
          }),
        ),
      }),

      // File transport for all logs
      new DailyRotateFile({
        dirname: logDir,
        filename: 'application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),

      // File transport for error logs
      new DailyRotateFile({
        dirname: logDir,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles,
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ];

    // Create logger
    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'meqenet-api' },
      transports,
    });
  }

  /**
   * Set the context for the logger
   * @param context Logger context
   * @returns This logger instance
   */
  setContext(context: string): this {
    this.context = context;
    return this;
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param trace Error trace
   * @param context Log context
   */
  error(message: any, trace?: string, context?: string): void {
    if (!this.isLevelEnabled('error')) return;

    const logContext = context || this.context;
    const logObject = {
      message,
      trace,
      context: logContext,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(message, { trace, context: logContext });

    // Log to database if enabled
    if (this.enableDbLogging) {
      this.logToDatabase('error', logObject);
    }
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @param context Log context
   */
  warn(message: any, context?: string): void {
    if (!this.isLevelEnabled('warn')) return;

    const logContext = context || this.context;
    const logObject = {
      message,
      context: logContext,
      timestamp: new Date().toISOString(),
    };

    this.logger.warn(message, { context: logContext });

    // Log to database if enabled
    if (this.enableDbLogging) {
      this.logToDatabase('warn', logObject);
    }
  }

  /**
   * Log an info message
   * @param message Message to log
   * @param context Log context
   */
  log(message: any, context?: string): void {
    if (!this.isLevelEnabled('log')) return;

    const logContext = context || this.context;
    const logObject = {
      message,
      context: logContext,
      timestamp: new Date().toISOString(),
    };

    this.logger.info(message, { context: logContext });

    // Log to database if enabled
    if (this.enableDbLogging) {
      this.logToDatabase('info', logObject);
    }
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @param context Log context
   */
  debug(message: any, context?: string): void {
    if (!this.isLevelEnabled('debug')) return;

    const logContext = context || this.context;
    this.logger.debug(message, { context: logContext });

    // We don't log debug messages to the database to avoid filling it up
  }

  /**
   * Log a verbose message
   * @param message Message to log
   * @param context Log context
   */
  verbose(message: any, context?: string): void {
    if (!this.isLevelEnabled('verbose')) return;

    const logContext = context || this.context;
    this.logger.verbose(message, { context: logContext });

    // We don't log verbose messages to the database to avoid filling it up
  }

  /**
   * Check if a log level is enabled
   * @param level Log level to check
   * @returns Whether the level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return this.enabledLogLevels.includes(level);
  }

  /**
   * Log a message to the database
   * @param level Log level
   * @param logObject Log object
   */
  private async logToDatabase(level: string, logObject: any): Promise<void> {
    try {
      // Convert message to string if it's not already
      const message = typeof logObject.message === 'object'
        ? JSON.stringify(logObject.message)
        : String(logObject.message);

      // Create log entry in database
      await this.prisma.systemLog.create({
        data: {
          level,
          message,
          context: logObject.context,
          trace: logObject.trace,
          timestamp: new Date(),
          metadata: logObject,
        },
      });
    } catch (error) {
      // Log to console if database logging fails
      console.error('Failed to log to database:', error);
    }
  }
}
