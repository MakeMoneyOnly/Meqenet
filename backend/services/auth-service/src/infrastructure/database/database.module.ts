import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaService } from './prisma.service';

/**
 * Database Module for Meqenet.et Authentication Service
 *
 * Provides secure, NBE-compliant database access with:
 * - Prisma ORM integration with PostgreSQL
 * - Connection pooling optimized for Ethiopian infrastructure
 * - Comprehensive audit logging for NBE compliance
 * - Health monitoring and automatic reconnection
 * - SSL/TLS encryption for data in transit
 *
 * @author Financial Software Architect
 * @author Data Security Specialist
 */
@Module({
  imports: [ConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
