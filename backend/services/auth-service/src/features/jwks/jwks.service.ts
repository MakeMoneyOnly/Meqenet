import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';
import { SecretManagerService } from '../../shared/services/secret-manager.service';

@Injectable()
export class JwksService implements OnModuleInit {
  private privateKey!: jose.KeyLike;
  private publicKey!: jose.KeyLike;
  private jwks!: { keys: jose.JWK[] };
  private readonly logger = new Logger(JwksService.name);

  constructor(
    private readonly secretManagerService: SecretManagerService,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit(): Promise<void> {
    const environment =
      this.configService.get<string>('NODE_ENV') || 'development';

    if (environment === 'production') {
      // Production: Load keys from AWS Secrets Manager
      await this.loadKeysFromSecretsManager();
    } else {
      // Development: Generate new key pair for development purposes
      this.logger.warn(
        '⚠️ DEVELOPMENT MODE: Generating new in-memory key pair for JWT signing.'
      );
      await this.generateDevelopmentKeys();
    }
  }

  private async loadKeysFromSecretsManager(): Promise<void> {
    try {
      this.logger.log('🔐 Loading RSA key pair from AWS Secrets Manager...');

      // Load private key from Secrets Manager
      const privateKeyData =
        await this.secretManagerService.getSecret('JWT_PRIVATE_KEY');
      if (!privateKeyData || typeof privateKeyData !== 'string') {
        throw new Error(
          'JWT_PRIVATE_KEY not found in Secrets Manager or invalid format'
        );
      }

      // Load public key from Secrets Manager
      const publicKeyData =
        await this.secretManagerService.getSecret('JWT_PUBLIC_KEY');
      if (!publicKeyData || typeof publicKeyData !== 'string') {
        throw new Error(
          'JWT_PUBLIC_KEY not found in Secrets Manager or invalid format'
        );
      }

      // Import keys from PEM format
      this.privateKey = await jose.importPKCS8(privateKeyData, 'RS256');
      this.publicKey = await jose.importSPKI(publicKeyData, 'RS256');

      // Generate JWKS
      const jwk = await jose.exportJWK(this.publicKey);
      this.jwks = {
        keys: [
          {
            ...jwk,
            kid: 'meqenet-signing-key-prod',
            alg: 'RS256',
            use: 'sig',
          },
        ],
      };

      this.logger.log(
        '✅ RSA key pair successfully loaded from Secrets Manager'
      );
    } catch (error) {
      this.logger.error('❌ Failed to load keys from Secrets Manager:', error);
      throw new Error('Failed to initialize JWT keys from Secrets Manager');
    }
  }

  private async generateDevelopmentKeys(): Promise<void> {
    const { privateKey, publicKey } = await jose.generateKeyPair('RS256');
    this.privateKey = privateKey;
    this.publicKey = publicKey;

    const jwk = await jose.exportJWK(this.publicKey);
    this.jwks = {
      keys: [
        {
          ...jwk,
          kid: 'meqenet-signing-key-dev',
          alg: 'RS256',
          use: 'sig',
        },
      ],
    };
  }

  getJwks(): { keys: jose.JWK[] } {
    return this.jwks;
  }

  getPrivateKey(): jose.KeyLike {
    return this.privateKey;
  }

  getPublicKey(): jose.KeyLike {
    return this.publicKey;
  }

  getKid(): string {
    return 'meqenet-signing-key';
  }
}
