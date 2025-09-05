import { Test, TestingModule } from '@nestjs/testing';
import { randomBytes, createHash } from 'crypto';
import { vi } from 'vitest';

import { PasswordResetTokenService } from './password-reset-token.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

// Test constants - using descriptive values for cryptographic standards
const TOKEN_LENGTH_BYTES = 256 / 8; // 256 bits = 32 bytes for secure token generation
const TOKEN_EXPIRY_HOURS = 24; // 24 hours = 1 day standard expiry
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

// Mock crypto functions
vi.mock('crypto', () => ({
  randomBytes: vi.fn(),
  createHash: vi.fn(),
}));

// Create mock PrismaService instance
const _mockPrismaService = {
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
  PrismaService: vi.fn().mockImplementation(() => _mockPrismaService),
}));

describe('PasswordResetTokenService', () => {
  let service: PasswordResetTokenService;
  let _prismaService: PrismaService;

  const mockRandomBytes = vi.mocked(randomBytes);
  const mockCreateHash = vi.mocked(createHash);

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Reset all mock implementations
    Object.keys(_mockPrismaService.passwordReset).forEach(key => {
      if (typeof _mockPrismaService.passwordReset[key] === 'function') {
        _mockPrismaService.passwordReset[key].mockReset();
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
    _mockPrismaService.passwordReset.create.mockResolvedValue({
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
    _mockPrismaService.passwordReset.findFirst.mockResolvedValue(null);
    _mockPrismaService.passwordReset.update.mockResolvedValue({ count: 1 });
    _mockPrismaService.passwordReset.updateMany.mockResolvedValue({ count: 1 });
    _mockPrismaService.passwordReset.delete.mockResolvedValue({ count: 1 });
    _mockPrismaService.passwordReset.deleteMany.mockResolvedValue({ count: 5 });
    _mockPrismaService.passwordReset.upsert.mockResolvedValue({
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
          useValue: _mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PasswordResetTokenService>(PasswordResetTokenService);

    // Manually set the prisma service on the service instance to ensure it works
    (service as any).prisma = _mockPrismaService;
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
        expiresAt: new Date(
          Date.now() +
            TOKEN_EXPIRY_HOURS *
              MINUTES_PER_HOUR *
              SECONDS_PER_MINUTE *
              MILLISECONDS_PER_SECOND
        ),
        isUsed: false,
        createdAt: new Date(),
      };

      _mockPrismaService.passwordReset.create.mockResolvedValue(
        mockCreatedRecord
      );

      const generateResult = await service.generateToken(
        userId,
        ipAddress,
        userAgent
      );

      expect(generateResult).toEqual({
        userId,
        token: expectedToken,
        hashedToken: expectedHashedToken,
        expiresAt: expect.any(Date),
      });

      expect(mockRandomBytes).toHaveBeenCalledWith(TOKEN_LENGTH_BYTES);
      expect(mockCreateHash).toHaveBeenCalledWith('sha256');
      expect(_mockPrismaService.passwordReset.create).toHaveBeenCalledWith({
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
        userAgent: null,
        expiresAt: new Date(
          Date.now() +
            TOKEN_EXPIRY_HOURS *
              MINUTES_PER_HOUR *
              SECONDS_PER_MINUTE *
              MILLISECONDS_PER_SECOND
        ),
        isUsed: false,
        createdAt: new Date(),
      };

      _mockPrismaService.passwordReset.create.mockResolvedValue(
        mockCreatedRecord
      );

      const _result = await service.generateToken(userId, ipAddress);

      expect(_mockPrismaService.passwordReset.create).toHaveBeenCalledWith({
        data: {
          userId,
          token: expectedHashedToken,
          hashedToken: expectedHashedToken,
          ipAddress,
          userAgent: null,
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
        expiresAt: new Date(
          Date.now() +
            TOKEN_EXPIRY_HOURS *
              MINUTES_PER_HOUR *
              SECONDS_PER_MINUTE *
              MILLISECONDS_PER_SECOND
        ),
        isUsed: false,
        createdAt: new Date(),
      };

      _mockPrismaService.passwordReset.create.mockResolvedValue(
        mockCreatedRecord
      );

      await service.generateToken(userId, ipAddress, userAgent);

      const callArgs = _mockPrismaService.passwordReset.create.mock.calls[0][0];
      const expiresAt = callArgs.data.expiresAt;
      const afterCall = new Date();

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime() +
          TOKEN_EXPIRY_HOURS *
            MINUTES_PER_HOUR *
            SECONDS_PER_MINUTE *
            MILLISECONDS_PER_SECOND -
          1000
      );
      expect(expiresAt.getTime()).toBeLessThanOrEqual(
        afterCall.getTime() +
          TOKEN_EXPIRY_HOURS *
            MINUTES_PER_HOUR *
            SECONDS_PER_MINUTE *
            MILLISECONDS_PER_SECOND +
          1000
      );
    });

    it('should throw error when database operation fails', async () => {
      const dbError = new Error('Database connection failed');
      _mockPrismaService.passwordReset.create.mockRejectedValue(dbError);

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
      _mockPrismaService.passwordReset.findFirst.mockResolvedValueOnce(
        mockResetRecord
      );

      const result = await service.validateToken(plainToken);

      expect(result).toEqual({
        userId: 'user-123',
        isValid: true,
      });

      expect(mockCreateHash).toHaveBeenCalledWith('sha256');
      expect(_mockPrismaService.passwordReset.findFirst).toHaveBeenCalledWith({
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
      const _expiredResetRecord = {
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
      _mockPrismaService.passwordReset.findFirst.mockReset();
      _mockPrismaService.passwordReset.findFirst.mockResolvedValue(null);

      const result = await service.validateToken(plainToken);

      expect(result).toEqual({
        userId: '',
        isValid: false,
      });
    });

    it('should return invalid for used token', async () => {
      const _usedResetRecord = {
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
      _mockPrismaService.passwordReset.findFirst.mockReset();
      _mockPrismaService.passwordReset.findFirst.mockResolvedValue(null);

      const result = await service.validateToken(plainToken);

      expect(result).toEqual({
        userId: '',
        isValid: false,
      });
    });

    it('should return invalid for non-existent token', async () => {
      _mockPrismaService.passwordReset.findFirst.mockResolvedValue(null);

      const result = await service.validateToken(plainToken);

      expect(result).toEqual({
        userId: '',
        isValid: false,
      });
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      _mockPrismaService.passwordReset.findFirst.mockRejectedValue(dbError);

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
      _mockPrismaService.passwordReset.updateMany.mockResolvedValueOnce({
        count: 1,
      });

      const result = await service.consumeToken(plainToken);

      expect(result).toBe(true);
      expect(_mockPrismaService.passwordReset.updateMany).toHaveBeenCalledWith({
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
      _mockPrismaService.passwordReset.updateMany.mockResolvedValue({
        count: 0,
      });

      const result = await service.consumeToken(plainToken);

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      _mockPrismaService.passwordReset.updateMany.mockRejectedValue(dbError);

      const result = await service.consumeToken(plainToken);

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup expired and used tokens successfully', async () => {
      _mockPrismaService.passwordReset.deleteMany.mockResolvedValueOnce({
        count: 5,
      });

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(5);
      expect(_mockPrismaService.passwordReset.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [{ expiresAt: { lt: expect.any(Date) } }, { isUsed: true }],
        },
      });
    });

    it('should return 0 when no tokens to cleanup', async () => {
      _mockPrismaService.passwordReset.deleteMany.mockResolvedValue({
        count: 0,
      });

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      _mockPrismaService.passwordReset.deleteMany.mockRejectedValue(dbError);

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

      _mockPrismaService.passwordReset.findFirst.mockResolvedValueOnce(
        activeToken
      );

      const result = await service.hasActiveToken(userId);

      expect(result).toBe(true);
      expect(_mockPrismaService.passwordReset.findFirst).toHaveBeenCalledWith({
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
      _mockPrismaService.passwordReset.findFirst.mockResolvedValue(null);

      const result = await service.hasActiveToken(userId);

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      _mockPrismaService.passwordReset.findFirst.mockRejectedValue(dbError);

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
        expiresAt: new Date(
          Date.now() +
            TOKEN_EXPIRY_HOURS *
              MINUTES_PER_HOUR *
              SECONDS_PER_MINUTE *
              MILLISECONDS_PER_SECOND
        ),
        isUsed: false,
        createdAt: new Date(),
      };

      _mockPrismaService.passwordReset.create.mockResolvedValue(
        mockCreatedRecord
      );

      await service.generateToken('user-123', '192.168.1.1');

      expect(mockRandomBytes).toHaveBeenCalledWith(TOKEN_LENGTH_BYTES); // TOKEN_LENGTH_BYTES bytes for secure token generation
    });

    it('should never store plain text tokens in database', async () => {
      const mockCreatedRecord = {
        id: 'reset-123',
        userId: 'user-123',
        token: 'hashedtoken',
        hashedToken: 'hashedtoken',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        expiresAt: new Date(
          Date.now() +
            TOKEN_EXPIRY_HOURS *
              MINUTES_PER_HOUR *
              SECONDS_PER_MINUTE *
              MILLISECONDS_PER_SECOND
        ),
        isUsed: false,
        createdAt: new Date(),
      };

      _mockPrismaService.passwordReset.create.mockResolvedValue(
        mockCreatedRecord
      );

      await service.generateToken('user-123', '192.168.1.1');

      const callArgs = _mockPrismaService.passwordReset.create.mock.calls[0][0];
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
        expiresAt: new Date(
          Date.now() +
            TOKEN_EXPIRY_HOURS *
              MINUTES_PER_HOUR *
              SECONDS_PER_MINUTE *
              MILLISECONDS_PER_SECOND
        ),
        isUsed: false,
        createdAt: new Date(),
      };

      _mockPrismaService.passwordReset.create.mockResolvedValue(
        mockCreatedRecord
      );

      await service.generateToken('user-123', '192.168.1.1');

      const callArgs = _mockPrismaService.passwordReset.create.mock.calls[0][0];
      const expiresAt = callArgs.data.expiresAt;

      // Check that expiry is approximately 24 hours from now
      const expectedExpiry = new Date(
        beforeCall.getTime() +
          TOKEN_EXPIRY_HOURS *
            MINUTES_PER_HOUR *
            SECONDS_PER_MINUTE *
            MILLISECONDS_PER_SECOND
      );
      const tolerance = 1000; // 1 second tolerance

      expect(
        Math.abs(expiresAt.getTime() - expectedExpiry.getTime())
      ).toBeLessThan(tolerance);
    });
  });
});
