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
      inject: [ConfigService, SecretManagerService],
      useFactory: async (
        configService: ConfigService,
        secretManager: SecretManagerService
      ) => {
        // Configure JWT to use RSA keypair managed by AWS Secrets Manager
        const privateKey = secretManager.getCurrentJwtPrivateKey();
        const publicKey = secretManager.getCurrentJwtPublicKey();
        const kid = secretManager.getCurrentJwtKeyId();
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '15m';
        const issuer =
          configService.get<string>('JWT_ISSUER') || 'meqenet-auth';
        const audience =
          configService.get<string>('JWT_AUDIENCE') || 'meqenet-clients';

        if (!privateKey || !publicKey || !kid) {
          throw new Error('JWT keypair not initialized');
        }

        return {
          privateKey,
          publicKey,
          signOptions: {
            algorithm: 'RS256',
            expiresIn,
            issuer,
            audience,
            keyid: kid,
          },
          verifyOptions: {
            algorithms: ['RS256'],
            issuer,
            audience,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EventService, SecretManagerService],
  exports: [AuthService],
})
export class AuthModule {}
