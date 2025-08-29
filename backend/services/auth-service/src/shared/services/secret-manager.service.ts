import { KMSClient, DecryptCommand, EncryptCommand } from '@aws-sdk/client-kms';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  UpdateSecretCommand,
  CreateSecretCommand,
  DescribeSecretCommand,
  ListSecretsCommand,
} from '@aws-sdk/client-secrets-manager';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

// Constants for magic numbers
const RSA_KEY_SIZE = 2048;
const TIMESTAMP_BASE = 36;
const RANDOM_STRING_LENGTH = 9;
const MODULUS_START = 9;
const MODULUS_SIZE = 256;
const EXPONENT_START = 265;
const EXPONENT_SIZE = 3;
const SUBSTR_START_INDEX = 2;

export interface JWKSKey {
  kty: string;
  use: string;
  kid: string;
  n: string;
  e: string;
  alg: string;
  x5c?: string[];
}

export interface JWKSResponse {
  keys: JWKSKey[];
}

@Injectable()
export class SecretManagerService implements OnModuleInit {
  private readonly logger = new Logger(SecretManagerService.name);
  private secretsManagerClient!: SecretsManagerClient;
  private kmsClient!: KMSClient;
  private currentJwtKeys!: {
    privateKey: string;
    publicKey: string;
    kid: string;
  };
  private keyRotationEnabled: boolean;

  constructor(private configService: ConfigService) {
    this.keyRotationEnabled = this.configService.get<boolean>(
      'JWT_KEY_ROTATION_ENABLED',
      true
    );
  }

  async onModuleInit(): Promise<void> {
    await this.initializeClients();
    await this.initializeJwtKeys();
  }

  private async initializeClients(): Promise<void> {
    try {
      const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
      const endpoint = this.configService.get<string>(
        'AWS_SECRETS_MANAGER_ENDPOINT'
      );

      this.secretsManagerClient = new SecretsManagerClient({
        region,
        ...(endpoint && { endpoint }),
      });

      this.kmsClient = new KMSClient({
        region,
      });

      this.logger.log('✅ Secret Manager clients initialized successfully');
    } catch (error) {
      this.logger.error(
        '❌ Failed to initialize Secret Manager clients:',
        error
      );
      throw error;
    }
  }

  private async initializeJwtKeys(): Promise<void> {
    try {
      const keyId = await this.getOrCreateJwtKey();
      const keys = await this.getJwtKeyPair(keyId);

      this.currentJwtKeys = {
        privateKey: keys.privateKey,
        publicKey: keys.publicKey,
        kid: keyId,
      };

      this.logger.log(`✅ JWT keys initialized with KID: ${keyId}`);
    } catch (error) {
      this.logger.error('❌ Failed to initialize JWT keys:', error);
      throw error;
    }
  }

