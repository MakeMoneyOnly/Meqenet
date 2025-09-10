import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretManagerService } from '../services/secret-manager.service';

// Note: This utility has been refactored to use the centralized SecretManagerService for all cryptographic operations.
// All local crypto logic has been deprecated and removed.

export interface EncryptedFaydaIdResult {
  readonly encryptedData: string; // Base64 encoded string from KMS
  readonly keyId: string;
  readonly algorithm: string;
}

@Injectable()
export class FaydaEncryptionUtil {
  private readonly logger = new Logger(FaydaEncryptionUtil.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly secretManagerService: SecretManagerService
  ) {
    this.logger.log(
      '✅ FaydaEncryptionUtil initialized and linked to SecretManagerService (KMS)'
    );
  }

  /**
   * Encrypts Fayda National ID data using KMS
   */
  async encryptFaydaId(faydaId: string): Promise<EncryptedFaydaIdResult> {
    if (!faydaId || typeof faydaId !== 'string') {
      throw new Error('Fayda ID must be a non-empty string');
    }

    try {
      const keyId = this.configService.get<string>('KMS_KEY_ID');
      const encryptedData = await this.secretManagerService.encryptData(
        faydaId,
        keyId
      );

      return {
        encryptedData,
        keyId: keyId ?? 'default-kms-key',
        algorithm: 'kms-aes-256-gcm',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown encryption error';
      this.logger.error(`Fayda ID encryption failed: ${errorMessage}`, error);
      throw new Error(`Fayda ID encryption failed: ${errorMessage}`);
    }
  }

  /**
   * Decrypts Fayda National ID data using KMS
   */
  async decryptFaydaId(encryptedData: string): Promise<string> {
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Encrypted data must be a non-empty string');
    }

    try {
      return await this.secretManagerService.decryptData(encryptedData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown decryption error';
      this.logger.error(`Fayda ID decryption failed: ${errorMessage}`, error);
      throw new Error(`Fayda ID decryption failed: ${errorMessage}`);
    }
  }
}
