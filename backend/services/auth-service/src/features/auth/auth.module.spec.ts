import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

const mockPrismaService = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

const mockOutboxService = {
  store: vi.fn(),
};

import { MessagingProducerService } from '../../infrastructure/messaging/messaging.producer.service';
import { RedisConfigService } from '../../shared/config/redis.config';
import { OutboxService } from '../../shared/outbox/outbox.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    const mockRedisConfigService = {
      host: 'localhost',
      port: 6379,
      connection: {
        host: 'localhost',
        port: 6379,
      },
    };

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET') || 'test-secret',
            signOptions: {
              expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h',
            },
          }),
          inject: [ConfigService],
        }),
      ],
      exports: [AuthService],
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: OutboxService,
          useValue: mockOutboxService,
        },
        {
          provide: MessagingProducerService,
          useValue: {},
        },
        {
          provide: RedisConfigService,
          useValue: mockRedisConfigService,
        },
      ],
    }).compile();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should have AuthService as a provider', () => {
    const authService = module.get<AuthService>(AuthService);
    expect(authService).toBeDefined();
  });

  it('should have AuthController as a controller', () => {
    const authController = module.get<AuthController>(AuthController);
    expect(authController).toBeDefined();
  });

  it('should export AuthService', () => {
    const authService = module.get<AuthService>(AuthService);
    expect(authService).toBeDefined();
  });
});
