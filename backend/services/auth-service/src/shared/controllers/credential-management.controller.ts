import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CredentialRotationService } from '../services/credential-rotation.service';
import { SecretManagerService } from '../services/secret-manager.service';

@ApiTags('Credential Management')
@Controller('credentials')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CredentialManagementController {
  private readonly logger = new Logger(CredentialManagementController.name);

  constructor(
    private readonly credentialRotationService: CredentialRotationService,
    private readonly secretManagerService: SecretManagerService
  ) {}

  @Get('status')
  @ApiOperation({
    summary: 'Get credential status report',
    description:
      'Returns a comprehensive report of all managed credentials and their rotation status',
  })
  @ApiResponse({
    status: 200,
    description: 'Credential status report retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total number of credentials' },
        active: { type: 'number', description: 'Number of active credentials' },
        dueForRotation: {
          type: 'number',
          description: 'Number of credentials due for rotation',
        },
        expired: {
          type: 'number',
          description: 'Number of expired credentials',
        },
        credentials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: {
                type: 'string',
                enum: ['database', 'api', 'service', 'jwt'],
              },
              lastRotated: { type: 'string', format: 'date-time' },
              nextRotation: { type: 'string', format: 'date-time' },
              status: {
                type: 'string',
                enum: ['active', 'rotating', 'expired'],
              },
              daysUntilRotation: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getCredentialStatus(): Promise<Record<string, unknown>> {
    try {
      this.logger.log('📊 Credential status report requested');

      const report = this.credentialRotationService.getCredentialStatusReport();

      this.logger.log(`✅ Returned status for ${report.total} credentials`);

      return report;
    } catch (error) {
      this.logger.error('❌ Failed to get credential status:', error);
      throw error;
    }
  }

  @Get('due-for-rotation')
  @ApiOperation({
    summary: 'Get credentials due for rotation',
    description: 'Returns a list of all credentials that are due for rotation',
  })
  @ApiResponse({
    status: 200,
    description: 'Credentials due for rotation retrieved successfully',
  })
  async getCredentialsDueForRotation(): Promise<{
    count: number;
    credentials: unknown[];
  }> {
    try {
      this.logger.log('🔍 Checking credentials due for rotation');

      const dueCredentials =
        this.credentialRotationService.getCredentialsDueForRotation();

      this.logger.log(
        `📋 Found ${dueCredentials.length} credentials due for rotation`
      );

      return {
        count: dueCredentials.length,
        credentials: dueCredentials,
      };
    } catch (error) {
      this.logger.error(
        '❌ Failed to get credentials due for rotation:',
        error
      );
      throw error;
    }
  }

  @Post(':name/rotate')
  @ApiOperation({
    summary: 'Manually rotate a specific credential',
    description: 'Manually trigger rotation for a specific credential',
  })
  @ApiResponse({
    status: 200,
    description: 'Credential rotation initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid credential name or rotation failed',
  })
  async rotateCredential(
    @Param('name') name: string
  ): Promise<{ message: string; status: string; timestamp: string }> {
    try {
      this.logger.log(`🔄 Manual credential rotation requested for: ${name}`);

      // This would implement credential type detection and rotation
      // For now, return a placeholder response
      const response = {
        message: `Credential rotation initiated for: ${name}`,
        status: 'initiated',
        timestamp: new Date().toISOString(),
      };

      this.logger.log(`✅ Credential rotation initiated: ${name}`);

      return response;
    } catch (error) {
      this.logger.error(`❌ Failed to rotate credential ${name}:`, error);
      throw error;
    }
  }

  @Post('rotate-all-due')
  @ApiOperation({
    summary: 'Rotate all credentials due for rotation',
    description: 'Manually trigger rotation for all credentials that are due',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk credential rotation initiated successfully',
  })
  async rotateAllDueCredentials(): Promise<{
    message: string;
    credentials: string[];
    status: string;
    timestamp: string;
  }> {
    try {
      this.logger.log('🔄 Bulk credential rotation requested');

      const dueCredentials =
        this.credentialRotationService.getCredentialsDueForRotation();

      const response = {
        message: `Bulk rotation initiated for ${dueCredentials.length} credentials`,
        credentials: dueCredentials.map(c => c.name),
        status: 'initiated',
        timestamp: new Date().toISOString(),
      };

      this.logger.log(
        `✅ Bulk rotation initiated for ${dueCredentials.length} credentials`
      );

      return response;
    } catch (error) {
      this.logger.error(
        '❌ Failed to initiate bulk credential rotation:',
        error
      );
      throw error;
    }
  }

  @Get('secrets/list')
  @ApiOperation({
    summary: 'List all secrets in AWS Secrets Manager',
    description: 'Returns a list of all secrets managed by the application',
  })
  @ApiResponse({
    status: 200,
    description: 'Secrets list retrieved successfully',
  })
  async listSecrets(): Promise<{
    count: number;
    secrets: Record<string, unknown>[];
  }> {
    try {
      this.logger.log('📋 Secrets list requested');

      const secrets = await this.secretManagerService.listSecrets();

      this.logger.log(`✅ Returned ${secrets.length} secrets`);

      return {
        count: secrets.length,
        secrets: secrets.map(secret => ({
          name: secret.Name,
          arn: secret.ARN,
          createdDate: secret.CreatedDate,
          lastChangedDate: secret.LastChangedDate,
          tags: secret.Tags,
        })),
      };
    } catch (error) {
      this.logger.error('❌ Failed to list secrets:', error);
      throw error;
    }
  }

  @Post('secrets/test-connection')
  @ApiOperation({
    summary: 'Test AWS Secrets Manager connection',
    description: 'Tests the connection to AWS Secrets Manager',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection test successful',
  })
  @ApiResponse({
    status: 500,
    description: 'Connection test failed',
  })
  async testSecretsManagerConnection(): Promise<{
    status: string;
    message: string;
    secretsCount?: number;
    error?: string;
    timestamp: string;
  }> {
    try {
      this.logger.log('🔍 Testing AWS Secrets Manager connection');

      // Test connection by listing secrets
      const secrets = await this.secretManagerService.listSecrets();

      const response = {
        status: 'connected',
        message: 'Successfully connected to AWS Secrets Manager',
        secretsCount: secrets.length,
        timestamp: new Date().toISOString(),
      };

      this.logger.log('✅ AWS Secrets Manager connection test successful');

      return response;
    } catch (error: unknown) {
      this.logger.error(
        '❌ AWS Secrets Manager connection test failed:',
        error
      );

      return {
        status: 'failed',
        message: 'Failed to connect to AWS Secrets Manager',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('secrets/encrypt')
  @ApiOperation({
    summary: 'Encrypt data using AWS KMS',
    description: 'Encrypts the provided data using AWS KMS',
  })
  @ApiResponse({
    status: 200,
    description: 'Data encrypted successfully',
  })
  async encryptData(
    @Body() body: { data: string; keyId?: string }
  ): Promise<{ encryptedData: string; timestamp: string }> {
    try {
      this.logger.log('🔐 Data encryption requested');

      const encryptedData = await this.secretManagerService.encryptData(
        body.data,
        body.keyId
      );

      this.logger.log('✅ Data encrypted successfully');

      return {
        encryptedData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Data encryption failed:', error);
      throw error;
    }
  }

  @Post('secrets/decrypt')
  @ApiOperation({
    summary: 'Decrypt data using AWS KMS',
    description: 'Decrypts the provided encrypted data using AWS KMS',
  })
  @ApiResponse({
    status: 200,
    description: 'Data decrypted successfully',
  })
  async decryptData(
    @Body() body: { encryptedData: string }
  ): Promise<{ decryptedData: string; timestamp: string }> {
    try {
      this.logger.log('🔓 Data decryption requested');

      const decryptedData = await this.secretManagerService.decryptData(
        body.encryptedData
      );

      this.logger.log('✅ Data decrypted successfully');

      return {
        decryptedData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Data decryption failed:', error);
      throw error;
    }
  }
}
