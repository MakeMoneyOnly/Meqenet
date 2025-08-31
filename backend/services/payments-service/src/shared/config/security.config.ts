import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keyDerivation: {
      iterations: number;
      keyLength: number;
      digest: string;
    };
  };
  hsm: {
    enabled: boolean;
    provider: string;
    keyId: string;
    region?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    issuer: string;
    audience: string;
  };
  rateLimit: {
    ttl: number;
    limit: number;
    skipSuccessfulRequests: boolean;
  };
  ethiopian: {
    faydaEncryption: {
      keyId: string;
      algorithm: string;
    };
    nbeCompliance: {
      reportingEndpoint: string;
      institutionCode: string;
      encryptionRequired: boolean;
    };
  };
}

@Injectable()
export class SecurityConfigService {
  constructor(private configService: ConfigService) {}

  get config(): SecurityConfig {
    return {
      encryption: {
        algorithm: 'aes-256-gcm',
        keyDerivation: {
          iterations: 100000,
          keyLength: 32,
          digest: 'sha256',
        },
      },
      hsm: {
        enabled: this.configService.get('HSM_ENABLED', 'false') === 'true',
        provider: this.configService.get('HSM_PROVIDER', 'aws-kms'),
        keyId: this.configService.get('HSM_KEY_ID', ''),
        region: this.configService.get('AWS_REGION', 'us-east-1'),
      },
      jwt: {
        secret: this.configService.get('JWT_SECRET', 'development-secret'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '1h'),
        issuer: this.configService.get('JWT_ISSUER', 'meqenet.et'),
        audience: this.configService.get(
          'JWT_AUDIENCE',
          'payments-service'
        ),
      },
      rateLimit: {
        ttl: parseInt(this.configService.get('RATE_LIMIT_TTL', '60'), 10),
        limit: parseInt(this.configService.get('RATE_LIMIT_COUNT', '100'), 10),
        skipSuccessfulRequests: true,
      },
      ethiopian: {
        faydaEncryption: {
          keyId: this.configService.get('FAYDA_ENCRYPTION_KEY_ID', ''),
          algorithm: 'aes-256-gcm',
        },
        nbeCompliance: {
          reportingEndpoint: this.configService.get(
            'NBE_REPORTING_ENDPOINT',
            ''
          ),
          institutionCode: this.configService.get('NBE_INSTITUTION_CODE', ''),
          encryptionRequired:
            this.configService.get('NBE_ENCRYPTION_REQUIRED', 'true') ===
            'true',
        },
      },
    };
  }

  /**
   * Validates that all required security configurations are present
   * @returns Promise<boolean> - True if configuration is valid
   */
  async validateConfiguration(): Promise<boolean> {
    const config = this.config;
    const errors: string[] = [];

    // Validate HSM configuration in production
    if (process.env.NODE_ENV === 'production' && !config.hsm.enabled) {
      errors.push('HSM must be enabled in production');
    }

    // Validate Ethiopian compliance configuration
    if (!config.ethiopian.nbeCompliance.institutionCode) {
      errors.push('NBE institution code is required');
    }

    if (!config.ethiopian.faydaEncryption.keyId) {
      errors.push('Fayda encryption key ID is required');
    }

    // Validate JWT configuration
    if (
      config.jwt.secret === 'development-secret' &&
      process.env.NODE_ENV === 'production'
    ) {
      errors.push('Production JWT secret must be set');
    }

    if (errors.length > 0) {
      throw new Error(
        `Security configuration validation failed: ${errors.join(', ')}`
      );
    }

    return true;
  }

  /**
   * Gets encryption key for Fayda National ID data
   * Uses HSM in production, local key in development
   */
  async getFaydaEncryptionKey(): Promise<string> {
    if (this.config.hsm.enabled) {
      // In production, retrieve key from AWS KMS or other HSM
      // This is a placeholder - actual implementation would use AWS SDK
      return await this.getKeyFromHSM(
        this.config.ethiopian.faydaEncryption.keyId
      );
    }

    // Development/test environment
    return this.configService.get('FAYDA_ENCRYPTION_KEY', 'dev-fayda-key');
  }

  /**
   * Placeholder for HSM key retrieval
   * In actual implementation, this would use AWS KMS, Azure Key Vault, etc.
   */
  private async getKeyFromHSM(_keyId: string): Promise<string> {
    // TODO: Implement actual HSM integration
    // Example for AWS KMS:
    // const kms = new AWS.KMS({ region: this.config.hsm.region });
    // const result = await kms.decrypt({ CiphertextBlob: Buffer.from(keyId, 'base64') }).promise();
    // return result.Plaintext?.toString() || '';

    throw new Error('HSM integration not implemented - use AWS KMS SDK');
  }
}
