import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
        useFactory: (configService: ConfigService) => ({
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
                'x-max-retries': 3,
                'x-message-ttl': 24 * 60 * 60 * 1000, // 24 hours TTL
              },
            },
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'PAYMENT_COMMANDS',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
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
                'x-max-retries': 3,
                'x-message-ttl': 60 * 60 * 1000, // 1 hour TTL for commands
              },
            },
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
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
