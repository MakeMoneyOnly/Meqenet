import { Injectable, NotFoundException, ConflictException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMerchantDto } from '../dto/create-merchant.dto';
import { UpdateMerchantDto } from '../dto/update-merchant.dto';
import { Merchant, MerchantStatus } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class MerchantsService {
  private readonly logger = new Logger(MerchantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createMerchantDto: CreateMerchantDto): Promise<Merchant> {
    try {
      // Check if merchant with same email or phone exists
      const existingMerchant = await this.prisma.merchant.findFirst({
        where: {
          OR: [
            { email: createMerchantDto.email },
            { phoneNumber: createMerchantDto.phoneNumber },
          ],
        },
      });

      if (existingMerchant) {
        throw new ConflictException('Merchant with this email or phone number already exists');
      }

      // Create merchant
      const merchant = await this.prisma.merchant.create({
        data: {
          ...createMerchantDto,
          status: MerchantStatus.PENDING,
        },
      });

      this.logger.log(`Created new merchant: ${merchant.id} - ${merchant.name}`);
      return merchant;
    } catch (error) {
      this.logger.error(`Error creating merchant: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(status?: MerchantStatus): Promise<Merchant[]> {
    try {
      const where = status ? { status } : {};
      return this.prisma.merchant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error finding merchants: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<Merchant> {
    try {
      const merchant = await this.prisma.merchant.findUnique({
        where: { id },
      });

      if (!merchant) {
        throw new NotFoundException(`Merchant with ID ${id} not found`);
      }

      return merchant;
    } catch (error) {
      this.logger.error(`Error finding merchant ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<Merchant | null> {
    try {
      return this.prisma.merchant.findUnique({
        where: { email },
      });
    } catch (error) {
      this.logger.error(`Error finding merchant by email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateMerchantDto: UpdateMerchantDto): Promise<Merchant> {
    try {
      const merchant = await this.findById(id);

      // Check if email or phone is being updated and if it's already in use
      if (updateMerchantDto.email && updateMerchantDto.email !== merchant.email) {
        const existingMerchantWithEmail = await this.prisma.merchant.findUnique({
          where: { email: updateMerchantDto.email },
        });

        if (existingMerchantWithEmail) {
          throw new ConflictException('Email already in use by another merchant');
        }
      }

      if (updateMerchantDto.phoneNumber && updateMerchantDto.phoneNumber !== merchant.phoneNumber) {
        const existingMerchantWithPhone = await this.prisma.merchant.findUnique({
          where: { phoneNumber: updateMerchantDto.phoneNumber },
        });

        if (existingMerchantWithPhone) {
          throw new ConflictException('Phone number already in use by another merchant');
        }
      }

      // Update merchant
      const updatedMerchant = await this.prisma.merchant.update({
        where: { id },
        data: updateMerchantDto,
      });

      this.logger.log(`Updated merchant: ${id}`);
      return updatedMerchant;
    } catch (error) {
      this.logger.error(`Error updating merchant ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateStatus(id: string, status: MerchantStatus): Promise<Merchant> {
    try {
      await this.findById(id);

      const updatedMerchant = await this.prisma.merchant.update({
        where: { id },
        data: { status },
      });

      this.logger.log(`Updated merchant ${id} status to ${status}`);
      return updatedMerchant;
    } catch (error) {
      this.logger.error(`Error updating merchant status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async generateApiKey(
    merchantId: string,
    name: string,
    isLive: boolean = false,
    expiresInDays?: number
  ): Promise<{ key: string; secret: string }> {
    try {
      const merchant = await this.findById(merchantId);

      // Check merchant status
      if (merchant.status !== MerchantStatus.ACTIVE) {
        throw new ForbiddenException('Cannot generate API key for inactive merchant');
      }

      // Generate API key with prefix for environment and merchant identifier
      // Format: {env}_{merchant-prefix}_{random}
      const merchantPrefix = merchant.name.substring(0, 3).toLowerCase().replace(/[^a-z0-9]/g, '');
      const key = `${isLive ? 'live' : 'test'}_${merchantPrefix}_${this.generateRandomString(24)}`;

      // Generate a strong random secret
      const secret = this.generateRandomString(32);
      const secretHash = this.hashSecret(secret);

      // Calculate expiration date if provided
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      // Store in database with additional security metadata
      await this.prisma.merchantApiKey.create({
        data: {
          merchantId,
          name,
          key,
          secret: secretHash, // Store hashed secret
          isActive: true,
          expiresAt,
          createdAt: new Date(),
        },
      });

      // Log for audit trail
      this.logger.log(`Generated new ${isLive ? 'LIVE' : 'TEST'} API key for merchant ${merchantId}`);

      // Return plain secret to show to merchant once
      // This is the only time the plain secret will be available
      return {
        key,
        secret
      };
    } catch (error) {
      this.logger.error(`Error generating API key: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateApiKey(key: string, secret: string): Promise<Merchant | null> {
    try {
      // Find API key with merchant data
      const apiKey = await this.prisma.merchantApiKey.findUnique({
        where: { key },
        include: { merchant: true },
      });

      // Check if API key exists and is active
      if (!apiKey) {
        this.logger.warn(`API key not found: ${key}`);
        return null;
      }

      if (!apiKey.isActive) {
        this.logger.warn(`Inactive API key used: ${key}`);
        return null;
      }

      // Check if API key has expired
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        this.logger.warn(`Expired API key used: ${key}, expired at ${apiKey.expiresAt}`);

        // Automatically deactivate expired keys
        await this.prisma.merchantApiKey.update({
          where: { id: apiKey.id },
          data: { isActive: false },
        });

        return null;
      }

      // Verify secret using constant-time comparison to prevent timing attacks
      const secretHash = this.hashSecret(secret);
      if (!this.secureCompare(secretHash, apiKey.secret)) {
        this.logger.warn(`Invalid secret provided for API key: ${key}`);

        // Record failed attempt (in production, would track for brute force prevention)
        // await this.recordFailedAttempt(key);

        return null;
      }

      // Update last used timestamp and usage count
      await this.prisma.merchantApiKey.update({
        where: { id: apiKey.id },
        data: {
          lastUsedAt: new Date(),
          // In a real implementation, we would also track usage count
          // usageCount: { increment: 1 }
        },
      });

      // Check merchant status
      if (apiKey.merchant.status !== MerchantStatus.ACTIVE) {
        this.logger.warn(`API key used for inactive merchant: ${apiKey.merchant.id}`);
        return null;
      }

      return apiKey.merchant;
    } catch (error) {
      this.logger.error(`Error validating API key: ${error.message}`, error.stack);
      return null;
    }
  }

  // Constant-time comparison to prevent timing attacks
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  private generateRandomString(length: number): string {
    return randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  private hashSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }
}
