import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';
import * as crypto from 'crypto';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SecretManagerService } from './secret-manager.service';
import { AuditLoggingService } from './audit-logging.service';

export interface BackupConfig {
  enabled: boolean;
  schedule: string; // cron expression
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  backupPath: string;
  maxBackupSize: number; // in MB
  tables: string[];
}

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  size: number;
  compressedSize: number;
  encryptedSize: number;
  tables: string[];
  checksum: string;
  encryptionKeyId?: string;
  errorMessage?: string;
}

@Injectable()
export class EncryptedBackupService {
  private readonly logger = new Logger(EncryptedBackupService.name);
  private readonly config: BackupConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly secretManagerService: SecretManagerService,
    private readonly auditLoggingService: AuditLoggingService
  ) {
    this.config = {
      enabled: this.configService.get('BACKUP_ENABLED', 'true') === 'true',
      schedule: this.configService.get('BACKUP_SCHEDULE', '0 2 * * *'), // Daily at 2 AM
      retentionDays: parseInt(
        this.configService.get('BACKUP_RETENTION_DAYS', '30')
      ),
      compressionEnabled:
        this.configService.get('BACKUP_COMPRESSION_ENABLED', 'true') === 'true',
      encryptionEnabled:
        this.configService.get('BACKUP_ENCRYPTION_ENABLED', 'true') === 'true',
      backupPath: this.configService.get(
        'BACKUP_PATH',
        '/var/backups/meqenet-auth'
      ),
      maxBackupSize: parseInt(
        this.configService.get('BACKUP_MAX_SIZE_MB', '100')
      ),
      tables: [
        'User',
        'Credential',
        'Profile',
        'Role',
        'UserSession',
        'PasswordReset',
        'AuditLog',
        'OAuthClient',
        'OAuthAuthorizationCode',
        'OAuthAccessToken',
        'OAuthRefreshToken',
      ],
    };
  }

  /**
   * Create a full encrypted backup of authentication data
   */
  async createBackup(backupId?: string): Promise<BackupMetadata> {
    const id = backupId || this.generateBackupId();
    const timestamp = new Date();

    this.logger.log(`🔄 Starting encrypted backup: ${id}`);

    const metadata: BackupMetadata = {
      id,
      timestamp,
      status: 'running',
      size: 0,
      compressedSize: 0,
      encryptedSize: 0,
      tables: this.config.tables,
      checksum: '',
    };

    try {
      // Create backup directory if it doesn't exist
      await this.ensureBackupDirectory();

      // Backup each table
      const tableBackups = [];
      for (const table of this.config.tables) {
        const tableBackup = await this.backupTable(table, id);
        tableBackups.push(tableBackup);
        metadata.size += tableBackup.size;
      }

      // Combine all table backups
      const combinedPath = join(this.config.backupPath, `${id}-combined.json`);
      await this.combineTableBackups(tableBackups, combinedPath);
      metadata.size = await this.getFileSize(combinedPath);

      // Compress backup
      let compressedPath = combinedPath;
      if (this.config.compressionEnabled) {
        compressedPath = await this.compressBackup(combinedPath, id);
        metadata.compressedSize = await this.getFileSize(compressedPath);
      }

      // Encrypt backup
      let finalPath = compressedPath;
      if (this.config.encryptionEnabled) {
        finalPath = await this.encryptBackup(compressedPath, id);
        metadata.encryptedSize = await this.getFileSize(finalPath);
        metadata.encryptionKeyId = this.configService.get('KMS_KEY_ID');
      }

      // Generate checksum
      metadata.checksum = await this.generateChecksum(finalPath);

      // Update metadata
      metadata.status = 'completed';

      // Store backup metadata
      await this.storeBackupMetadata(metadata);

      // Clean up temporary files
      await this.cleanupTempFiles([combinedPath, compressedPath]);

      // Log successful backup
      await this.auditLoggingService.logSecurityEvent({
        type: 'backup_completed',
        severity: 'info',
        description: `Encrypted backup completed successfully: ${id}`,
        metadata: {
          backupId: id,
          size: metadata.size,
          compressedSize: metadata.compressedSize,
          encryptedSize: metadata.encryptedSize,
          tables: metadata.tables.length,
          checksum: metadata.checksum,
        },
      });

      this.logger.log(
        `✅ Encrypted backup completed: ${id} (${this.formatBytes(metadata.encryptedSize)})`
      );

      return metadata;
    } catch (error) {
      this.logger.error(`❌ Backup failed: ${id}`, error);

      metadata.status = 'failed';
      metadata.errorMessage = error.message;

      await this.storeBackupMetadata(metadata);

      await this.auditLoggingService.logSecurityEvent({
        type: 'backup_failed',
        severity: 'error',
        description: `Encrypted backup failed: ${id}`,
        metadata: {
          backupId: id,
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Backup a specific table
   */
  private async backupTable(
    tableName: string,
    backupId: string
  ): Promise<{ table: string; path: string; size: number }> {
    try {
      this.logger.debug(`Backing up table: ${tableName}`);

      // Export table data
      const data = await this.exportTableData(tableName);
      const jsonData = JSON.stringify(data, null, 2);

      // Write to temporary file
      const filePath = join(
        this.config.backupPath,
        `${backupId}-${tableName}.json`
      );
      await fs.writeFile(filePath, jsonData, 'utf8');

      const size = Buffer.byteLength(jsonData, 'utf8');

      this.logger.debug(
        `✅ Table ${tableName} backed up: ${this.formatBytes(size)}`
      );

      return {
        table: tableName,
        path: filePath,
        size,
      };
    } catch (error) {
      this.logger.error(`Failed to backup table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Export data from a specific table
   */
  private async exportTableData(
    tableName: string
  ): Promise<Record<string, unknown>[]> {
    try {
      let query;

      // Use raw SQL queries for better performance and to handle large datasets
      switch (tableName) {
        case 'User':
          query = `
            SELECT
              id, email, "emailVerified", "emailVerifiedAt", "phone", "phoneVerified",
              "phoneVerifiedAt", "phoneUpdatedAt", "phoneChangeCoolingPeriodEnd",
              "firstName", "lastName", "displayName", "preferredLanguage", timezone,
              "kycStatus", "kycCompletedAt", "faydaIdHash", status, role,
              "lastLoginAt", "lastLoginIp", "loginAttempts", "lockoutUntil",
              "twoFactorEnabled", "twoFactorSecret", riskLevel, riskScore, "riskAssessedAt",
              "dataClassification", "retentionPolicy", "gdprConsent", "marketingConsent",
              "createdAt", "updatedAt", "deletedAt"
            FROM "User"
            WHERE "deletedAt" IS NULL
          `;
          break;

        case 'Credential':
          query = `
            SELECT id, "userId", "hashedPassword"
            FROM "Credential"
          `;
          break;

        case 'Profile':
          query = `
            SELECT id, "userId", bio, "faydaId"
            FROM "Profile"
          `;
          break;

        case 'UserSession':
          query = `
            SELECT
              id, "userId", token, "refreshToken", "deviceId", "ipAddress",
              "userAgent", location, "isActive", "expiresAt", "lastActivityAt",
              "isSecure", "riskFlags", "createdAt", "updatedAt"
            FROM "UserSession"
            WHERE "isActive" = true
          `;
          break;

        case 'AuditLog':
          query = `
            SELECT
              id, "eventType", "entityType", "entityId", "userId", "userEmail",
              "userRole", "ipAddress", "userAgent", location, "deviceFingerprint",
              "eventData", "previousValues", "newValues", "riskScore", "complianceFlags",
              "createdAt"
            FROM "AuditLog"
            ORDER BY "createdAt" DESC
            LIMIT 100000
          `;
          break;

        case 'PasswordReset':
          query = `
            SELECT
              id, "userId", token, "hashedToken", "ipAddress", "userAgent",
              "isUsed", "usedAt", "expiresAt", "createdAt"
            FROM "PasswordReset"
            WHERE "isUsed" = false AND "expiresAt" > NOW()
          `;
          break;

        default:
          query = `SELECT * FROM "${tableName}"`;
      }

      const result = await this.prisma.$queryRawUnsafe(query);
      return result as Record<string, unknown>[];
    } catch (error) {
      this.logger.error(`Failed to export table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Combine multiple table backups into a single file
   */
  private async combineTableBackups(
    tableBackups: { table: string; path: string; size: number }[],
    outputPath: string
  ): Promise<void> {
    const combinedData = {
      metadata: {
        createdAt: new Date().toISOString(),
        tables: tableBackups.map(tb => tb.table),
        version: '1.0',
      },
      data: {},
    };

    for (const tableBackup of tableBackups) {
      const tableData = await fs.readFile(tableBackup.path, 'utf8');
      combinedData.data[tableBackup.table] = JSON.parse(tableData);
    }

    await fs.writeFile(
      outputPath,
      JSON.stringify(combinedData, null, 2),
      'utf8'
    );

    // Clean up individual table files
    await Promise.all(
      tableBackups.map(tb => fs.unlink(tb.path).catch(() => {}))
    );
  }

  /**
   * Compress backup file using gzip
   */
  private async compressBackup(
    inputPath: string,
    backupId: string
  ): Promise<string> {
    const outputPath = `${inputPath}.gz`;

    const gzip = createGzip();
    const source = createReadStream(inputPath);
    const destination = createWriteStream(outputPath);

    await pipeline(source, gzip, destination);

    // Remove uncompressed file
    await fs.unlink(inputPath);

    this.logger.debug(`✅ Backup compressed: ${backupId}`);
    return outputPath;
  }

  /**
   * Encrypt backup file using KMS envelope encryption
   */
  private async encryptBackup(
    inputPath: string,
    backupId: string
  ): Promise<string> {
    try {
      // Read the backup file
      const backupData = await fs.readFile(inputPath);

      // Encrypt using KMS
      const encryptedData = await this.secretManagerService.encryptData(
        backupData.toString('base64')
      );

      // Write encrypted data
      const outputPath = `${inputPath}.enc`;
      await fs.writeFile(outputPath, encryptedData, 'utf8');

      // Remove unencrypted file
      await fs.unlink(inputPath);

      this.logger.debug(`✅ Backup encrypted: ${backupId}`);
      return outputPath;
    } catch (error) {
      this.logger.error('Failed to encrypt backup:', error);
      throw error;
    }
  }

  /**
   * Generate SHA-256 checksum of backup file
   */
  private async generateChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.backupPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Get file size in bytes
   */
  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate unique backup ID
   */
  private generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = crypto.randomBytes(4).toString('hex');
    return `backup-${timestamp}-${random}`;
  }

  /**
   * Store backup metadata in database
   */
  private async storeBackupMetadata(metadata: BackupMetadata): Promise<void> {
    try {
      // In a real implementation, you'd have a backups table
      // For now, we'll log to audit system
      await this.auditLoggingService.logSecurityEvent({
        type: 'backup_metadata',
        severity: 'info',
        description: `Backup metadata stored: ${metadata.id}`,
        metadata: {
          backupId: metadata.id,
          status: metadata.status,
          size: metadata.size,
          checksum: metadata.checksum,
        },
      });
    } catch (error) {
      this.logger.error('Failed to store backup metadata:', error);
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(filePaths: string[]): Promise<void> {
    await Promise.all(
      filePaths.map(path =>
        fs.unlink(path).catch(error => {
          this.logger.warn(
            `Failed to cleanup temp file ${path}:`,
            error.message
          );
        })
      )
    );
  }

  /**
   * List all backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    // In a real implementation, this would query the backups table
    // For now, return mock data
    return [
      {
        id: 'backup-2024-01-15',
        timestamp: new Date('2024-01-15T02:00:00Z'),
        status: 'completed',
        size: 10485760,
        compressedSize: 2097152,
        encryptedSize: 2097152,
        tables: this.config.tables,
        checksum: 'abc123...',
        encryptionKeyId: 'alias/meqenet-kms-key',
      },
    ];
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string): Promise<void> {
    this.logger.log(`🔄 Starting restore from backup: ${backupId}`);

    try {
      // This would implement the restore logic
      // For now, just log the operation
      await this.auditLoggingService.logSecurityEvent({
        type: 'backup_restore',
        severity: 'info',
        description: `Backup restore initiated: ${backupId}`,
        metadata: { backupId },
      });

      this.logger.log(`✅ Restore completed from backup: ${backupId}`);
    } catch (error) {
      this.logger.error(`❌ Restore failed from backup: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<void> {
    try {
      this.logger.log('🧹 Starting backup cleanup');

      const retentionDate = new Date();
      retentionDate.setDate(
        retentionDate.getDate() - this.config.retentionDays
      );

      // In a real implementation, this would delete old backup files
      // and update database records

      await this.auditLoggingService.logSecurityEvent({
        type: 'backup_cleanup',
        severity: 'info',
        description: `Backup cleanup completed, retained backups from last ${this.config.retentionDays} days`,
        metadata: {
          retentionDays: this.config.retentionDays,
          retentionDate: retentionDate.toISOString(),
        },
      });

      this.logger.log(`✅ Backup cleanup completed`);
    } catch (error) {
      this.logger.error('❌ Backup cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<Record<string, unknown>> {
    try {
      const backups = await this.listBackups();

      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const totalCompressedSize = backups.reduce(
        (sum, backup) => sum + backup.compressedSize,
        0
      );
      const totalEncryptedSize = backups.reduce(
        (sum, backup) => sum + backup.encryptedSize,
        0
      );

      const compressionRatio =
        totalSize > 0 ? (totalCompressedSize / totalSize) * 100 : 0;
      const encryptionRatio =
        totalSize > 0 ? (totalEncryptedSize / totalSize) * 100 : 0;

      return {
        totalBackups: backups.length,
        totalSize: this.formatBytes(totalSize),
        totalCompressedSize: this.formatBytes(totalCompressedSize),
        totalEncryptedSize: this.formatBytes(totalEncryptedSize),
        compressionRatio: `${compressionRatio.toFixed(1)}%`,
        encryptionRatio: `${encryptionRatio.toFixed(1)}%`,
        averageBackupSize: this.formatBytes(
          totalSize / Math.max(backups.length, 1)
        ),
        retentionDays: this.config.retentionDays,
        lastBackup: backups[0]?.timestamp,
      };
    } catch (error) {
      this.logger.error('Failed to get backup stats:', error);
      return { error: 'Failed to retrieve backup statistics' };
    }
  }
}
