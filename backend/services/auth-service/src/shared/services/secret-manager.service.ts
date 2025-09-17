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
import { SecurityMonitoringService } from './security-monitoring.service';

// Constants for magic numbers
const RSA_KEY_SIZE = 2048;
const TIMESTAMP_BASE = 36;
const RANDOM_STRING_LENGTH = 9;
// These constants are used for extracting RSA key components
const MODULUS_START = 9;
const MODULUS_SIZE = 256;
const EXPONENT_START = 265;
const EXPONENT_SIZE = 3;
const SUBSTR_START_INDEX = 2;

// Time conversion constants
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

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
  private previousPublicKey?: {
    kid: string;
    publicKey: string;
    rotatedAt?: string;
  };
  private keyRotationEnabled: boolean;

  constructor(
    private configService: ConfigService,
    private securityMonitoring: SecurityMonitoringService
  ) {
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
      const keys = await this.getJwtKeyPair();

      this.currentJwtKeys = {
        privateKey: keys.privateKey,
        publicKey: keys.publicKey,
        kid: keyId,
      };

      if (keys.previousKid && keys.previousPublicKey) {
        this.previousPublicKey = {
          kid: keys.previousKid,
          publicKey: keys.previousPublicKey,
          rotatedAt: keys.rotatedAt || new Date().toISOString(),
        };
      }

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
   * Get JWT key data from AWS Secrets Manager
   */
  private async getJwtKeyPair(): Promise<{
    privateKey: string;
    publicKey: string;
    previousKid?: string;
    previousPublicKey?: string;
    rotatedAt?: string;
  }> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: `meqenet-jwt-keys`,
      });

      const response = await this.secretsManagerClient.send(command);
      const secretValue = JSON.parse(response.SecretString ?? '{}');

      return {
        privateKey: secretValue.privateKey,
        publicKey: secretValue.publicKey,
        previousKid: secretValue.previousKid,
        previousPublicKey: secretValue.previousPublicKey,
        rotatedAt: secretValue.rotatedAt,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get JWT keys:`, error);
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
   * Store a secret with custom options
   */
  async storeSecret(
    name: string,
    value: string,
    options?: {
      description?: string;
      tags?: Array<{ Key: string; Value: string }>;
    }
  ): Promise<void> {
    try {
      const command = new CreateSecretCommand({
        Name: name,
        SecretString: value,
        Description: options?.description || `Meqenet secret: ${name}`,
        Tags: options?.tags || [
          { Key: 'Application', Value: 'Meqenet' },
          {
            Key: 'Environment',
            Value: this.configService.get<string>('NODE_ENV', 'development'),
          },
          { Key: 'ManagedBy', Value: 'SecretManagerService' },
        ],
      });

      await this.secretsManagerClient.send(command);
      this.logger.log(`✅ Secret stored: ${name}`);
    } catch (error) {
      this.logger.error(`❌ Failed to store secret ${name}:`, error);
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

  getCurrentJwtPrivateKey(): string {
    return this.currentJwtKeys.privateKey;
  }

  getCurrentJwtPublicKey(): string {
    return this.currentJwtKeys.publicKey;
  }

  getCurrentJwtKeyId(): string {
    return this.currentJwtKeys.kid;
  }

  async getJWKS(): Promise<JWKSResponse> {
    try {
      const keys: JWKSKey[] = [];

      // Current key
      const currentKeyDetails = await this.extractRSAKeyDetails(
        this.getCurrentJwtPublicKey()
      );
      keys.push({
        kty: 'RSA',
        use: 'sig',
        kid: this.getCurrentJwtKeyId(),
        n: currentKeyDetails.modulus,
        e: currentKeyDetails.exponent,
        alg: 'RS256',
      });

      // Previous key within grace period
      const graceDays = Number(
        this.configService.get<string>('JWKS_GRACE_DAYS', '7')
      );
      if (this.previousPublicKey && this.previousPublicKey.publicKey) {
        const rotatedAt = this.previousPublicKey.rotatedAt
          ? new Date(this.previousPublicKey.rotatedAt)
          : undefined;
        const withinGrace = rotatedAt
          ? (Date.now() - rotatedAt.getTime()) /
              (MILLISECONDS_PER_SECOND *
                SECONDS_PER_MINUTE *
                MINUTES_PER_HOUR *
                HOURS_PER_DAY) <=
            graceDays
          : true;
        if (withinGrace) {
          const prevDetails = await this.extractRSAKeyDetails(
            this.previousPublicKey.publicKey
          );
          keys.push({
            kty: 'RSA',
            use: 'sig',
            kid: this.previousPublicKey.kid,
            n: prevDetails.modulus,
            e: prevDetails.exponent,
            alg: 'RS256',
          });
        }
      }

      return { keys };
    } catch (error) {
      this.logger.error('❌ Failed to generate JWKS:', error);
      throw error;
    }
  }

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

      // Store new keys keeping previous keys for grace period
      const secretName = 'meqenet-jwt-keys';
      await this.updateSecret(secretName, {
        kid: newKid,
        privateKey: newKeyPair.privateKey,
        publicKey: newKeyPair.publicKey,
        rotatedAt: new Date().toISOString(),
        previousKid: this.currentJwtKeys.kid,
        previousPublicKey: this.currentJwtKeys.publicKey,
      });

      // Update in-memory state
      this.previousPublicKey = {
        kid: this.currentJwtKeys.kid,
        publicKey: this.currentJwtKeys.publicKey,
        rotatedAt: new Date().toISOString(),
      };
      this.currentJwtKeys = {
        privateKey: newKeyPair.privateKey,
        publicKey: newKeyPair.publicKey,
        kid: newKid,
      };

      this.securityMonitoring.recordJwtRotation('success');
      this.logger.log(`✅ JWT keys rotated successfully. New KID: ${newKid}`);
    } catch (error) {
      this.securityMonitoring.recordJwtRotation('failure');
      this.logger.error('❌ JWT key rotation failed:', error);
    }
  }

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

  /**
   * Extract modulus and exponent from RSA public key PEM
   */
  private async extractRSAKeyDetails(
    publicKeyPem: string
  ): Promise<{ modulus: string; exponent: string }> {
    try {
      // Remove PEM header/footer and decode base64
      const base64Key = publicKeyPem
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s/g, '');

      const keyBuffer = Buffer.from(base64Key, 'base64');

      // Extract modulus (big-endian, 256 bytes starting at offset 9)
      const modulus = keyBuffer.subarray(
        MODULUS_START,
        MODULUS_START + MODULUS_SIZE
      );
      const modulusB64 = modulus.toString('base64');

      // Extract exponent (big-endian, 3 bytes starting at offset 265)
      const exponent = keyBuffer.subarray(
        EXPONENT_START,
        EXPONENT_START + EXPONENT_SIZE
      );
      const exponentB64 = exponent.toString('base64');

      return {
        modulus: modulusB64,
        exponent: exponentB64,
      };
    } catch (error) {
      this.logger.error('❌ Failed to extract RSA key details:', error);
      throw new Error('Failed to extract RSA key components');
    }
  }
}