  /**
   * Get or create JWT key identifier
   */
  private async getOrCreateJwtKey(): Promise<string> {
    const keyName = 'meqenet-jwt-keys';

    try {
      // Check if key exists
      const describeCommand = new DescribeSecretCommand({
        SecretId: keyName,
      });

      const response = await this.secretsManagerClient.send(describeCommand);
      return response.ARN?.split('/').pop() ?? keyName;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.name === 'ResourceNotFoundException'
      ) {
        // Create new key pair
        const keyPair = await this.generateJwtKeyPair();
        const kid = this.generateKeyId();

        await this.createSecret(keyName, {
          kid,
          privateKey: keyPair.privateKey,
          publicKey: keyPair.publicKey,
          createdAt: new Date().toISOString(),
        });

        return kid;
      }
      throw error;
    }
  }

  /**
   * Get JWT key pair from AWS Secrets Manager
   */
  private async getJwtKeyPair(
    kid: string
  ): Promise<{ privateKey: string; publicKey: string }> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: `meqenet-jwt-keys`,
      });

      const response = await this.secretsManagerClient.send(command);
      const secretValue = JSON.parse(response.SecretString ?? '{}');

      if (secretValue.kid === kid) {
        return {
          privateKey: secretValue.privateKey,
          publicKey: secretValue.publicKey,
        };
      }

      throw new Error(`Key pair not found for KID: ${kid}`);
    } catch (error) {
      this.logger.error(`❌ Failed to get JWT key pair for KID ${kid}:`, error);
      throw error;
    }
  }

  /**
   * Generate RSA key pair for JWT
   */
  private async generateJwtKeyPair(): Promise<{
    privateKey: string;
    publicKey: string;
  }> {
    // Note: In production, use a proper cryptographic library
    // This is a simplified implementation for demonstration
    const { generateKeyPairSync } = await import('crypto');

    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: RSA_KEY_SIZE,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return {
      privateKey: privateKey.toString(),
      publicKey: publicKey.toString(),
    };
  }

  /**
   * Generate unique key identifier
   */
  private generateKeyId(): string {
    const timestamp = Date.now().toString(TIMESTAMP_BASE);
    const random = Math.random()
      .toString(TIMESTAMP_BASE)
      .substr(SUBSTR_START_INDEX, RANDOM_STRING_LENGTH);
    return `meqenet-jwt-${timestamp}-${random}`;
  }

  /**
   * Create secret in AWS Secrets Manager
   */
  async createSecret(
    name: string,
    value: Record<string, unknown>
  ): Promise<void> {
    try {
      const command = new CreateSecretCommand({
        Name: name,
        SecretString: JSON.stringify(value),
        Description: `Meqenet secret: ${name}`,
        Tags: [
          { Key: 'Application', Value: 'Meqenet' },
          {
            Key: 'Environment',
            Value: this.configService.get<string>('NODE_ENV', 'development'),
          },
          { Key: 'ManagedBy', Value: 'SecretManagerService' },
        ],
      });

      await this.secretsManagerClient.send(command);
      this.logger.log(`✅ Secret created: ${name}`);
    } catch (error) {
      this.logger.error(`❌ Failed to create secret ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get secret value from AWS Secrets Manager
   */
  async getSecret(name: string): Promise<Record<string, unknown>> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: name,
      });

      const response = await this.secretsManagerClient.send(command);
      return JSON.parse(response.SecretString ?? '{}');
    } catch (error) {
      this.logger.error(`❌ Failed to get secret ${name}:`, error);
      throw error;
    }
  }

  /**
   * Update secret value
   */
  async updateSecret(
    name: string,
    value: Record<string, unknown>
  ): Promise<void> {
    try {
      const command = new UpdateSecretCommand({
        SecretId: name,
        SecretString: JSON.stringify(value),
      });

      await this.secretsManagerClient.send(command);
      this.logger.log(`✅ Secret updated: ${name}`);
    } catch (error) {
      this.logger.error(`❌ Failed to update secret ${name}:`, error);
      throw error;
    }
  }

  /**
   * Encrypt data using AWS KMS
   */
  async encryptData(data: string, keyId?: string): Promise<string> {
    try {
      const command = new EncryptCommand({
        KeyId: keyId ?? this.configService.get<string>('KMS_KEY_ID'),
        Plaintext: Buffer.from(data),
      });

      const response = await this.kmsClient.send(command);
      return response.CiphertextBlob
        ? Buffer.from(response.CiphertextBlob).toString('base64')
        : '';
    } catch (error) {
      this.logger.error('❌ Failed to encrypt data:', error);
      throw error;
    }
  }

  /**
   * Decrypt data using AWS KMS
   */
  async decryptData(encryptedData: string): Promise<string> {
    try {
      const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedData, 'base64'),
      });

      const response = await this.kmsClient.send(command);
      return response.Plaintext?.toString() ?? '';
    } catch (error) {
      this.logger.error('❌ Failed to decrypt data:', error);
      throw error;
    }
  }

  /**
   * Get current JWT private key for signing
   */
  getCurrentJwtPrivateKey(): string {
    return this.currentJwtKeys.privateKey;
  }

  /**
   * Get current JWT public key for verification
   */
  getCurrentJwtPublicKey(): string {
    return this.currentJwtKeys.publicKey;
  }

  /**
   * Get current JWT key ID
   */
  getCurrentJwtKeyId(): string {
    return this.currentJwtKeys.kid;
  }

  /**
   * Generate JWKS response
   */
  async getJWKS(): Promise<JWKSResponse> {
    try {
      const publicKey = this.getCurrentJwtPublicKey();
      const kid = this.getCurrentJwtKeyId();

      // Extract modulus and exponent from RSA public key
      const keyDetails = await this.extractRSAKeyDetails(publicKey);

      const jwk: JWKSKey = {
        kty: 'RSA',
        use: 'sig',
        kid,
        n: keyDetails.modulus,
        e: keyDetails.exponent,
        alg: 'RS256',
      };

      return { keys: [jwk] };
    } catch (error) {
      this.logger.error('❌ Failed to generate JWKS:', error);
      throw error;
    }
  }

  /**
   * Extract RSA key details for JWKS
   */
  private async extractRSAKeyDetails(
    publicKeyPem: string
  ): Promise<{ modulus: string; exponent: string }> {
    const { createPublicKey } = await import('crypto');
    const publicKey = createPublicKey(publicKeyPem);

    // Get key details
    const keyDetails = publicKey.export({ type: 'spki', format: 'der' });

    // For JWKS, we need to extract n (modulus) and e (exponent) from the DER encoded key
    // This is a simplified implementation - in production, use a proper JWKS library
    const modulus = keyDetails
      .slice(MODULUS_START, MODULUS_START + MODULUS_SIZE)
      .toString('base64url');
    const exponent = keyDetails
      .slice(EXPONENT_START, EXPONENT_START + EXPONENT_SIZE)
      .readUIntBE(0, EXPONENT_SIZE)
      .toString();

    return { modulus, exponent };
  }

  /**
   * Rotate JWT keys (scheduled task)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async rotateJwtKeys(): Promise<void> {
    if (!this.keyRotationEnabled) {
      this.logger.log('🔄 JWT key rotation disabled, skipping...');
      return;
    }

    try {
      this.logger.log('🔄 Starting JWT key rotation...');

      // Generate new key pair
      const newKeyPair = await this.generateJwtKeyPair();
      const newKid = this.generateKeyId();

      // Store new keys
      const secretName = 'meqenet-jwt-keys';
      await this.updateSecret(secretName, {
        kid: newKid,
        privateKey: newKeyPair.privateKey,
        publicKey: newKeyPair.publicKey,
        rotatedAt: new Date().toISOString(),
        previousKid: this.currentJwtKeys.kid,
      });

      // Update current keys
      this.currentJwtKeys = {
        privateKey: newKeyPair.privateKey,
        publicKey: newKeyPair.publicKey,
        kid: newKid,
      };

      this.logger.log(`✅ JWT keys rotated successfully. New KID: ${newKid}`);

      // In production, you would also:
      // 1. Update any cached JWKS responses
      // 2. Notify other services about key rotation
      // 3. Keep old keys for a grace period
    } catch (error) {
      this.logger.error('❌ JWT key rotation failed:', error);
    }
  }

  /**
   * List all secrets (for monitoring)
   */
  async listSecrets(): Promise<Record<string, unknown>[]> {
    try {
      const command = new ListSecretsCommand({
        Filters: [
          {
            Key: 'tag-value',
            Values: ['Meqenet'],
          },
        ],
      });

      const response = await this.secretsManagerClient.send(command);
      return (response.SecretList ?? []).map(secret => ({
        name: secret.Name,
        arn: secret.ARN,
        createdDate: secret.CreatedDate,
        lastChangedDate: secret.LastChangedDate,
        ...secret,
      }));
    } catch (error) {
      this.logger.error('❌ Failed to list secrets:', error);
      throw error;
    }
  }
}
