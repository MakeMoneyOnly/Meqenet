import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../shared/prisma/prisma.module';
import { EventService } from '../../shared/services/event.service';
import { SecretManagerService } from '../../shared/services/secret-manager.service';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (
        _configService: ConfigService,
        secretManager: SecretManagerService
      ) => {
        const privateKey = secretManager.getCurrentJwtPrivateKey();
        const kid = secretManager.getCurrentJwtKeyId();

        if (!privateKey || !kid) {
          throw new Error('JWT private key or kid is not initialized');
        }

        return {
          privateKey,
          signOptions: {
            algorithm: 'RS256',
            header: { kid },
            expiresIn: '1h',
          },
        } as unknown as Record<string, unknown>;
      },
      inject: [ConfigService, SecretManagerService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EventService, SecretManagerService],
  exports: [AuthService],
})
export class AuthModule {}
