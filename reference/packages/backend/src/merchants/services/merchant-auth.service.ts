import { Injectable, UnauthorizedException, Logger, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MerchantsService } from './merchants.service';
import { MerchantStatus } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

interface MerchantJwtPayload {
  sub: string;
  email: string;
  name: string;
  jti?: string;        // JWT ID for token tracking/revocation
  iat?: number;        // Issued at timestamp
  exp?: number;        // Expiration timestamp
  device?: string;     // Hashed device fingerprint
}

@Injectable()
export class MerchantAuthService {
  private readonly logger = new Logger(MerchantAuthService.name);

  constructor(
    private readonly merchantsService: MerchantsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateApiKey(key: string, secret: string, ipAddress?: string) {
    try {
      // Rate limiting check (would be implemented with Redis in production)
      await this.checkRateLimit(key, ipAddress);

      // Validate API key
      const merchant = await this.merchantsService.validateApiKey(key, secret);

      if (!merchant) {
        // Log failed attempt for security monitoring
        this.logger.warn(`Failed API key validation attempt: ${key} from IP: ${ipAddress || 'unknown'}`);
        throw new UnauthorizedException('Invalid API credentials');
      }

      if (merchant.status !== MerchantStatus.ACTIVE) {
        this.logger.warn(`API key used for inactive merchant: ${merchant.id} from IP: ${ipAddress || 'unknown'}`);
        throw new UnauthorizedException('Merchant account is not active');
      }

      // Log successful authentication for audit trail
      this.logger.log(`Successful API authentication for merchant: ${merchant.id} from IP: ${ipAddress || 'unknown'}`);

      return merchant;
    } catch (error) {
      this.logger.error(`API key validation error: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async checkRateLimit(key: string, ipAddress?: string): Promise<void> {
    // In production, this would use Redis to implement rate limiting
    // For now, we'll just log the check
    this.logger.debug(`Rate limit check for key: ${key} from IP: ${ipAddress || 'unknown'}`);

    // Example implementation with Redis would be:
    // const attempts = await this.redisService.incr(`auth:attempts:${key}:${ipAddress}`);
    // await this.redisService.expire(`auth:attempts:${key}:${ipAddress}`, 300); // 5 minutes
    // if (attempts > 5) {
    //   throw new ForbiddenException('Rate limit exceeded. Try again later.');
    // }
  }

  generateMerchantToken(merchantId: string, email: string, name: string, deviceInfo?: string): string {
    // Generate a unique jti (JWT ID) for token tracking/revocation
    const jti = this.generateUniqueTokenId();

    const payload: MerchantJwtPayload = {
      sub: merchantId,
      email,
      name,
      jti,
      // Add additional claims for security
      iat: Math.floor(Date.now() / 1000),
      // Add device fingerprint if available
      device: deviceInfo ? this.hashDeviceInfo(deviceInfo) : undefined,
    };

    // Log token issuance for audit trail
    this.logger.log(`Generating merchant token for: ${merchantId}, jti: ${jti}`);

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: `${this.configService.get<number>('JWT_MERCHANT_EXPIRATION', 86400)}s`, // Default 24 hours
    });
  }

  verifyMerchantToken(token: string, deviceInfo?: string): MerchantJwtPayload {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Check if token has been revoked (would use Redis in production)
      // await this.checkTokenRevocation(payload.jti);

      // Verify device fingerprint if available
      if (deviceInfo && payload.device && payload.device !== this.hashDeviceInfo(deviceInfo)) {
        this.logger.warn(`Device mismatch for token: ${payload.jti}, user: ${payload.sub}`);
        throw new UnauthorizedException('Invalid token for this device');
      }

      return payload;
    } catch (error) {
      this.logger.error(`Token verification error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private generateUniqueTokenId(): string {
    return randomBytes(16).toString('hex');
  }

  private hashDeviceInfo(deviceInfo: string): string {
    return createHash('sha256').update(deviceInfo).digest('hex');
  }
}
