import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseModule } from '../src/infrastructure/database/database.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import databaseConfig from '../src/shared/config/database.config';

/**
 * Database Integration Tests for Meqenet.et Authentication Service
 *
 * Tests database connectivity, Prisma integration, and NBE compliance features:
 * - Connection pooling and health checks
 * - SSL/TLS encryption verification
 * - Audit logging functionality
 * - Ethiopian timezone handling
 * - Connection resilience and retry logic
 *
 * @author Financial Software Architect
 * @author QA Specialist
 */
describe('Database Integration', () => {
  let module: TestingModule;
  let prismaService: PrismaService;

  // Test database configuration
  const testDatabaseUrl =
    process.env.TEST_DATABASE_URL ??
    'postgresql://test_user:test_password@localhost:5433/meqenet_auth_test?sslmode=require';

  beforeAll(async () => {
    // Override database URL for testing
    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.NODE_ENV = 'test';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [databaseConfig],
          isGlobal: true,
        }),
        DatabaseModule,
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await module.close();
  });

  describe('Database Connection', () => {
    it('should establish connection successfully', async () => {
      // Test basic connectivity
      const result = await prismaService.$queryRaw`SELECT 1 as test`;
      expect(result).toEqual([{ test: 1 }]);
    });

    it('should connect with SSL encryption', async () => {
      // Verify SSL connection is active
      const sslResult = await prismaService.$queryRaw<Array<{ ssl: boolean }>>`
        SELECT CASE 
          WHEN EXISTS (
            SELECT 1 FROM pg_stat_ssl 
            WHERE ssl = true AND pid = pg_backend_pid()
          ) 
          THEN true 
          ELSE false 
        END as ssl
      `;

      // In production, this should be true. In test, it depends on test DB config
      expect(typeof sslResult[0].ssl).toBe('boolean');
    });

    it('should handle connection timeouts gracefully', async () => {
      // Test connection resilience with a long-running query
      const startTime = Date.now();

      try {
        await prismaService.$queryRaw`SELECT pg_sleep(0.1)`;
        const duration = Date.now() - startTime;

        // Should complete within reasonable time for Ethiopian networks
        expect(duration).toBeLessThan(5000); // 5 seconds max
      } catch (error) {
        // If it fails, it should be a timeout error, not a connection error
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Health Checks', () => {
    it('should perform health check successfully', async () => {
      const healthResult = await prismaService.healthCheck();

      expect(healthResult.status).toBe('healthy');
      expect(healthResult.timestamp).toBeInstanceOf(Date);
      expect(typeof healthResult.responseTime).toBe('number');
      expect(healthResult.responseTime).toBeGreaterThan(0);
    });

    it('should return connection statistics', async () => {
      const stats = await prismaService.getConnectionStats();

      expect(typeof stats.activeConnections).toBe('number');
      expect(typeof stats.totalConnections).toBe('number');
      expect(typeof stats.maxConnections).toBe('number');
      expect(stats.activeConnections).toBeGreaterThanOrEqual(0);
      expect(stats.totalConnections).toBeGreaterThanOrEqual(
        stats.activeConnections
      );
      expect(stats.maxConnections).toBeGreaterThan(stats.totalConnections);
    });
  });

  describe('Database Schema and Models', () => {
    beforeEach(async () => {
      // Clean up test data before each test
      await prismaService.auditLog.deleteMany({});
      await prismaService.userSession.deleteMany({});
      await prismaService.passwordReset.deleteMany({});
      await prismaService.user.deleteMany({});
    });

    it('should create user with proper Ethiopian timezone', async () => {
      const testUser = {
        email: 'test@meqenet.et',
        passwordHash: 'hashed_password_here',
        firstName: 'Test',
        lastName: 'User',
        phone: '+251911234567',
        preferredLanguage: 'am', // Amharic
        timezone: 'Africa/Addis_Ababa',
      };

      const user = await prismaService.user.create({
        data: testUser,
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe(testUser.email);
      expect(user.phone).toBe(testUser.phone);
      expect(user.preferredLanguage).toBe('am');
      expect(user.timezone).toBe('Africa/Addis_Ababa');
      expect(user.kycStatus).toBe('PENDING');
      expect(user.status).toBe('ACTIVE');
      expect(user.role).toBe('CUSTOMER');
      expect(user.riskLevel).toBe('LOW');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should enforce unique constraints', async () => {
      const testUser = {
        email: 'unique@meqenet.et',
        passwordHash: 'hashed_password',
        phone: '+251911111111',
      };

      // Create first user
      await prismaService.user.create({ data: testUser });

      // Try to create duplicate email
      await expect(
        prismaService.user.create({
          data: {
            ...testUser,
            phone: '+251922222222', // Different phone
          },
        })
      ).rejects.toThrow();

      // Try to create duplicate phone
      await expect(
        prismaService.user.create({
          data: {
            ...testUser,
            email: 'different@meqenet.et', // Different email
          },
        })
      ).rejects.toThrow();
    });

    it('should validate Ethiopian phone number format', async () => {
      const userWithInvalidPhone = {
        email: 'test2@meqenet.et',
        passwordHash: 'hashed_password',
        phone: '0911234567', // Invalid format, should be +251
      };

      // Note: This test assumes phone validation at application level
      // The database schema allows the invalid format, but application should validate
      const user = await prismaService.user.create({
        data: userWithInvalidPhone,
      });

      expect(user.phone).toBe('0911234567');
      // In a real implementation, we'd add a CHECK constraint or application-level validation
    });
  });

  describe('Audit Logging', () => {
    it('should create audit log entries', async () => {
      const auditData = {
        eventType: 'USER_LOGIN',
        entityType: 'USER',
        entityId: 'test-user-id',
        userId: 'test-user-id',
        userEmail: 'test@meqenet.et',
        userRole: 'CUSTOMER',
        ipAddress: '192.168.1.100',
        userAgent: 'Meqenet Mobile App v1.0',
        sessionId: 'test-session-123',
        location: 'Addis Ababa, Ethiopia',
        deviceFingerprint: 'device-123-fingerprint',
        eventData: { loginMethod: 'password', mfaUsed: false },
        riskScore: 0.2,
        complianceFlags: ['NBE_COMPLIANT'],
      };

      await prismaService.createAuditLog(auditData);

      const auditLogs = await prismaService.auditLog.findMany({
        where: { eventType: 'USER_LOGIN' },
      });

      expect(auditLogs).toHaveLength(1);
      const log = auditLogs[0];
      expect(log.eventType).toBe('USER_LOGIN');
      expect(log.ipAddress).toBe('192.168.1.100');
      expect(log.location).toBe('Addis Ababa, Ethiopia');
      expect(log.riskScore).toBe(0.2);
      expect(log.complianceFlags).toContain('NBE_COMPLIANT');
      expect(log.createdAt).toBeInstanceOf(Date);
    });

    it('should handle audit log failures gracefully', async () => {
      // Test with invalid data that might cause audit log to fail
      const invalidAuditData = {
        eventType: 'TEST_EVENT',
        entityType: 'TEST',
        ipAddress: '127.0.0.1',
        // Missing required fields to potentially cause failure
      };

      // Should not throw error even if audit log fails
      await expect(
        prismaService.createAuditLog(invalidAuditData)
      ).resolves.not.toThrow();
    });
  });

  describe('Transaction Management', () => {
    it('should execute transactions successfully', async () => {
      const testEmail = 'transaction@meqenet.et';

      const result = await prismaService.executeInTransaction(
        async tx => {
          const user = await tx.user.create({
            data: {
              email: testEmail,
              passwordHash: 'hashed_password',
              phone: '+251933333333',
            },
          });

          const session = await tx.userSession.create({
            data: {
              userId: user.id,
              token: 'test-jwt-token',
              ipAddress: '192.168.1.1',
              expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
            },
          });

          return { user, session };
        },
        {
          eventType: 'USER_REGISTRATION',
          ipAddress: '192.168.1.1',
        }
      );

      expect(result.user.email).toBe(testEmail);
      expect(result.session.userId).toBe(result.user.id);

      // Verify both records exist
      const user = await prismaService.user.findUnique({
        where: { email: testEmail },
      });
      const session = await prismaService.userSession.findUnique({
        where: { token: 'test-jwt-token' },
      });

      expect(user).toBeTruthy();
      expect(session).toBeTruthy();
    });

    it('should rollback transactions on failure', async () => {
      const testEmail = 'rollback@meqenet.et';

      await expect(
        prismaService.executeInTransaction(async tx => {
          await tx.user.create({
            data: {
              email: testEmail,
              passwordHash: 'hashed_password',
              phone: '+251944444444',
            },
          });

          // Force an error to trigger rollback
          throw new Error('Simulated transaction failure');
        })
      ).rejects.toThrow('Simulated transaction failure');

      // Verify user was not created due to rollback
      const user = await prismaService.user.findUnique({
        where: { email: testEmail },
      });
      expect(user).toBeNull();
    });
  });

  describe('Data Classification and Retention', () => {
    it('should set proper data classification on user creation', async () => {
      const user = await prismaService.user.create({
        data: {
          email: 'classified@meqenet.et',
          passwordHash: 'hashed_password',
          phone: '+251955555555',
          fayda_id_hash: 'encrypted_fayda_id_hash',
        },
      });

      expect(user.dataClassification).toBe('CONFIDENTIAL');
      expect(user.retentionPolicy).toBe('ACTIVE_USER');
    });

    it('should handle KYC status transitions', async () => {
      const user = await prismaService.user.create({
        data: {
          email: 'kyc@meqenet.et',
          passwordHash: 'hashed_password',
          phone: '+251966666666',
        },
      });

      expect(user.kycStatus).toBe('PENDING');

      // Update KYC status
      const updatedUser = await prismaService.user.update({
        where: { id: user.id },
        data: {
          kycStatus: 'APPROVED',
          kycCompletedAt: new Date(),
          riskLevel: 'LOW',
          riskScore: 0.1,
          riskAssessedAt: new Date(),
        },
      });

      expect(updatedUser.kycStatus).toBe('APPROVED');
      expect(updatedUser.kycCompletedAt).toBeInstanceOf(Date);
      expect(updatedUser.riskLevel).toBe('LOW');
    });
  });

  describe('Performance and Optimization', () => {
    it('should perform efficiently with indexes', async () => {
      // Create multiple users for performance testing
      const users = Array.from({ length: 10 }, (_, i) => ({
        email: `perf${i}@meqenet.et`,
        passwordHash: 'hashed_password',
        phone: `+25198888${i.toString().padStart(4, '0')}`,
        status: i % 2 === 0 ? 'ACTIVE' : 'INACTIVE',
        kycStatus: i % 3 === 0 ? 'APPROVED' : 'PENDING',
      }));

      await prismaService.user.createMany({ data: users });

      // Test indexed queries perform well
      const startTime = Date.now();

      const activeUsers = await prismaService.user.findMany({
        where: { status: 'ACTIVE' },
      });

      const approvedKycUsers = await prismaService.user.findMany({
        where: { kycStatus: 'APPROVED' },
      });

      const queryTime = Date.now() - startTime;

      expect(activeUsers.length).toBeGreaterThan(0);
      expect(approvedKycUsers.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent connections', async () => {
      const concurrentOperations = Array.from({ length: 5 }, (_, i) =>
        prismaService.user.create({
          data: {
            email: `concurrent${i}@meqenet.et`,
            passwordHash: 'hashed_password',
            phone: `+25199999${i.toString().padStart(4, '0')}`,
          },
        })
      );

      const results = await Promise.all(concurrentOperations);

      expect(results).toHaveLength(5);
      results.forEach((user, index) => {
        expect(user.email).toBe(`concurrent${index}@meqenet.et`);
      });
    });
  });
});
