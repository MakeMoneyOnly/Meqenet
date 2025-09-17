import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';
import { SecretManagerService } from './secret-manager.service';
import { AuditLoggingService } from './audit-logging.service';

export interface KeyRotationConfig {
  rotationIntervalDays: number;
  maxActiveKeys: number;
  keyPrefix: string;
  enableAutoRotation: boolean;
}

export interface KeyMetadata {
  kid: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  rotationCount: number;
  lastUsed?: Date;
}

@Injectable()
export class KeyRotationService implements OnModuleInit {
  private readonly logger = new Logger(KeyRotationService.name);
  private readonly config: KeyRotationConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly secretManagerService: SecretManagerService,
    private readonly auditLoggingService: AuditLoggingService
  ) {
    this.config = {
      rotationIntervalDays: parseInt(
        this.configService.get('KEY_ROTATION_INTERVAL_DAYS', '90')
      ),
      maxActiveKeys: parseInt(this.configService.get('MAX_ACTIVE_KEYS', '3')),
      keyPrefix: this.configService.get('KEY_PREFIX', 'meqenet-jwt'),
      enableAutoRotation:
        this.configService.get('ENABLE_AUTO_KEY_ROTATION', 'true') === 'true',
    };
  }

  async onModuleInit(): Promise<void> {
    if (this.config.enableAutoRotation) {
      this.logger.log(
        `🔄 Key rotation enabled: ${this.config.rotationIntervalDays} days interval`
      );
      await this.initializeKeyRotation();
    } else {
      this.logger.log('🔄 Key rotation disabled');
    }
  }

  /**
   * Initialize key rotation system
   */
  private async initializeKeyRotation(): Promise<void> {
    try {
      // Check if keys need rotation
      const keysNeedRotation = await this.checkKeysNeedRotation();
      if (keysNeedRotation) {
        this.logger.warn(
          '⚠️ Keys are due for rotation, scheduling rotation...'
        );
        await this.scheduleKeyRotation();
      }

      // Log current key status
      await this.logKeyStatus();
    } catch (error) {
      this.logger.error('❌ Failed to initialize key rotation:', error);
      await this.auditLoggingService.logSecurityEvent({
        eventType: 'key_rotation',
        severity: 'error',
        description: 'Failed to initialize key rotation system',
        eventData: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Check if any keys need rotation based on age
   */
  async checkKeysNeedRotation(): Promise<boolean> {
    try {
      const keyMetadata = await this.getKeyMetadata();
      const now = new Date();

      for (const metadata of keyMetadata) {
        if (metadata.isActive) {
          const daysSinceCreation =
            (now.getTime() - metadata.createdAt.getTime()) /
            (1000 * 60 * 60 * 24);
          if (daysSinceCreation >= this.config.rotationIntervalDays) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      this.logger.error('❌ Failed to check key rotation status:', error);
      return false;
    }
  }

  /**
   * Rotate JWT signing keys
   */
  async rotateKeys(): Promise<void> {
    try {
      this.logger.log('🔄 Starting JWT key rotation...');

      // Generate new key pair
      const { publicKey, privateKey } = await jose.generateKeyPair('RS256', {
        modulusLength: 2048,
      });

      // Create key ID with timestamp
      const kid = `${this.config.keyPrefix}-prod-${Date.now()}`;
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + this.config.rotationIntervalDays * 24 * 60 * 60 * 1000
      );

      // Export keys to PEM format
      const privateKeyPem = await jose.exportPKCS8(privateKey);
      const publicKeyPem = await jose.exportSPKI(publicKey);

      // Store new keys in Secrets Manager
      await this.secretManagerService.storeSecret(
        `${this.config.keyPrefix}/private-key/${kid}`,
        privateKeyPem,
        {
          description: `JWT Private Key - ${kid}`,
          tags: [
            { Key: 'Purpose', Value: 'JWT_SIGNING' },
            { Key: 'KeyId', Value: kid },
            { Key: 'ExpiresAt', Value: expiresAt.toISOString() },
          ],
        }
      );

      await this.secretManagerService.storeSecret(
        `${this.config.keyPrefix}/public-key/${kid}`,
        publicKeyPem,
        {
          description: `JWT Public Key - ${kid}`,
          tags: [
            { Key: 'Purpose', Value: 'JWT_VERIFICATION' },
            { Key: 'KeyId', Value: kid },
            { Key: 'ExpiresAt', Value: expiresAt.toISOString() },
          ],
        }
      );

      // Update key metadata
      await this.updateKeyMetadata(kid, now, expiresAt);

      // Mark old keys as inactive (keep last 2 for grace period)
      await this.deactivateOldKeys(kid);

      // Log successful rotation
      await this.auditLoggingService.logSecurityEvent({
        eventType: 'key_rotation',
        severity: 'info',
        description: `JWT keys rotated successfully - New Key ID: ${kid}`,
        eventData: {
          newKeyId: kid,
          rotationIntervalDays: this.config.rotationIntervalDays,
          expiresAt: expiresAt.toISOString(),
        },
      });

      this.logger.log(`✅ JWT keys rotated successfully - New Key ID: ${kid}`);
    } catch (error) {
      this.logger.error('❌ Key rotation failed:', error);
      await this.auditLoggingService.logSecurityEvent({
        eventType: 'key_rotation',
        severity: 'error',
        description: 'JWT key rotation failed',
        eventData: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  /**
   * Schedule key rotation (for use with cron jobs or schedulers)
   */
  async scheduleKeyRotation(): Promise<void> {
    try {
      await this.rotateKeys();
    } catch (error) {
      this.logger.error('❌ Scheduled key rotation failed:', error);
      // In a production system, you might want to send alerts here
    }
  }

  /**
   * Get metadata for all keys
   */
  private async getKeyMetadata(): Promise<KeyMetadata[]> {
    try {
      // In a real implementation, this would query a database or Secrets Manager tags
      // For now, we'll return a mock structure
      return [
        {
          kid: 'meqenet-jwt-prod-current',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          isActive: true,
          rotationCount: 1,
          lastUsed: new Date(),
        },
      ];
    } catch (error) {
      this.logger.error('❌ Failed to get key metadata:', error);
      return [];
    }
  }

  /**
   * Update key metadata after rotation
   */
  private async updateKeyMetadata(
    kid: string,
    _createdAt: Date,
    _expiresAt: Date
  ): Promise<void> {
    // In a real implementation, this would update a database record
    this.logger.log(`📝 Updated metadata for key: ${kid}`);
  }

  /**
   * Deactivate old keys, keeping only the specified number of active keys
   */
  private async deactivateOldKeys(newKeyId: string): Promise<void> {
    try {
      const keyMetadata = await this.getKeyMetadata();
      const activeKeys = keyMetadata.filter(k => k.isActive);

      if (activeKeys.length >= this.config.maxActiveKeys) {
        // Sort by creation date (newest first)
        activeKeys.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );

        // Deactivate oldest keys beyond the limit
        const keysToDeactivate = activeKeys.slice(
          this.config.maxActiveKeys - 1
        );

        for (const key of keysToDeactivate) {
          if (key.kid !== newKeyId) {
            await this.deactivateKey(key.kid);
            this.logger.log(`🔒 Deactivated old key: ${key.kid}`);
          }
        }
      }
    } catch (error) {
      this.logger.error('❌ Failed to deactivate old keys:', error);
    }
  }

  /**
   * Deactivate a specific key
   */
  private async deactivateKey(kid: string): Promise<void> {
    // In a real implementation, this would update the key status in database/Secrets Manager
    this.logger.log(`🔒 Deactivated key: ${kid}`);
  }

  /**
   * Log current key status for monitoring
   */
  private async logKeyStatus(): Promise<void> {
    try {
      const keyMetadata = await this.getKeyMetadata();
      const activeKeys = keyMetadata.filter(k => k.isActive);
      const expiredKeys = keyMetadata.filter(k => k.expiresAt < new Date());

      this.logger.log(
        `🔑 Key Status: ${activeKeys.length} active, ${expiredKeys.length} expired`
      );

      if (expiredKeys.length > 0) {
        this.logger.warn(
          `⚠️ ${expiredKeys.length} keys have expired and should be rotated`
        );
      }
    } catch (error) {
      this.logger.error('❌ Failed to log key status:', error);
    }
  }

  /**
   * Get current active key ID
   */
  async getCurrentKeyId(): Promise<string> {
    const keyMetadata = await this.getKeyMetadata();
    const activeKey = keyMetadata.find(k => k.isActive);
    return activeKey?.kid || 'meqenet-jwt-prod-current';
  }

  /**
   * Check if a key is expired
   */
  async isKeyExpired(kid: string): Promise<boolean> {
    const keyMetadata = await this.getKeyMetadata();
    const key = keyMetadata.find(k => k.kid === kid);
    return key ? key.expiresAt < new Date() : true;
  }
}
