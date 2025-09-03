import { Test, TestingModule } from '@nestjs/testing';
import { randomBytes, createHash } from 'crypto';
import { vi } from 'vitest';

import { PasswordResetTokenService } from './password-reset-token.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

// Mock crypto functions
vi.mock('crypto', () => ({
  randomBytes: vi.fn(),
  createHash: vi.fn(),
}));

// Create mock PrismaService instance
const mockPrismaService = {
  passwordReset: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
  },
  $transaction: vi.fn(),
};

// Mock the PrismaService constructor
vi.mock('../../infrastructure/database/prisma.service', () => ({
  PrismaService: vi.fn().mockImplementation(() => mockPrismaService),
}));

describe('PasswordResetTokenService', () => {
  let service: PasswordResetTokenService;
  let prismaService: PrismaService;

  const mockRandomBytes = vi.mocked(randomBytes);
  const mockCreateHash = vi.mocked(createHash);

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Reset all mock implementations
    Object.keys(mockPrismaService.passwordReset).forEach(key => {
      if (typeof mockPrismaService.passwordReset[key] === 'function') {
        mockPrismaService.passwordReset[key].mockReset();
      }
    });

    // Setup crypto mocks
    mockRandomBytes.mockReturnValue({
      toString: vi.fn().mockReturnValue('mockedhexstring'),
    } as any);

    const mockHashInstance = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('hashedtoken'),
    };
    mockCreateHash.mockReturnValue(mockHashInstance as any);

    // Setup default Prisma mocks with proper mockResolvedValue
    mockPrismaService.passwordReset.create.mockResolvedValue({
      id: 'reset-123',
      userId: 'user-123',
      token: 'hashedtoken',
      hashedToken: 'hashedtoken',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      isUsed: false,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      createdAt: new Date(),
    });
    mockPrismaService.passwordReset.findFirst.mockResolvedValue(null);
    mockPrismaService.passwordReset.update.mockResolvedValue({ count: 1 });
    mockPrismaService.passwordReset.updateMany.mockResolvedValue({ count: 1 });
    mockPrismaService.passwordReset.delete.mockResolvedValue({ count: 1 });
    mockPrismaService.passwordReset.deleteMany.mockResolvedValue({ count: 5 });
    mockPrismaService.passwordReset.upsert.mockResolvedValue({
      id: 'reset-123',
      userId: 'user-123',
      token: 'hashedtoken',
      hashedToken: 'hashedtoken',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      isUsed: false,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      createdAt: new Date(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetTokenService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PasswordResetTokenService>(PasswordResetTokenService);

    // Manually set the prisma service on the service instance to ensure it works
    (service as any).prisma = mockPrismaService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateToken', () => {
    const userId = 'user-123';
    const ipAddress = '192.168.1.1';
    const userAgent = 'Mozilla/5.0';
    const expectedToken = 'mockedhexstring';
    const expectedHashedToken = 'hashedtoken';

    it('should generate a secure token successfully', async () => {
      const mockCreatedRecord = {
        id: 'reset-123',
        userId,
        token: expectedHashedToken,
        hashedToken: expectedHashedToken,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(),
      };

      mockPrismaService.passwordReset.create.mockResolvedValue(
        mockCreatedRecord
      );

      const result = await service.generateToken(userId, ipAddress, userAgent);

      expect(result).toEqual({
        userId,
        token: expectedToken,
        hashedToken: expectedHashedToken,
        expiresAt: expect.any(Date),
      });

      expect(mockRandomBytes).toHaveBeenCalledWith(32);
      expect(mockCreateHash).toHaveBeenCalledWith('sha256');
      expect(mockPrismaService.passwordReset.create).toHaveBeenCalledWith({
        data: {
          userId,
          token: expectedHashedToken,
          hashedToken: expectedHashedToken,
          ipAddress,
          userAgent,
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should generate token with default values when userAgent is undefined', async () => {
      const mockCreatedRecord = {
        id: 'reset-123',
        userId,
        token: expectedHashedToken,
        hashedToken: expectedHashedToken,
        ipAddress,
        userAgent: undefined,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(),
      };

      mockPrismaService.passwordReset.create.mockResolvedValue(
        mockCreatedRecord
      );

      const result = await service.generateToken(userId, ipAddress);

      expect(mockPrismaService.passwordReset.create).toHaveBeenCalledWith({
        data: {
          userId,
          token: expectedHashedToken,
          hashedToken: expectedHashedToken,
          ipAddress,
          userAgent: undefined,
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should set expiry time correctly (24 hours from now)', async () => {
      const beforeCall = new Date();
      const mockCreatedRecord = {
        id: 'reset-123',
        userId,
        token: expectedHashedToken,
        hashedToken: expectedHashedToken,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(),
      };

      mockPrismaService.passwordReset.create.mockResolvedValue(
        mockCreatedRecord
      );

      await service.generateToken(userId, ipAddress, userAgent);

      const callArgs = mockPrismaService.passwordReset.create.mock.calls[0][0];
      const expiresAt = callArgs.data.expiresAt;
      const afterCall = new Date();

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime() + 24 * 60 * 60 * 1000 - 1000
      );
      expect(expiresAt.getTime()).toBeLessThanOrEqual(
        afterCall.getTime() + 24 * 60 * 60 * 1000 + 1000
      );
    });

    it('should throw error when database operation fails', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.passwordReset.create.mockRejectedValue(dbError);

      await expect(
        service.generateToken(userId, ipAddress, userAgent)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('validateToken', () => {
    const plainToken = 'mockedhexstring';
    const hashedToken = 'hashedtoken';

    it('should validate a valid token successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        preferredLanguage: 'en',
      };

      const mockResetRecord = {
        id: 'reset-123',
        userId: 'user-123',
        token: hashedToken,
        hashedToken,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        isUsed: false,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        createdAt: new Date(),
        user: mockUser,
      };

      // Ensure the mock is set up for this specific test
      mockPrismaService.passwordReset.findFirst.mockResolvedValueOnce(
        mockResetRecord
      );

      const result = await service.validateToken(plainToken);

      expect(result).toEqual({
        userId: 'user-123',
        isValid: true,
      });

      expect(mockCreateHash).toHaveBeenCalledWith('sha256');
      expect(mockPrismaService.passwordReset.findFirst).toHaveBeenCalledWith({
        where: {
          hashedToken,
          isUsed: false,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
        include: {
          user: true,
        },
      });
    });

    it('should return invalid for expired token', async () => {
      const expiredResetRecord = {
        id: 'reset-123',
        userId: 'user-123',
        token: hashedToken,
        hashedToken,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        isUsed: false,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        createdAt: new Date(),
        user: { id: 'user-123', email: 'test@example.com' },
      };

      // Clear the default mock and set up specific mock for this test
      // Since the query filters out expired tokens, we should return null
      mockPrismaService.passwordReset.findFirst.mockReset();
      mockPrismaService.passwordReset.findFirst.mockResolvedValue(null);

      const result = await service.validateToken(plainToken);

      expect(result).toEqual({
        userId: '',
        isValid: false,
      });
    });

    it('should return invalid for used token', async () => {
      const usedResetRecord = {
        id: 'reset-123',
        userId: 'user-123',
        token: hashedToken,
        hashedToken,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        isUsed: true,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date(),
        usedAt: new Date(),
        user: { id: 'user-123', email: 'test@example.com' },
      };

      // Clear the default mock and set up specific mock for this test
      // Since the query filters out used tokens, we should return null
      mockPrismaService.passwordReset.findFirst.mockReset();
      mockPrismaService.passwordReset.findFirst.mockResolvedValue(null);

      const result = await service.validateToken(plainToken);

      expect(result).toEqual({
        userId: '',
        isValid: false,
      });
    });

    it('should return invalid for non-existent token', async () => {
      mockPrismaService.passwordReset.findFirst.mockResolvedValue(null);

      const result = await service.validateToken(plainToken);

      expect(result).toEqual({
        userId: '',
        isValid: false,
      });
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.passwordReset.findFirst.mockRejectedValue(dbError);

      const result = await service.validateToken(plainToken);

      expect(result).toEqual({
        userId: '',
        isValid: false,
      });
    });
  });

  describe('consumeToken', () => {
    const plainToken = 'mockedhexstring';
    const hashedToken = 'hashedtoken';

    it('should consume a valid token successfully', async () => {
      mockPrismaService.passwordReset.updateMany.mockResolvedValueOnce({
        count: 1,
      });

      const result = await service.consumeToken(plainToken);

      expect(result).toBe(true);
      expect(mockPrismaService.passwordReset.updateMany).toHaveBeenCalledWith({
        where: {
          hashedToken,
          isUsed: false,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
        data: {
          isUsed: true,
          usedAt: expect.any(Date),
        },
      });
    });

    it('should return false for invalid token', async () => {
      mockPrismaService.passwordReset.updateMany.mockResolvedValue({
        count: 0,
      });

      const result = await service.consumeToken(plainToken);

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.passwordReset.updateMany.mockRejectedValue(dbError);

      const result = await service.consumeToken(plainToken);

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup expired and used tokens successfully', async () => {
      mockPrismaService.passwordReset.deleteMany.mockResolvedValueOnce({
        count: 5,
      });

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(5);
      expect(mockPrismaService.passwordReset.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [{ expiresAt: { lt: expect.any(Date) } }, { isUsed: true }],
        },
      });
    });

    it('should return 0 when no tokens to cleanup', async () => {
      mockPrismaService.passwordReset.deleteMany.mockResolvedValue({
        count: 0,
      });

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.passwordReset.deleteMany.mockRejectedValue(dbError);

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(0);
    });
  });

  describe('hasActiveToken', () => {
    const userId = 'user-123';

    it('should return true when user has active token', async () => {
      const activeToken = {
        id: 'reset-123',
        userId,
        token: 'hashedtoken',
        hashedToken: 'hashedtoken',
        isUsed: false,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrismaService.passwordReset.findFirst.mockResolvedValueOnce(
        activeToken
      );

      const result = await service.hasActiveToken(userId);

      expect(result).toBe(true);
      expect(mockPrismaService.passwordReset.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          isUsed: false,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
      });
    });

    it('should return false when user has no active token', async () => {
      mockPrismaService.passwordReset.findFirst.mockResolvedValue(null);

      const result = await service.hasActiveToken(userId);

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.passwordReset.findFirst.mockRejectedValue(dbError);

      const result = await service.hasActiveToken(userId);

      expect(result).toBe(false);
    });
  });

  describe('hashToken', () => {
    it('should hash token using SHA-256', () => {
      const plainToken = 'testtoken';
      const expectedHash = 'hashedtoken';

      // Access private method through type assertion
      const result = (service as any).hashToken(plainToken);

      expect(result).toBe(expectedHash);
      expect(mockCreateHash).toHaveBeenCalledWith('sha256');
    });
  });

  describe('security features', () => {
    it('should use cryptographically secure random bytes', async () => {
      const mockCreatedRecord = {
        id: 'reset-123',
        userId: 'user-123',
        token: 'hashedtoken',
        hashedToken: 'hashedtoken',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(),
      };

      mockPrismaService.passwordReset.create.mockResolvedValue(
        mockCreatedRecord
      );

      await service.generateToken('user-123', '192.168.1.1');

      expect(mockRandomBytes).toHaveBeenCalledWith(32); // 32 bytes = 256 bits
    });

    it('should never store plain text tokens in database', async () => {
      const mockCreatedRecord = {
        id: 'reset-123',
        userId: 'user-123',
        token: 'hashedtoken',
        hashedToken: 'hashedtoken',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(),
      };

      mockPrismaService.passwordReset.create.mockResolvedValue(
        mockCreatedRecord
      );

      await service.generateToken('user-123', '192.168.1.1');

      const callArgs = mockPrismaService.passwordReset.create.mock.calls[0][0];
      expect(callArgs.data.token).toBe('hashedtoken'); // Should be hashed
      expect(callArgs.data.hashedToken).toBe('hashedtoken'); // Should be hashed
    });

    it('should enforce 24-hour token expiry', async () => {
      const beforeCall = new Date();
      const mockCreatedRecord = {
        id: 'reset-123',
        userId: 'user-123',
        token: 'hashedtoken',
        hashedToken: 'hashedtoken',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(),
      };

      mockPrismaService.passwordReset.create.mockResolvedValue(
        mockCreatedRecord
      );

      await service.generateToken('user-123', '192.168.1.1');

      const callArgs = mockPrismaService.passwordReset.create.mock.calls[0][0];
      const expiresAt = callArgs.data.expiresAt;

      // Check that expiry is approximately 24 hours from now
      const expectedExpiry = new Date(
        beforeCall.getTime() + 24 * 60 * 60 * 1000
      );
      const tolerance = 1000; // 1 second tolerance

      expect(
        Math.abs(expiresAt.getTime() - expectedExpiry.getTime())
      ).toBeLessThan(tolerance);
    });
  });
});
