import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Authentication Module
 * Enterprise FinTech compliant authentication system
 * Implements JWT-based authentication with security best practices
 */
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
          issuer: 'payments-service',
          audience: 'meqenet-platform',
        },
        verifyOptions: {
          issuer: 'payments-service',
          audience: 'meqenet-platform',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
