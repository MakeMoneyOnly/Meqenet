import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SecurityConfig {
  readonly encryption: {
    readonly algorithm: string;
    readonly keyDerivation: {
      readonly iterations: number;
      readonly keyLength: number;
      readonly digest: string;
    };
  };
  readonly hsm: {
    readonly enabled: boolean;
    readonly provider: string;
    readonly keyId: string;
    readonly region?: string;
  };
  readonly jwt: {
    readonly secret: string;
    readonly expiresIn: string;
    readonly issuer: string;
    readonly audience: string;
  };
  readonly rateLimit: {
    readonly ttl: number;
    readonly limit: number;
    readonly skipSuccessfulRequests: boolean;
  };
  readonly ethiopian: {
    readonly faydaEncryption: {
      readonly keyId: string;
      readonly algorithm: string;
    };
    readonly nbeCompliance: {
      readonly reportingEndpoint: string;
      readonly institutionCode: string;
      readonly encryptionRequired: boolean;
    };
  };
}

@Injectable()
export class SecurityConfigService {
  private readonly secretsManager: SecretsManagerClient;
  private readonly logger = new Logger(SecurityConfigService.name);

  constructor(private readonly configService: ConfigService) {
    this.secretsManager = new SecretsManagerClient({
      region: this.configService.get<string>('AWS_REGION') ?? 'us-east-1',
    });
  }

  get config(): Omit<SecurityConfig, 'jwt.secret'> {
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
        enabled: this.configService.get<string>('HSM_ENABLED') === 'true',
        provider: this.configService.get<string>('HSM_PROVIDER') ?? 'aws-kms',
        keyId: this.configService.get<string>('HSM_KEY_ID') ?? '', // This would be the name of the secret in Secrets Manager
        region: this.configService.get<string>('AWS_REGION') ?? 'us-east-1',
      },
      jwt: {
        // SECRET IS NOW FETCHED ASYNCHRONOUSLY
        secret: '', // This value is intentionally left blank and should not be used directly.
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') ?? '1h',
        issuer: this.configService.get<string>('JWT_ISSUER') ?? 'meqenet.et',
        audience:
          this.configService.get<string>('JWT_AUDIENCE') ?? 'auth-service',
      },
      rateLimit: {
        ttl: parseInt(
          this.configService.get<string>('RATE_LIMIT_TTL') ?? '60',
          10
        ),
        limit: parseInt(
          this.configService.get<string>('RATE_LIMIT_COUNT') ?? '100',
          10
        ),
        skipSuccessfulRequests: true,
      },
      ethiopian: {
        faydaEncryption: {
          keyId:
            this.configService.get<string>('FAYDA_ENCRYPTION_KEY_ID') ?? '',
          algorithm: 'aes-256-gcm',
        },
        nbeCompliance: {
          reportingEndpoint:
            this.configService.get<string>('NBE_REPORTING_ENDPOINT') ?? '',
          institutionCode:
            this.configService.get<string>('NBE_INSTITUTION_CODE') ?? '',
          encryptionRequired:
            this.configService.get<string>('NBE_ENCRYPTION_REQUIRED') ===
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
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    // Validate HSM configuration in production
    if (nodeEnv === 'production' && !config.hsm.enabled) {
      errors.push('HSM must be enabled in production');
    }

    if (nodeEnv === 'production' && !config.hsm.keyId) {
      errors.push('HSM Key ID (Secret Name) must be configured in production');
    }

    // Validate Ethiopian compliance configuration
    if (!config.ethiopian.nbeCompliance.institutionCode) {
      errors.push('NBE institution code is required');
    }

    if (!config.ethiopian.faydaEncryption.keyId) {
      errors.push('Fayda encryption key ID (Secret Name) is required');
    }

    // JWT Secret is now fetched from secrets manager, so local validation is removed.
    // We will validate its existence by attempting to fetch it.

    if (errors.length > 0) {
      throw new Error(
        `Security configuration validation failed: ${errors.join(', ')}`
      );
    }

    // Validate that we can connect to secrets manager and fetch secrets
    try {
      await this.getJwtSecret();
      await this.getFaydaEncryptionKey();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to fetch critical secrets from AWS Secrets Manager: ${errorMessage}`
      );
    }

    return true;
  }

  /**
   * Fetches the JWT secret from AWS Secrets Manager.
   * This is the ONLY way to retrieve this secret.
   */
  async getJwtSecret(): Promise<string> {
    const secretName = this.configService.get<string>('JWT_SECRET_NAME');
    if (!secretName) {
      throw new Error('JWT_SECRET_NAME environment variable not set.');
    }
    return this.getSecret(secretName);
  }

  /**
   * Gets encryption key for Fayda National ID data.
   * Fetches the key from AWS Secrets Manager.
   * This is the ONLY way to retrieve this key.
   */
  async getFaydaEncryptionKey(): Promise<string> {
    const keyId = this.config.ethiopian.faydaEncryption.keyId;
    if (!keyId) {
      throw new Error(
        'Fayda encryption key ID (Secret Name) is not configured.'
      );
    }
    return this.getSecret(keyId);
  }

  /**
   * Generic private method to fetch a secret from AWS Secrets Manager.
   * @param secretName The name of the secret to fetch.
   */
  private async getSecret(secretName: string): Promise<string> {
    if (!secretName || typeof secretName !== 'string') {
      throw new Error('Secret name must be a non-empty string');
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.secretsManager.send(command);

      if (response.SecretString) {
        return response.SecretString;
      }

      // If the secret is binary
      if (response.SecretBinary) {
        return Buffer.from(response.SecretBinary).toString('ascii');
      }

      throw new Error(`Secret ${secretName} has no value.`);
    } catch (error: unknown) {
      // Log the error for internal diagnostics but throw a generic error to the caller
      this.logger.error(
        `Failed to retrieve secret ${secretName} from AWS Secrets Manager`,
        error
      );
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Could not retrieve secret: ${secretName}. Check service permissions and secret existence. ${errorMessage}`
      );
    }
  }

  /**
   * Placeholder for HSM key retrieval
   * In actual implementation, this would use AWS KMS, Azure Key Vault, etc.
   * @param keyId - The HSM key identifier
   * @returns Promise<string> - The retrieved key
   */
  private async getKeyFromHSM(keyId: string): Promise<string> {
    if (!keyId || typeof keyId !== 'string') {
      throw new Error('HSM key ID must be a non-empty string');
    }

    // TODO: Implement actual HSM integration
    // This is a placeholder implementation
    throw new Error('HSM integration not yet implemented');
  }
}
