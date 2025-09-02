import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

// Constants for messaging configuration - FinTech compliance
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MAX_RETRIES = 3;
const HEARTBEAT_INTERVAL_SECONDS = 60;
const RECONNECT_TIME_SECONDS = 5;
const PAYMENT_EVENTS_TTL_HOURS = HOURS_PER_DAY; // 24 hours
const PAYMENT_COMMANDS_TTL_HOURS = 1; // 1 hour

/**
 * Messaging Module - Enterprise FinTech compliant message queue configuration
 * Uses RabbitMQ for reliable message delivery and event-driven architecture
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'PAYMENT_EVENTS',
        imports: [ConfigModule],
        useFactory: (
          configService: ConfigService
        ): Record<string, unknown> => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>(
                'RABBITMQ_URL',
                'amqp://localhost:5672'
              ),
            ],
            queue: 'payment_events',
            queueOptions: {
              durable: true, // Survive broker restarts
              arguments: {
                'x-max-retries': MAX_RETRIES,
                'x-message-ttl':
                  PAYMENT_EVENTS_TTL_HOURS *
                  MINUTES_PER_HOUR *
                  SECONDS_PER_MINUTE *
                  MILLISECONDS_PER_SECOND,
              },
            },
            socketOptions: {
              heartbeatIntervalInSeconds: HEARTBEAT_INTERVAL_SECONDS,
              reconnectTimeInSeconds: RECONNECT_TIME_SECONDS,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'PAYMENT_COMMANDS',
        imports: [ConfigModule],
        useFactory: (
          configService: ConfigService
        ): Record<string, unknown> => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>(
                'RABBITMQ_URL',
                'amqp://localhost:5672'
              ),
            ],
            queue: 'payment_commands',
            queueOptions: {
              durable: true,
              arguments: {
                'x-max-retries': MAX_RETRIES,
                'x-message-ttl':
                  PAYMENT_COMMANDS_TTL_HOURS *
                  MINUTES_PER_HOUR *
                  SECONDS_PER_MINUTE *
                  MILLISECONDS_PER_SECOND,
              },
            },
            socketOptions: {
              heartbeatIntervalInSeconds: HEARTBEAT_INTERVAL_SECONDS,
              reconnectTimeInSeconds: RECONNECT_TIME_SECONDS,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MessagingModule {}
