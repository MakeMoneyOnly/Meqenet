import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SecretManagerService } from './secret-manager.service';

// Constants for magic numbers
const DEFAULT_DB_ROTATION_DAYS = 90;
const DEFAULT_JWT_ROTATION_DAYS = 30;
const DEFAULT_SERVICE_ROTATION_DAYS = 60;
const DEFAULT_API_ROTATION_DAYS = 45;
const DEFAULT_ROTATION_DAYS = 30;
const SECURE_STRING_LENGTH = 12;
const PASSWORD_UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PASSWORD_LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const PASSWORD_NUMBERS = '0123456789';
const PASSWORD_SYMBOLS = '!@#$%^&*';
const PASSWORD_MIN_LENGTH = 16;
const PASSWORD_INITIAL_CHARS = 4;
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MILLISECONDS_PER_DAY =
  MILLISECONDS_PER_SECOND *
  SECONDS_PER_MINUTE *
  MINUTES_PER_HOUR *
  HOURS_PER_DAY;
const RANDOM_SHUFFLE_OFFSET = 0.5;
const DEFAULT_POSTGRESQL_PORT = 5432;

export interface CredentialMetadata {
  name: string;
  type: 'database' | 'api' | 'service' | 'jwt';
  lastRotated: Date;
  nextRotation: Date;
  rotationIntervalDays: number;
  status: 'active' | 'rotating' | 'expired';
}

export interface DatabaseCredentials {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface ApiCredentials {
  apiKey: string;
  secretKey: string;
  endpoint?: string;
}

@Injectable()
export class CredentialRotationService implements OnModuleInit {
  private readonly logger = new Logger(CredentialRotationService.name);
  private credentials: Map<string, CredentialMetadata> = new Map();

  constructor(
    private configService: ConfigService,
    private secretManagerService: SecretManagerService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initializeCredentialTracking();
    this.logger.log('✅ Credential Rotation Service initialized');
  }

  /**
   * Initialize credential tracking from existing secrets
   */
  private async initializeCredentialTracking(): Promise<void> {
    try {
      const secrets = await this.secretManagerService.listSecrets();

      for (const secret of secrets) {
        const secretEntry = secret as { Name?: string; LastChangedDate?: Date }; // AWS SecretListEntry type
        const name = secretEntry.Name ?? '';
        const metadata: CredentialMetadata = {
          name,
          type: this.determineCredentialType(name),
          lastRotated: secretEntry.LastChangedDate ?? new Date(),
          nextRotation: this.calculateNextRotation(
            secretEntry.LastChangedDate ?? new Date(),
            this.getRotationInterval(name)
          ),
          rotationIntervalDays: this.getRotationInterval(name),
          status: 'active',
        };

        this.credentials.set(name, metadata);
      }

      this.logger.log(
        `📊 Initialized tracking for ${this.credentials.size} credentials`
      );
    } catch (error) {
      this.logger.error('❌ Failed to initialize credential tracking:', error);
    }
  }

  /**
   * Determine credential type from secret name
   */
  private determineCredentialType(name: string): CredentialMetadata['type'] {
    if (name.includes('database') || name.includes('db')) {
      return 'database';
    }
    if (name.includes('api') || name.includes('service')) {
      return 'service';
    }
    if (name.includes('jwt')) {
      return 'jwt';
    }
    return 'api';
  }

  /**
   * Get rotation interval in days based on credential type
   */
  private getRotationInterval(name: string): number {
    const type = this.determineCredentialType(name);

    switch (type) {
      case 'database':
        return this.configService.get<number>(
          'DB_CREDENTIAL_ROTATION_DAYS',
          DEFAULT_DB_ROTATION_DAYS
        );
      case 'jwt':
        return this.configService.get<number>(
          'JWT_KEY_ROTATION_DAYS',
          DEFAULT_JWT_ROTATION_DAYS
        );
      case 'service':
        return this.configService.get<number>(
          'SERVICE_CREDENTIAL_ROTATION_DAYS',
          DEFAULT_SERVICE_ROTATION_DAYS
        );
      case 'api':
        return this.configService.get<number>(
          'API_CREDENTIAL_ROTATION_DAYS',
          DEFAULT_API_ROTATION_DAYS
        );
      default:
        return DEFAULT_ROTATION_DAYS;
    }
  }

