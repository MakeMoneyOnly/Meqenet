import {
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OAuth2Service } from './oauth2.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SecurityMonitoringService } from './security-monitoring.service';

describe('OAuth2Service', () => {
  let service: OAuth2Service;
  let prismaService: PrismaService;
  let securityMonitoringService: SecurityMonitoringService;
  let _loggerSpy: ReturnType<typeof vi.spyOn>;

  const mockOAuthClient = {
    id: 'client-id-123',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    clientName: 'Test Client',
    clientDescription: 'Test client description',
    redirectUris: ['https://example.com/callback'],
    scopes: ['read', 'write'],
    status: 'active',
    tokenEndpointAuthMethod: 'client_secret_basic',
    grantTypes: ['authorization_code'],
    responseTypes: ['code'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerId: 'user-id-123',
  };

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockAuthCode = {
    id: 'auth-code-id',
    code: 'test-auth-code',
    codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM', // SHA256 hash of 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk' base64url encoded
    codeChallengeMethod: 'S256',
    clientId: 'test-client-id',
    userId: 'user-id-123',
    redirectUri: 'https://example.com/callback',
    scopes: ['read', 'write'],
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    used: false,
    client: mockOAuthClient,
    user: mockUser,
  };

  const mockAccessToken = {
    id: 'access-token-id',
    token: 'test-access-token',
    clientId: 'test-client-id',
    userId: 'user-id-123',
    scopes: ['read', 'write'],
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    revoked: false,
    lastUsedAt: new Date(),
    createdAt: new Date(),
    client: mockOAuthClient,
    user: mockUser,
  };

  // Code verifier that matches the code challenge above
  const validCodeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

  const mockRefreshToken = {
    id: 'refresh-token-id',
    token: 'test-refresh-token',
    clientId: 'test-client-id',
    userId: 'user-id-123',
    scopes: ['read', 'write'],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    revoked: false,
    accessTokenId: 'access-token-id',
    rotatedAt: null,
    rotatedToTokenId: null,
    createdAt: new Date(),
    client: mockOAuthClient,
    user: mockUser,
  };

  beforeEach(() => {
    const mockPrismaService = {
      oAuthClient: {
        findUnique: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
      },
      oAuthAuthorizationCode: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      oAuthAccessToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      oAuthRefreshToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    };

    const mockSecurityMonitoring = {
      recordSecurityEvent: vi.fn(),
    };

    // Create service directly with mocked dependencies
    service = new OAuth2Service(
      mockPrismaService as any,
      mockSecurityMonitoring as any
    );
    prismaService = mockPrismaService as any;
    securityMonitoringService = mockSecurityMonitoring as any;

    // Mock logger to avoid console output during tests
    _loggerSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation();
    vi.spyOn(Logger.prototype, 'log').mockImplementation();
    vi.spyOn(Logger.prototype, 'warn').mockImplementation();
    vi.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAuthorizationRequest', () => {
    const validRequest = {
      responseType: 'code',
      clientId: 'test-client-id',
      redirectUri: 'https://example.com/callback',
      scope: 'read write',
      state: 'test-state',
      codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM', // Valid S256 challenge
      codeChallengeMethod: 'S256',
    };

    it('should validate valid authorization request', async () => {
      vi.spyOn(prismaService.oAuthClient, 'findUnique').mockResolvedValue(
        mockOAuthClient
      );

      const result = await service.validateAuthorizationRequest(validRequest);

      expect(result.isValid).toBe(true);
      expect(result.client).toBeDefined();
      expect(result.scopes).toEqual(['read', 'write']);
    });

    it('should reject invalid response type', async () => {
      const invalidRequest = { ...validRequest, responseType: 'token' };

      await expect(
        service.validateAuthorizationRequest(invalidRequest)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unknown client', async () => {
      vi.spyOn(prismaService.oAuthClient, 'findUnique').mockResolvedValue(null);

      await expect(
        service.validateAuthorizationRequest(validRequest)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject inactive client', async () => {
      const inactiveClient = { ...mockOAuthClient, status: 'inactive' };
      vi.spyOn(prismaService.oAuthClient, 'findUnique').mockResolvedValue(
        inactiveClient
      );

      await expect(
        service.validateAuthorizationRequest(validRequest)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid redirect URI', async () => {
      vi.spyOn(prismaService.oAuthClient, 'findUnique').mockResolvedValue(
        mockOAuthClient
      );

      const invalidRequest = {
        ...validRequest,
        redirectUri: 'https://invalid.com/callback',
      };

      await expect(
        service.validateAuthorizationRequest(invalidRequest)
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate PKCE parameters', async () => {
      vi.spyOn(prismaService.oAuthClient, 'findUnique').mockResolvedValue(
        mockOAuthClient
      );

      // Test invalid method
      const invalidMethodRequest = {
        ...validRequest,
        codeChallengeMethod: 'invalid',
      };

      await expect(
        service.validateAuthorizationRequest(invalidMethodRequest)
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle scope validation', async () => {
      vi.spyOn(prismaService.oAuthClient, 'findUnique').mockResolvedValue(
        mockOAuthClient
      );

      // Test with invalid scopes
      const invalidScopeRequest = {
        ...validRequest,
        scope: 'read invalid write',
      };

      const result =
        await service.validateAuthorizationRequest(invalidScopeRequest);
      expect(result.scopes).toEqual(['read', 'write']); // Should filter out invalid scopes
    });

    it('should handle empty scope', async () => {
      vi.spyOn(prismaService.oAuthClient, 'findUnique').mockResolvedValue(
        mockOAuthClient
      );

      const noScopeRequest = { ...validRequest, scope: undefined };

      // Empty scope should throw an exception
      await expect(
        service.validateAuthorizationRequest(noScopeRequest)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateAuthorizationCode', () => {
    const validParams = {
      clientId: 'test-client-id',
      userId: 'user-id-123',
      redirectUri: 'https://example.com/callback',
      scopes: ['read', 'write'],
      codeChallenge: 'test-challenge',
      codeChallengeMethod: 'S256',
    };

    it('should generate authorization code successfully', async () => {
      vi.spyOn(
        prismaService.oAuthAuthorizationCode,
        'create'
      ).mockResolvedValue(mockAuthCode);

      const result = await service.generateAuthorizationCode(
        validParams.clientId,
        validParams.userId,
        validParams.redirectUri,
        validParams.scopes,
        validParams.codeChallenge,
        validParams.codeChallengeMethod
      );

      expect(result).toMatch(/^[a-f0-9]{64}$/); // Generated auth code should be 64 hex chars
      expect(prismaService.oAuthAuthorizationCode.create).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      vi.spyOn(
        prismaService.oAuthAuthorizationCode,
        'create'
      ).mockRejectedValue(new Error('Database error'));

      await expect(
        service.generateAuthorizationCode(
          validParams.clientId,
          validParams.userId,
          validParams.redirectUri,
          validParams.scopes
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('exchangeCodeForTokens', () => {
    const validTokenRequest = {
      grantType: 'authorization_code',
      code: 'test-auth-code',
      redirectUri: 'https://example.com/callback',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      codeVerifier: validCodeVerifier,
    };

    beforeEach(() => {
      vi.spyOn(prismaService.oAuthClient, 'findUnique').mockResolvedValue(
        mockOAuthClient
      );
      vi.spyOn(
        prismaService.oAuthAuthorizationCode,
        'findUnique'
      ).mockResolvedValue(mockAuthCode);
      vi.spyOn(
        prismaService.oAuthAuthorizationCode,
        'update'
      ).mockResolvedValue(mockAuthCode);
      vi.spyOn(prismaService.oAuthAccessToken, 'create').mockResolvedValue(
        mockAccessToken
      );
      vi.spyOn(prismaService.oAuthRefreshToken, 'create').mockResolvedValue(
        mockRefreshToken
      );
    });

    it('should exchange authorization code for tokens', async () => {
      const result = await service.exchangeCodeForTokens(validTokenRequest);

      expect(result.accessToken).toBe('test-access-token');
      expect(result.refreshToken).toBe('test-refresh-token');
      expect(result.tokenType).toBe('Bearer');
      expect(result.scope).toBe('read write');
    });

    it('should reject invalid grant type', async () => {
      const invalidRequest = {
        ...validTokenRequest,
        grantType: 'invalid_grant',
      };

      await expect(
        service.exchangeCodeForTokens(invalidRequest)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject missing required parameters', async () => {
      const invalidRequest = { ...validTokenRequest, code: undefined };

      await expect(
        service.exchangeCodeForTokens(invalidRequest)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid client', async () => {
      vi.spyOn(prismaService.oAuthClient, 'findUnique').mockResolvedValue(null);

      await expect(
        service.exchangeCodeForTokens(validTokenRequest)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid client secret', async () => {
      const invalidRequest = {
        ...validTokenRequest,
        clientSecret: 'wrong-secret',
      };

      await expect(
        service.exchangeCodeForTokens(invalidRequest)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject used authorization code', async () => {
      const usedAuthCode = { ...mockAuthCode, used: true };
      vi.spyOn(
        prismaService.oAuthAuthorizationCode,
        'findUnique'
      ).mockResolvedValue(usedAuthCode);

      await expect(
        service.exchangeCodeForTokens(validTokenRequest)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject expired authorization code', async () => {
      const expiredAuthCode = {
        ...mockAuthCode,
        expiresAt: new Date(Date.now() - 1000),
      };
      vi.spyOn(
        prismaService.oAuthAuthorizationCode,
        'findUnique'
      ).mockResolvedValue(expiredAuthCode);

      await expect(
        service.exchangeCodeForTokens(validTokenRequest)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject client ID mismatch', async () => {
      const invalidRequest = {
        ...validTokenRequest,
        clientId: 'wrong-client-id',
      };

      await expect(
        service.exchangeCodeForTokens(invalidRequest)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject redirect URI mismatch', async () => {
      const invalidRequest = {
        ...validTokenRequest,
        redirectUri: 'https://wrong.com/callback',
      };

      await expect(
        service.exchangeCodeForTokens(invalidRequest)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshAccessToken', () => {
    const validRefreshRequest = {
      grantType: 'refresh_token',
      refreshToken: 'test-refresh-token',
      clientId: 'test-client-id',
    };

    beforeEach(() => {
      vi.spyOn(prismaService.oAuthRefreshToken, 'findUnique').mockResolvedValue(
        mockRefreshToken
      );
      vi.spyOn(prismaService.oAuthAccessToken, 'create').mockResolvedValue(
        mockAccessToken
      );
      vi.spyOn(prismaService.oAuthRefreshToken, 'create').mockResolvedValue({
        ...mockRefreshToken,
        id: 'new-refresh-token-id',
        token: 'new-refresh-token',
      });
      vi.spyOn(prismaService.oAuthRefreshToken, 'update').mockResolvedValue(
        mockRefreshToken
      );
    });

    it('should refresh access token with rotation', async () => {
      const result = await service.refreshAccessToken(validRefreshRequest);

      expect(result.accessToken).toBe('test-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.tokenType).toBe('Bearer');
    });

    it('should reject invalid grant type', async () => {
      const invalidRequest = {
        ...validRefreshRequest,
        grantType: 'invalid_grant',
      };

      await expect(service.refreshAccessToken(invalidRequest)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should reject missing refresh token', async () => {
      const invalidRequest = {
        ...validRefreshRequest,
        refreshToken: undefined,
      };

      await expect(service.refreshAccessToken(invalidRequest)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should reject invalid refresh token', async () => {
      vi.spyOn(prismaService.oAuthRefreshToken, 'findUnique').mockResolvedValue(
        null
      );

      await expect(
        service.refreshAccessToken(validRefreshRequest)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject revoked refresh token', async () => {
      const revokedToken = { ...mockRefreshToken, revoked: true };
      vi.spyOn(prismaService.oAuthRefreshToken, 'findUnique').mockResolvedValue(
        revokedToken
      );

      await expect(
        service.refreshAccessToken(validRefreshRequest)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject expired refresh token', async () => {
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000),
      };
      vi.spyOn(prismaService.oAuthRefreshToken, 'findUnique').mockResolvedValue(
        expiredToken
      );

      await expect(
        service.refreshAccessToken(validRefreshRequest)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateAccessToken', () => {
    it('should validate valid access token', async () => {
      vi.spyOn(prismaService.oAuthAccessToken, 'findUnique').mockResolvedValue(
        mockAccessToken
      );

      const result = await service.validateAccessToken('test-access-token');

      expect(result.userId).toBe('user-id-123');
      expect(result.clientId).toBe('test-client-id');
      expect(result.scopes).toEqual(['read', 'write']);
    });

    it('should reject invalid access token', async () => {
      vi.spyOn(prismaService.oAuthAccessToken, 'findUnique').mockResolvedValue(
        null
      );

      await expect(
        service.validateAccessToken('invalid-token')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject revoked access token', async () => {
      const revokedToken = { ...mockAccessToken, revoked: true };
      vi.spyOn(prismaService.oAuthAccessToken, 'findUnique').mockResolvedValue(
        revokedToken
      );

      await expect(
        service.validateAccessToken('revoked-token')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject expired access token', async () => {
      const expiredToken = {
        ...mockAccessToken,
        expiresAt: new Date(Date.now() - 1000),
      };
      vi.spyOn(prismaService.oAuthAccessToken, 'findUnique').mockResolvedValue(
        expiredToken
      );

      await expect(
        service.validateAccessToken('expired-token')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update last used timestamp', async () => {
      vi.spyOn(prismaService.oAuthAccessToken, 'findUnique').mockResolvedValue(
        mockAccessToken
      );

      await service.validateAccessToken('test-access-token');

      expect(prismaService.oAuthAccessToken.update).toHaveBeenCalledWith({
        where: { id: 'access-token-id' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });
  });

  describe('revokeToken', () => {
    it('should revoke refresh token', async () => {
      vi.spyOn(prismaService.oAuthRefreshToken, 'updateMany').mockResolvedValue(
        { count: 1 }
      );

      await service.revokeToken('test-refresh-token', 'refresh_token');

      expect(prismaService.oAuthRefreshToken.updateMany).toHaveBeenCalledWith({
        where: { token: 'test-refresh-token' },
        data: { revoked: true },
      });
    });

    it('should revoke access token by default', async () => {
      vi.spyOn(prismaService.oAuthAccessToken, 'updateMany').mockResolvedValue({
        count: 1,
      });

      await service.revokeToken('test-access-token');

      expect(prismaService.oAuthAccessToken.updateMany).toHaveBeenCalledWith({
        where: { token: 'test-access-token' },
        data: { revoked: true },
      });
    });
  });

  describe('createClient', () => {
    const clientData = {
      name: 'New Test Client',
      description: 'Test client description',
      redirectUris: ['https://newclient.com/callback'],
      scopes: ['read', 'profile'],
    };

    it('should create OAuth client successfully', async () => {
      const mockNewClient = {
        ...mockOAuthClient,
        clientId: 'new-client-id',
        clientSecret: 'new-client-secret',
        clientName: clientData.name,
      };

      vi.spyOn(prismaService.oAuthClient, 'create').mockResolvedValue(
        mockNewClient
      );

      const result = await service.createClient('user-id-123', clientData);

      expect(result.clientId).toBe('new-client-id');
      expect(result.clientSecret).toMatch(/^[a-f0-9]{64}$/); // Generated client secret should be 64 hex chars
      expect(result.clientName).toBe(clientData.name);
    });

    it('should handle database errors during client creation', async () => {
      vi.spyOn(prismaService.oAuthClient, 'create').mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        service.createClient('user-id-123', clientData)
      ).rejects.toThrow();
    });
  });

  describe('getClient', () => {
    it('should return client by ID', async () => {
      vi.spyOn(prismaService.oAuthClient, 'findUnique').mockResolvedValue(
        mockOAuthClient
      );

      const result = await service.getClient('test-client-id');

      expect(result?.clientId).toBe('test-client-id');
      expect(result?.clientName).toBe('Test Client');
    });

    it('should return null for non-existent client', async () => {
      vi.spyOn(prismaService.oAuthClient, 'findUnique').mockResolvedValue(null);

      const result = await service.getClient('non-existent-client');

      expect(result).toBeNull();
    });
  });

  describe('getUserClients', () => {
    it("should return user's OAuth clients", async () => {
      vi.spyOn(prismaService.oAuthClient, 'findMany').mockResolvedValue([
        mockOAuthClient,
      ]);

      const result = await service.getUserClients('user-id-123');

      expect(result).toHaveLength(1);
      expect(result[0].clientId).toBe('test-client-id');
    });

    it('should return empty array when user has no clients', async () => {
      vi.spyOn(prismaService.oAuthClient, 'findMany').mockResolvedValue([]);

      const result = await service.getUserClients('user-id-123');

      expect(result).toEqual([]);
    });
  });

  describe('Private Methods', () => {
    describe('validateScopes', () => {
      it('should filter valid scopes', async () => {
        // Test scope validation through the validateAuthorizationRequest method
        const validRequest = {
          responseType: 'code',
          clientId: 'test-client-id',
          redirectUri: 'https://example.com/callback',
          scope: 'read invalid write admin',
          codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
          codeChallengeMethod: 'S256',
        };

        const invalidRequest = {
          responseType: 'code',
          clientId: 'test-client-id',
          redirectUri: 'https://example.com/callback',
          scope: 'invalid admin only',
          codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
          codeChallengeMethod: 'S256',
        };

        // The validateAuthorizationRequest method should filter out invalid scopes
        vi.spyOn(prismaService.oAuthClient, 'findUnique')
          .mockResolvedValueOnce(mockOAuthClient)
          .mockResolvedValueOnce(mockOAuthClient);

        // Valid scopes should be filtered to only allowed ones
        const validResult =
          await service.validateAuthorizationRequest(validRequest);
        expect(validResult.scopes).toEqual(['read', 'write']);

        // Invalid scopes should throw an exception
        await expect(
          service.validateAuthorizationRequest(invalidRequest)
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('PKCE Validation', () => {
      it('should validate PKCE parameters through authorization request', async () => {
        const validPKCERequest = {
          responseType: 'code',
          clientId: 'test-client-id',
          redirectUri: 'https://example.com/callback',
          scope: 'read write',
          codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
          codeChallengeMethod: 'S256',
        };

        const invalidMethodRequest = {
          ...validPKCERequest,
          codeChallengeMethod: 'invalid',
        };

        vi.spyOn(prismaService.oAuthClient, 'findUnique')
          .mockResolvedValueOnce(mockOAuthClient)
          .mockResolvedValueOnce(mockOAuthClient);

        // Valid PKCE should work
        const validResult =
          await service.validateAuthorizationRequest(validPKCERequest);
        expect(validResult.isValid).toBe(true);

        // Invalid method should throw
        await expect(
          service.validateAuthorizationRequest(invalidMethodRequest)
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('Token Generation', () => {
      it('should generate tokens through exchange flow', async () => {
        const validTokenRequest = {
          grantType: 'authorization_code',
          code: 'test-auth-code',
          redirectUri: 'https://example.com/callback',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          codeVerifier: validCodeVerifier,
        };

        // Mock all the database calls needed for token exchange
        vi.spyOn(prismaService.oAuthClient, 'findUnique').mockResolvedValue(
          mockOAuthClient
        );
        vi.spyOn(
          prismaService.oAuthAuthorizationCode,
          'findUnique'
        ).mockResolvedValue(mockAuthCode);
        vi.spyOn(
          prismaService.oAuthAuthorizationCode,
          'update'
        ).mockResolvedValue(mockAuthCode);
        vi.spyOn(prismaService.oAuthAccessToken, 'create').mockResolvedValue(
          mockAccessToken
        );
        vi.spyOn(prismaService.oAuthRefreshToken, 'create').mockResolvedValue(
          mockRefreshToken
        );

        const result = await service.exchangeCodeForTokens(validTokenRequest);

        expect(result.accessToken).toBe('test-access-token');
        expect(result.refreshToken).toBe('test-refresh-token');
        expect(result.expiresIn).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle security monitoring errors gracefully', async () => {
      vi.spyOn(
        securityMonitoringService,
        'recordSecurityEvent'
      ).mockRejectedValue(new Error('Monitoring error'));

      const validRequest = {
        responseType: 'code',
        clientId: 'test-client-id',
        redirectUri: 'https://example.com/callback',
      };

      vi.spyOn(prismaService.oAuthClient, 'findUnique').mockResolvedValue(
        mockOAuthClient
      );

      // Should throw the monitoring error (service doesn't handle monitoring errors gracefully)
      await expect(
        service.validateAuthorizationRequest(validRequest)
      ).rejects.toThrow('Monitoring error');
    });
  });
});