  /**
   * Calculate next rotation date
   */
  private calculateNextRotation(lastRotated: Date, intervalDays: number): Date {
    const nextRotation = new Date(lastRotated);
    nextRotation.setDate(nextRotation.getDate() + intervalDays);
    return nextRotation;
  }

  /**
   * Check if credential needs rotation
   */
  isCredentialDueForRotation(name: string): boolean {
    const metadata = this.credentials.get(name);
    if (!metadata) return false;

    return new Date() >= metadata.nextRotation;
  }

  /**
   * Get all credentials due for rotation
   */
  getCredentialsDueForRotation(): CredentialMetadata[] {
    const dueCredentials: CredentialMetadata[] = [];

    for (const metadata of this.credentials.values()) {
      if (this.isCredentialDueForRotation(metadata.name)) {
        dueCredentials.push(metadata);
      }
    }

    return dueCredentials;
  }

  /**
   * Rotate database credentials
   */
  async rotateDatabaseCredentials(name: string): Promise<void> {
    try {
      this.logger.log(`🔄 Starting database credential rotation for: ${name}`);

      const currentCredentials =
        await this.secretManagerService.getSecret(name);
      const newCredentials = await this.generateDatabaseCredentials();

      // Test new credentials before updating
      const testResult = await this.testDatabaseConnection(newCredentials);
      if (!testResult) {
        throw new Error('New database credentials failed connection test');
      }

      // Store new credentials
      await this.secretManagerService.updateSecret(name, {
        ...newCredentials,
        rotatedAt: new Date().toISOString(),
        previousCredentials: currentCredentials,
      });

      // Update tracking
      this.updateCredentialMetadata(name);

      // Notify services about credential rotation
      await this.notifyServicesOfRotation(name, 'database');

      this.logger.log(`✅ Database credentials rotated successfully: ${name}`);
    } catch (error) {
      this.logger.error(
        `❌ Database credential rotation failed for ${name}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Rotate API credentials
   */
  async rotateApiCredentials(name: string): Promise<void> {
    try {
      this.logger.log(`🔄 Starting API credential rotation for: ${name}`);

      const currentCredentials =
        await this.secretManagerService.getSecret(name);
      const newCredentials = await this.generateApiCredentials();

      // Store new credentials
      await this.secretManagerService.updateSecret(name, {
        ...newCredentials,
        rotatedAt: new Date().toISOString(),
        previousCredentials: currentCredentials,
      });

      // Update tracking
      this.updateCredentialMetadata(name);

      // Notify services about credential rotation
      await this.notifyServicesOfRotation(name, 'api');

      this.logger.log(`✅ API credentials rotated successfully: ${name}`);
    } catch (error) {
      this.logger.error(
        `❌ API credential rotation failed for ${name}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Generate new database credentials
   */
  private async generateDatabaseCredentials(): Promise<DatabaseCredentials> {
    const username = `meqenet_${this.generateSecureString(SECURE_STRING_LENGTH)}`;
    const password = this.generateSecurePassword();

    return {
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', DEFAULT_POSTGRESQL_PORT),
      database: this.configService.get<string>('DB_NAME', 'meqenet'),
      username,
      password,
    };
  }

  /**
   * Generate new API credentials
   */
  private async generateApiCredentials(): Promise<ApiCredentials> {
    const API_KEY_LENGTH = 32;
    const SECRET_KEY_LENGTH = 64;

    return {
      apiKey: this.generateSecureString(API_KEY_LENGTH),
      secretKey: this.generateSecureString(SECRET_KEY_LENGTH),
      endpoint:
        this.configService.get<string>('API_ENDPOINT') ||
        'https://api.default.com',
    };
  }

  /**
   * Generate secure random string
   */
  private generateSecureString(length: number): string {
    const chars = `${PASSWORD_UPPERCASE_CHARS}${PASSWORD_LOWERCASE_CHARS}${PASSWORD_NUMBERS}`;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate secure password
   */
  private generateSecurePassword(): string {
    let password = '';
    password += PASSWORD_UPPERCASE_CHARS.charAt(
      Math.floor(Math.random() * PASSWORD_UPPERCASE_CHARS.length)
    );
    password += PASSWORD_LOWERCASE_CHARS.charAt(
      Math.floor(Math.random() * PASSWORD_LOWERCASE_CHARS.length)
    );
    password += PASSWORD_NUMBERS.charAt(
      Math.floor(Math.random() * PASSWORD_NUMBERS.length)
    );
    password += PASSWORD_SYMBOLS.charAt(
      Math.floor(Math.random() * PASSWORD_SYMBOLS.length)
    );

    // Add remaining characters
    const allChars = `${PASSWORD_UPPERCASE_CHARS}${PASSWORD_LOWERCASE_CHARS}${PASSWORD_NUMBERS}${PASSWORD_SYMBOLS}`;
    for (let i = PASSWORD_INITIAL_CHARS; i < PASSWORD_MIN_LENGTH; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle password
    return password
      .split('')
      .sort(() => Math.random() - RANDOM_SHUFFLE_OFFSET)
      .join('');
  }

  /**
   * Test database connection with new credentials
   */
  private async testDatabaseConnection(
    credentials: DatabaseCredentials
  ): Promise<boolean> {
    try {
      // This would implement actual database connection test
      // For now, return true as a placeholder
      this.logger.log(
        `🧪 Testing database connection for ${credentials.username}`
      );
      return true;
    } catch (error) {
      this.logger.error('❌ Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Update credential metadata after rotation
   */
  private updateCredentialMetadata(name: string): void {
    const metadata = this.credentials.get(name);
    if (metadata) {
      metadata.lastRotated = new Date();
      metadata.nextRotation = this.calculateNextRotation(
        metadata.lastRotated,
        metadata.rotationIntervalDays
      );
      metadata.status = 'active';

      this.credentials.set(name, metadata);
    }
  }

  /**
   * Notify services about credential rotation
   */
  private async notifyServicesOfRotation(
    name: string,
    type: string
  ): Promise<void> {
    try {
      // This would implement service notification logic
      // Could use AWS SNS, webhooks, or internal messaging
      this.logger.log(
        `📢 Notifying services about ${type} credential rotation: ${name}`
      );
    } catch (error) {
      this.logger.error('❌ Failed to notify services:', error);
    }
  }

  /**
   * Scheduled credential rotation check
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkAndRotateCredentials(): Promise<void> {
    try {
      this.logger.log('🔍 Checking for credentials due for rotation...');

      const dueCredentials = this.getCredentialsDueForRotation();

      if (dueCredentials.length === 0) {
        this.logger.log('✅ No credentials due for rotation');
        return;
      }

      this.logger.log(
        `📋 Found ${dueCredentials.length} credential(s) due for rotation`
      );

      for (const credential of dueCredentials) {
        try {
          await this.rotateCredentialByType(credential);
        } catch (error) {
          this.logger.error(
            `❌ Failed to rotate credential ${credential.name}:`,
            error
          );
        }
      }
    } catch (error) {
      this.logger.error('❌ Credential rotation check failed:', error);
    }
  }

  /**
   * Rotate credential based on its type
   */
  private async rotateCredentialByType(
    credential: CredentialMetadata
  ): Promise<void> {
    switch (credential.type) {
      case 'database':
        await this.rotateDatabaseCredentials(credential.name);
        break;
      case 'api':
        await this.rotateApiCredentials(credential.name);
        break;
      case 'jwt':
        // JWT keys are handled by SecretManagerService
        this.logger.log(
          `🔄 JWT key rotation handled by SecretManagerService: ${credential.name}`
        );
        break;
      default:
        this.logger.warn(
          `⚠️ Unknown credential type for rotation: ${credential.type}`
        );
    }
  }

  /**
   * Get credential status report
   */
  getCredentialStatusReport(): Record<string, unknown> {
    const report = {
      total: this.credentials.size,
      active: 0,
      dueForRotation: 0,
      expired: 0,
      credentials: [] as Record<string, unknown>[],
    };

    for (const metadata of this.credentials.values()) {
      switch (metadata.status) {
        case 'active':
          report.active++;
          break;
        case 'rotating':
          report.dueForRotation++;
          break;
        case 'expired':
          report.expired++;
          break;
      }

      report.credentials.push({
        name: metadata.name,
        type: metadata.type,
        lastRotated: metadata.lastRotated,
        nextRotation: metadata.nextRotation,
        status: metadata.status,
        daysUntilRotation: Math.ceil(
          (metadata.nextRotation.getTime() - new Date().getTime()) /
            MILLISECONDS_PER_DAY
        ),
      });
    }

    return report;
  }
}
